const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      email,
      password, // Note: Password is already hashed by Firebase
      firebaseUid,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login endpoint (for additional backend validation if needed)
router.post("/login", async (req, res) => {
  try {
    const { firebaseUid } = req.body;
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        id: user._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
