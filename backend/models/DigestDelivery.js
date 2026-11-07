const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  status: { type: String, enum: ["sending", "sent", "rejected", "unknown"], required: true },
}, { timestamps: true });
module.exports = mongoose.model("DigestDelivery", schema);
