const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  repositories: [{ _id: false, repository: String, repositoryId: Number, installationId: Number, defaultBranch: String }],
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("GitHubAccess", schema);
