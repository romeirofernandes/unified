const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  deleting: { type: Boolean, default: false },
  writeVersion: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  displayName: {
    type: String,
    default: null,
  },
  photoURL: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
