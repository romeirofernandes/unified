const express = require("express");
const router = express.Router();
const identity = require("../middleware/identity");
router.use((req, res, next) => (req.method === "DELETE" && req.path === "/user" ? identity.forDeletion : identity)(req, res, next));
const User = require("../models/User");
const { deleteAccount } = require("../services/project-lifecycle");

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { uid: firebaseUid, email, name: displayName, picture: photoURL } = req.auth;
    if (!email) return res.status(400).json({ message: "Your sign-in account needs an email address." });

    // Check if user exists by firebaseUid
    let user = await User.findOne({ firebaseUid });
    if (user?.deleting) return res.status(409).json({ message: "Account deletion is in progress. Retry deletion from Settings." });
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
    res.status(500).json({ message: "Could not complete this account operation. Please retry." });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const firebaseUid = req.auth.uid;
    const user = await User.findOne({ firebaseUid });

    if (!user || user.deleting) {
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
    res.status(500).json({ message: "Could not complete this account operation. Please retry." });
  }
});

// Delete user endpoint
router.delete("/user", async (req, res) => {
  try {
    if (Math.floor(Date.now() / 1000) - req.auth.auth_time > 300) return res.status(401).json({ message: "Confirm your identity again before deleting your account." });
    const firebaseUid = req.auth.uid;

    await deleteAccount(firebaseUid, req.idToken);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(error.status || 500).json({ message: error.status ? error.message : "Could not complete account deletion. Retry from Settings." });
  }
});

module.exports = router;
