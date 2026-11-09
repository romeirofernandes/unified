const express = require("express");
const mongoose = require("mongoose");
const { createHash } = require("node:crypto");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const router = express.Router();
const statuses = ["todo", "in_progress", "done"];

router.use("/:projectId", (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.projectId)) return res.status(400).json({ message: "Invalid project." });
  next();
});
const owner = (req) => ({ _id: req.params.projectId, userId: req.user.id });
const visible = (project) => project.workbenchIssues.filter((issue) => !issue.deleted);
function fields(body) {
  if (!body || typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 2000 || typeof body.description !== "string" || body.description.length > 10000 || !statuses.includes(body.status)) return null;
  if (body.position !== undefined && (typeof body.position !== "number" || !Number.isFinite(body.position) || Math.abs(body.position) > Number.MAX_SAFE_INTEGER)) return null;
  return { title: body.title.trim(), description: body.description.trim(), status: body.status, ...(body.position !== undefined ? { position: body.position } : {}) };
}

router.get("/:projectId", async (req, res) => {
  try {
    await Project.updateOne({ ...owner(req), workbenchIssues: { $elemMatch: { status: "backlog" } } }, { $set: { "workbenchIssues.$[issue].status": "todo" } }, { arrayFilters: [{ "issue.status": "backlog" }] });
    const project = await Project.findOne(owner(req)).select("+workbenchIssues");
    if (!project) return res.status(404).json({ message: "Project not found." });
    // Keep imported keys on deleted cards so summaries cannot resurrect them.
    const imported = new Set(project.workbenchIssues.map((issue) => issue.sourceKey));
    for (const title of project.feedbackSummary?.features || []) {
      if (typeof title !== "string" || !title.trim()) continue;
      const sourceKey = createHash("sha256").update(title.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex");
      const responseIds = [...new Set((project.feedbackSummary?.evidence || [])
        .filter((item) => item?.title === title && Array.isArray(item.responseIds))
        .flatMap((item) => item.responseIds).filter((id) => mongoose.isValidObjectId(id)))];
      if (imported.has(sourceKey)) {
        if (responseIds.length) await Project.updateOne({ ...owner(req), "workbenchIssues.sourceKey": sourceKey }, { $addToSet: { "workbenchIssues.$.responseIds": { $each: responseIds } } });
        continue;
      }
      imported.add(sourceKey);
      await Project.updateOne({ ...owner(req), "workbenchIssues.sourceKey": { $ne: sourceKey } }, {
        $push: { workbenchIssues: { title: title.trim().slice(0, 2000), sourceKey, responseIds, status: "todo", description: "", position: Date.now(), createdAt: new Date() } },
      });
    }
    const updated = await Project.findOne(owner(req)).select("+workbenchIssues");
    if (!updated) return res.status(404).json({ message: "Project not found." });
    res.json(visible(updated));
  } catch { res.status(500).json({ message: "Couldn’t load the workbench. Please try again." }); }
});
router.get("/:projectId/:issueId/evidence", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue." });
  try {
    const project = await Project.findOne(owner(req)).select("+workbenchIssues");
    const issue = project?.workbenchIssues.find((item) => String(item._id) === req.params.issueId && !item.deleted);
    if (!issue) return res.status(404).json({ message: "Issue not found." });
    const feedbacks = await Feedback.find({ projectId: project._id, _id: { $in: issue.responseIds || [] } }).sort({ timestamp: -1 }).lean();
    const users = new Set();
    let unidentifiedResponseCount = 0;
    const responses = feedbacks.map((feedback) => {
      const answers = Object.entries(feedback.formAnswers || {});
      const email = answers.find(([id, value]) => project.fields.some((field) => String(field._id) === id && field.type === "email") && typeof value === "string" && value.trim())?.[1];
      if (email) users.add(email.trim().toLowerCase()); else unidentifiedResponseCount++;
      return { _id: feedback._id, timestamp: feedback.timestamp, answers: answers
        .filter(([id]) => !project.fields.some((field) => String(field._id) === id && field.type === "email"))
        .map(([id, answer]) => ({ question: project.fields.find((field) => String(field._id) === id)?.label || "Removed question", answer })) };
    });
    res.json({ responses, responseCount: responses.length, affectedUserCount: users.size, unidentifiedResponseCount });
  } catch { res.status(500).json({ message: "Couldn’t load the original feedback. Please try again." }); }
});
router.post("/:projectId", async (req, res) => {
  const input = fields(req.body);
  if (!input) return res.status(400).json({ message: "Add a title (up to 2,000 characters), description (up to 10,000 characters), and valid status." });
  try {
    const project = await Project.findOneAndUpdate(owner(req), { $push: { workbenchIssues: { position: Date.now(), ...input } } }, { new: true, runValidators: true }).select("+workbenchIssues");
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.status(201).json(visible(project));
  } catch { res.status(500).json({ message: "Couldn’t create the issue. Please try again." }); }
});
router.put("/:projectId/:issueId", async (req, res) => {
  const input = fields(req.body);
  if (!input || !mongoose.isValidObjectId(req.params.issueId)) return res.status(400).json({ message: "Add a valid issue title, description, and status." });
  try {
    const project = await Project.findOneAndUpdate({ ...owner(req), workbenchIssues: { $elemMatch: { _id: req.params.issueId, deleted: false } } }, {
      $set: Object.fromEntries(Object.entries(input).map(([key, value]) => [`workbenchIssues.$.${key}`, value])),
    }, { new: true, runValidators: true }).select("+workbenchIssues");
    if (!project) return res.status(404).json({ message: "Issue not found." });
    res.json(visible(project));
  } catch { res.status(500).json({ message: "Couldn’t update the issue. Please try again." }); }
});
router.delete("/:projectId/:issueId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue." });
  try {
    const project = await Project.findOneAndUpdate({ ...owner(req), workbenchIssues: { $elemMatch: { _id: req.params.issueId, deleted: false } } }, { $set: { "workbenchIssues.$.deleted": true } }, { new: true }).select("+workbenchIssues");
    if (!project) return res.status(404).json({ message: "Issue not found." });
    res.json(visible(project));
  } catch { res.status(500).json({ message: "Couldn’t delete the issue. Please try again." }); }
});
module.exports = router;
