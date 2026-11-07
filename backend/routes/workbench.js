const express = require("express");
const mongoose = require("mongoose");
const { createHash } = require("node:crypto");
const Project = require("../models/Project");
const router = express.Router();
const statuses = ["backlog", "todo", "in_progress", "done"];

router.use("/:projectId", (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.projectId)) return res.status(400).json({ message: "Invalid project." });
  next();
});
const owner = (req) => ({ _id: req.params.projectId, userId: req.user.id });
const visible = (project) => project.workbenchIssues.filter((issue) => !issue.deleted);
function fields(body) {
  if (!body || typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 2000 || typeof body.description !== "string" || body.description.length > 10000 || !statuses.includes(body.status)) return null;
  return { title: body.title.trim(), description: body.description.trim(), status: body.status };
}

router.get("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne(owner(req)).select("+workbenchIssues");
    if (!project) return res.status(404).json({ message: "Project not found." });
    // Keep imported keys on deleted cards so summaries cannot resurrect them.
    for (const title of project.feedbackSummary?.features || []) {
      if (typeof title !== "string" || !title.trim()) continue;
      const sourceKey = createHash("sha256").update(title.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex");
      await Project.updateOne({ ...owner(req), "workbenchIssues.sourceKey": { $ne: sourceKey } }, {
        $push: { workbenchIssues: { title: title.trim().slice(0, 2000), sourceKey, status: "backlog", description: "", createdAt: new Date() } },
      });
    }
    const updated = await Project.findOne(owner(req)).select("+workbenchIssues");
    if (!updated) return res.status(404).json({ message: "Project not found." });
    res.json(visible(updated));
  } catch { res.status(500).json({ message: "Couldn’t load the workbench. Please try again." }); }
});
router.post("/:projectId", async (req, res) => {
  const input = fields(req.body);
  if (!input) return res.status(400).json({ message: "Add a title (up to 2,000 characters), description (up to 10,000 characters), and valid status." });
  try {
    const project = await Project.findOneAndUpdate(owner(req), { $push: { workbenchIssues: input } }, { new: true, runValidators: true }).select("+workbenchIssues");
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
