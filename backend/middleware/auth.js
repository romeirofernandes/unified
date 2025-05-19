const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const firebaseUid = req.headers["firebase-uid"];
    if (!firebaseUid) {
      return res.status(401).json({ message: "No authentication token" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = authMiddleware;
