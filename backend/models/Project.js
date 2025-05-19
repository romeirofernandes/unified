const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["text", "email", "mcq", "slider", "textarea"],
  },
  label: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [
    {
      label: String,
      value: String,
    },
  ], // For MCQ fields
  config: {
    min: Number, // For slider
    max: Number, // For slider
    step: Number, // For slider
  },
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: String,
  fields: [fieldSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
});

module.exports = mongoose.model("Project", projectSchema);
