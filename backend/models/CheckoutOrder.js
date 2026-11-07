const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  tokenHash: { type: String, required: true, select: false },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ["created", "paid"], default: "created" },
  paymentId: { type: String, unique: true, sparse: true },
}, { timestamps: true });
module.exports = mongoose.model("CheckoutOrder", schema);
