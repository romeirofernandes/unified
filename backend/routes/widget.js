const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const { submitFeedback } = require("../services/project-lifecycle");
const { consumeLimit } = require("../services/rate-limit");
const router = express.Router();

// The widget is public: expose questions and accept feedback, never owner data/actions.
router.use("/:projectId", async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!/^[a-f0-9]{24}$/i.test(req.params.projectId)) return res.status(404).json({ message: "Form not found." });
  try {
    await consumeLimit(`widget-ip:${req.ip}`, req.method === "POST" ? 20 : 120);
    if (req.method === "POST") await consumeLimit(`widget-project:${req.params.projectId}`, 120);
    next();
  } catch (error) { res.status(error.status || 503).json({ message: error.status ? error.message : "Feedback is temporarily unavailable." }); }
});
router.get("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId }).select("name fields appearance theme userId").lean();
    if (!project || !await User.exists({ _id: project.userId, deleting: { $ne: true } })) return res.status(404).json({ message: "Form not found." });
    const { name, fields, appearance, theme } = project;
    res.json({ name, fields, appearance, theme });
  } catch { res.status(503).json({ message: "Could not load feedback form." }); }
});
router.post("/:projectId", async (req, res) => {
  try {
    const feedback = await submitFeedback({ _id: req.params.projectId }, req.body?.formAnswers);
    res.status(201).json({ id: feedback._id });
  } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : "Could not submit feedback." }); }
});
module.exports = router;
