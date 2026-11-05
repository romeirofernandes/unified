const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  formAnswers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
