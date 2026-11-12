const express = require("express");
const { randomUUID } = require("node:crypto");
const router = express.Router();
const Feedback = require("../models/Feedback");
const Project = require("../models/Project");
const mongoose = require("mongoose");
const { submitFeedback, resetFeedback } = require("../services/project-lifecycle");
const { reconcileIssues } = require("../services/workbench-summary");
const { summarizeFeedback } = require("../services/feedback-summary");

// Submit feedback
router.post("/", async (req, res) => {
  try {
    const { projectId, formAnswers } = req.body;

    const feedback = await submitFeedback({ _id: projectId, userId: req.user.id }, formAnswers, req.body.subscriptionEmail);
    res.status(201).json(feedback);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Error submitting feedback" });
  }
});

// Get all feedback for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const feedback = await Feedback.find({
      projectId: req.params.projectId,
    }).sort({ timestamp: -1 });
    const issues = (await Project.findById(project._id).select("+workbenchIssues").lean())?.workbenchIssues || [];
    res.json(feedback.map(item => ({ ...item.toObject(), issues: issues.filter(issue => !issue.deleted && (item.issueIds?.some(id => String(id) === String(issue._id)) || issue.responseIds?.some(id => String(id) === String(item._id)))).map(({ _id, title, status }) => ({ _id, title, status })) })));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
});

// A database lease prevents duplicate generation across concurrent requests and servers.
router.post("/project/:projectId/reset", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.projectId) || req.body?.confirm !== true) return res.status(400).json({ message: "Confirm the response reset for a valid project." });
  try { res.json(await resetFeedback({ _id: req.params.projectId, userId: req.user.id })); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : "Could not reset responses. Please try again." }); }
});

router.post("/project/:projectId/summary", async (req, res) => {
  const owner = { _id: req.params.projectId, userId: req.user.id };
  const token = randomUUID();
  let locked = false;
  try {
    const project = await Project.findOne(owner).select("+workbenchIssues").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    const feedbacks = await Feedback.find({ projectId: project._id }).sort({ timestamp: -1 }).lean();
    if (!feedbacks.length) return res.status(400).json({ message: "Collect a response before generating a summary." });
    const responseIds = feedbacks.map((feedback) => String(feedback._id)).sort();
    const saved = project.feedbackSummary;
    if (saved?.schemaVersion === 2 && Array.isArray(saved?.evidence) && saved?.responseIds && responseIds.every((id) => saved.responseIds.includes(id))) return res.json(saved);
    const lease = await Project.findOneAndUpdate({
      ...owner,
      feedbackGeneration: project.feedbackGeneration ?? null,
      $or: [{ summaryLockUntil: { $exists: false } }, { summaryLockUntil: null }, { summaryLockUntil: { $lt: new Date() } }],
    }, { $set: { summaryLock: token, summaryLockUntil: new Date(Date.now() + 10 * 60 * 1000) } }, { new: true }).lean();
    if (!lease) return res.status(409).json({ message: "A summary is already being generated. Please try again shortly." });
    locked = true;
    // Another request may have finished after our first read and before the lease.
    if (lease.feedbackSummary?.schemaVersion === 2 && Array.isArray(lease.feedbackSummary?.evidence) && lease.feedbackSummary?.responseIds && responseIds.every((id) => lease.feedbackSummary.responseIds.includes(id))) return res.json(lease.feedbackSummary);
    const summary = { ...await summarizeFeedback(project, feedbacks), responseIds, responseCount: responseIds.length };
    const updated = await mongoose.connection.transaction(async session => {
      const current = await Project.findOne({ ...owner, summaryLock: token }).select("+workbenchIssues").session(session).lean();
      if (!current) return null;
      const issues = reconcileIssues(current.workbenchIssues || [], summary);
      const result = await Project.findOneAndUpdate({ ...owner, summaryLock: token }, {
        $set: { feedbackSummary: summary, workbenchIssues: issues }, $unset: { summaryLock: 1, summaryLockUntil: 1 },
      }, { new: true, session });
      const tags = new Map(responseIds.map(id => [id, []]));
      for (const issue of issues.filter(issue => !issue.deleted)) {
        for (const id of issue.responseIds) tags.get(String(id))?.push(issue._id);
      }
      await Feedback.bulkWrite([...tags].map(([id, issueIds]) => ({ updateOne: {
        filter: { _id: id, projectId: project._id }, update: { $set: { issueIds } },
      } })), { session });
      return result;
    });
    if (!updated) return res.status(409).json({ message: "The summary could not be saved. Please try again." });
    res.json(summary);
  } catch (error) {
    res.status(error.status || 502).json({ message: error.status ? error.message : "Couldn’t generate a summary. Please try again later." });
  } finally {
    if (locked) await Project.updateOne({ ...owner, summaryLock: token }, { $unset: { summaryLock: 1, summaryLockUntil: 1 } }).catch(() => {});
  }
});

module.exports = router;
