const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, firebaseUid, displayName, photoURL } = req.body;

    // Check if user exists by firebaseUid
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(200).json({
        message: "User already exists",
        user: {
          email: user.email,
          id: user._id,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      });
    }

    // Create new user
    const newUser = new User({
      email,
      firebaseUid,
      displayName: displayName || null,
      photoURL: photoURL || null,
    });

    await newUser.save();
    res.status(201).json({
      message: "User created successfully",
      user: {
        email: newUser.email,
        id: newUser._id,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login endpoint
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
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
