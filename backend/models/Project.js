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
    launcher: {
      type: new mongoose.Schema({
        style: { type: String, enum: require("../../shared/feedback-launcher.json").styles },
        icon: { type: String, enum: require("../../shared/feedback-launcher.json").icons },
        label: { type: String, trim: true, minlength: 1, maxlength: 32 },
        position: { type: String, enum: require("../../shared/feedback-launcher.json").positions },
        colors: {
          light: new mongoose.Schema({ background: { type: String, match: /^#[0-9a-f]{6}$/i }, text: { type: String, match: /^#[0-9a-f]{6}$/i } }, { _id: false }),
          dark: new mongoose.Schema({ background: { type: String, match: /^#[0-9a-f]{6}$/i }, text: { type: String, match: /^#[0-9a-f]{6}$/i } }, { _id: false }),
        },
      }, { _id: false }),
    },
  },
  { _id: false },
);

const digestChannelSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  cadence: { type: String, enum: ["hourly", "daily"], default: "daily" },
  since: Date,
  nextRunAt: Date,
  lastSentAt: Date,
  lastCheckedAt: Date,
  lastCount: Number,
  error: String,
  pendingUntil: Date,
  pendingSummary: mongoose.Schema.Types.Mixed,
  lastSummaryHash: String,
  lockToken: String,
  lockUntil: Date,
  testAfter: Date,
}, { _id: false });

const projectSchema = new mongoose.Schema({
  writeVersion: { type: Number, default: 0 },
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
  shippingUpdatesEnabled: { type: Boolean, default: false },
  appearance: {
    type: appearanceSchema,
    default: () => ({ preset: "unified", colors: {} }),
  },
  workbenchIssues: { type: [new mongoose.Schema({
    title: { type: String, required: true, maxlength: 2000 },
    description: { type: String, default: "", maxlength: 10000 },
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
    position: Number,
    sourceKey: String,
    responseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  })], default: [], select: false },
  feedbackSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  summaryLock: { type: String, select: false },
  summaryLockUntil: { type: Date, select: false },
  slackOAuthStateHash: { type: String, select: false },
  slackOAuthStateUntil: { type: Date, select: false },
  slackWorkspace: String,
  slackChannel: String,
  slackChannelId: String,
  slackBotTokenEncrypted: { type: String, select: false },
  slackWebhookEncrypted: { type: String, select: false },
  notifications: { slack: { type: digestChannelSchema, default: () => ({}) }, email: { type: digestChannelSchema, default: () => ({}) } },
  submissionKeyEncrypted: { type: String, select: false },
  submissionKeyHash: { type: String, select: false },
  fields: { type: [fieldSchema], validate: { validator: (fields) => fields.length > 0, message: "Add at least one question before saving." } },
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
projectSchema.index({ slackOAuthStateHash: 1 }, { sparse: true });
projectSchema.index({ "notifications.slack.enabled": 1, "notifications.slack.nextRunAt": 1 });
projectSchema.index({ "notifications.email.enabled": 1, "notifications.email.nextRunAt": 1 });

module.exports = mongoose.model("Project", projectSchema);
