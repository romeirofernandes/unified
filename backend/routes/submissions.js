const express = require("express");
const { createHash } = require("node:crypto");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const { validateAnswers } = require("../services/submission-answers");
const router = express.Router();
router.post("/:projectId", async (req, res) => {
  try {
    const key = req.headers.authorization?.match(/^Bearer (uf_[a-f0-9]{64})$/)?.[1];
    if (!key) return res.status(401).json({ message: "Provide a project submission key as a Bearer token." });
    if (!/^[a-f0-9]{24}$/i.test(req.params.projectId)) return res.status(404).json({ message: "Project not found" });
    const project = await Project.findOne({ _id: req.params.projectId, submissionKeyHash: createHash("sha256").update(key).digest("hex") });
    if (!project) return res.status(401).json({ message: "Invalid or revoked submission key." });
    const formAnswers = validateAnswers(project.fields, req.body?.formAnswers);
    const feedback = await Feedback.create({ projectId: project._id, formAnswers });
    return res.status(201).json({ id: feedback._id });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Could not submit feedback." });
  }
});
module.exports = router;
