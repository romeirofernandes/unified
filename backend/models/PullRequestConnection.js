const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  repository: String,
  repositoryId: Number,
  installationId: Number,
  defaultBranch: String,
  requiredCheck: String,
  connectedAt: Date,
  stateHash: { type: String, select: false },
  stateUntil: { type: Date, select: false },
  pendingRepository: { type: String, select: false },
  pendingCheck: { type: String, select: false },
}, { timestamps: true });
schema.index({ stateHash: 1 }, { sparse: true });
module.exports = mongoose.model("PullRequestConnection", schema);
