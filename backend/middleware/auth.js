const User = require("../models/User");
const identity = require("./identity");

module.exports = (req, res, next) => identity(req, res, async () => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.uid, deleting: { $ne: true } });
    if (!user) return res.status(401).json({ message: "Account unavailable. Sign in again." });
    req.user = user;
    next();
  } catch {
    res.status(503).json({ message: "Could not load your account. Please try again." });
  }
});
