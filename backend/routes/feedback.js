const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// Submit feedback
router.post("/", async (req, res) => {
  try {
    const { projectId, formAnswers } = req.body;

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
