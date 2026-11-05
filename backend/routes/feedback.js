const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const Project = require("../models/Project");

// Submit feedback
router.post("/", async (req, res) => {
  try {
    const { projectId, formAnswers } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const feedback = new Feedback({
      projectId,
      formAnswers,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting feedback", error: error.message });
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

module.exports = router;
