const express = require("express");
const { randomUUID } = require("node:crypto");
const router = express.Router();
const Feedback = require("../models/Feedback");
const Project = require("../models/Project");
const { submitFeedback } = require("../services/project-lifecycle");
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
    res.json(feedback);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
});

// A database lease prevents duplicate generation across concurrent requests and servers.
router.post("/project/:projectId/summary", async (req, res) => {
  const owner = { _id: req.params.projectId, userId: req.user.id };
  const token = randomUUID();
  let locked = false;
  try {
    const project = await Project.findOne(owner).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    const feedbacks = await Feedback.find({ projectId: project._id }).sort({ timestamp: -1 }).lean();
    if (!feedbacks.length) return res.status(400).json({ message: "Collect a response before generating a summary." });
    const responseIds = feedbacks.map((feedback) => String(feedback._id)).sort();
    const saved = project.feedbackSummary;
    if (saved?.responseIds && responseIds.every((id) => saved.responseIds.includes(id))) return res.json(saved);
    const lease = await Project.findOneAndUpdate({
      ...owner,
      $or: [{ summaryLockUntil: { $exists: false } }, { summaryLockUntil: null }, { summaryLockUntil: { $lt: new Date() } }],
    }, { $set: { summaryLock: token, summaryLockUntil: new Date(Date.now() + 10 * 60 * 1000) } }, { new: true }).lean();
    if (!lease) return res.status(409).json({ message: "A summary is already being generated. Please try again shortly." });
    locked = true;
    // Another request may have finished after our first read and before the lease.
    if (lease.feedbackSummary?.responseIds && responseIds.every((id) => lease.feedbackSummary.responseIds.includes(id))) return res.json(lease.feedbackSummary);
    const summary = { ...await summarizeFeedback(project, feedbacks), responseIds, responseCount: responseIds.length };
    const updated = await Project.findOneAndUpdate({ ...owner, summaryLock: token }, {
      $set: { feedbackSummary: summary }, $unset: { summaryLock: 1, summaryLockUntil: 1 },
    }, { new: true });
    if (!updated) return res.status(409).json({ message: "The summary could not be saved. Please try again." });
    res.json(summary);
  } catch (error) {
    res.status(error.status || 502).json({ message: error.status ? error.message : "Couldn’t generate a summary. Please try again later." });
  } finally {
    if (locked) await Project.updateOne({ ...owner, summaryLock: token }, { $unset: { summaryLock: 1, summaryLockUntil: 1 } }).catch(() => {});
  }
});

module.exports = router;
