const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["text", "email", "mcq", "slider", "textarea", "date"],
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

const presets = require("../../shared/form-themes.json");
const paletteSchema = new mongoose.Schema(
  Object.fromEntries(
    ["accent", "background", "surface", "text", "muted", "border"].map(
      (key) => [key, { type: String, match: /^#[0-9a-f]{6}$/i }],
    ),
  ),
  { _id: false },
);
const appearanceSchema = new mongoose.Schema(
  {
    preset: {
      type: String,
      enum: presets.map((preset) => preset.id),
      default: "unified",
    },
    font: { type: String, enum: require("../../shared/form-fonts.json") },
    colors: { light: paletteSchema, dark: paletteSchema },
  },
  { _id: false },
);

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
  appearance: {
    type: appearanceSchema,
    default: () => ({ preset: "unified", colors: {} }),
  },
  feedbackSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  summaryLock: { type: String, select: false },
  summaryLockUntil: { type: Date, select: false },
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

projectSchema.index({ userId: 1 });

module.exports = mongoose.model("Project", projectSchema);
