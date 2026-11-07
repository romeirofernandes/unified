const mongoose = require("mongoose");
const schema = new mongoose.Schema({ _id: String, count: Number, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("RateBucket", schema);
