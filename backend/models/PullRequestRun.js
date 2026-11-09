const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, required: true },
  issue: { title: String, description: String, fingerprint: String },
  acceptance: { type: String, required: true, maxlength: 4000 },
  repository: String,
  repositoryId: Number,
  installationId: { type: Number, select: false },
  baseBranch: String,
  baseSha: String,
  baseTree: String,
  requiredCheck: String,
  model: String,
  status: { type: String, required: true, enum: ["queued", "assessing", "eligible", "not_suitable", "queued_fix", "generating", "publishing", "awaiting_checks", "checks_passed", "ready_for_review", "needs_attention", "merged", "closed", "shipped", "failed", "cancelled"] },
  failedStage: String,
  workbenchManaged: { type: Boolean, default: false },
  workbenchPreviousStatus: String,
  notification: { status: String, total: Number, sent: Number, pending: Number, failed: Number, message: String },
  active: { type: Boolean, default: true },
  leaseUntil: Date,
  leaseToken: { type: String, select: false },
  assessment: { suitable: Boolean, category: String, reason: String, plan: [String] },
  review: { approved: Boolean, reason: String },
  files: [{ _id: false, path: String, sha: String, size: Number }],
  patch: [{ _id: false, path: String, before: String, after: String }],
  branch: String,
  headSha: String,
  prNumber: Number,
  prUrl: String,
  publishedAt: Date,
  checks: [{ _id: false, name: String, status: String, conclusion: String }],
  message: String,
  nextCheckAt: Date,
  shippedAt: Date,
  events: [{ _id: false, at: Date, status: String, message: String, stage: String }],
}, { timestamps: true });
schema.index({ projectId: 1 }, { unique: true, partialFilterExpression: { active: true }, name: "one_active_pr_run_per_project" });
schema.index({ status: 1, nextCheckAt: 1 });
schema.index({ projectId: 1, createdAt: -1 });
schema.index({ repositoryId: 1, installationId: 1, prNumber: 1 });
module.exports = mongoose.model("PullRequestRun", schema);
