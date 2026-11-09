const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  repositoryId: { type: Number, required: true },
  sha: { type: String, required: true },
  encrypted: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
});
schema.index({ projectId: 1, repositoryId: 1, sha: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("RepositoryBlob", schema);
