const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// Create project
router.post("/", async (req, res) => {
  try {
    const { name, description, fields, theme } = req.body;
    const userId = req.user.id; // Will add auth middleware later

    const project = new Project({
      name,
      description,
      fields,
      theme,
      userId,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
  }
});

// Get all projects for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id; // Will add auth middleware later
    const projects = await Project.find({ userId });
    res.json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    res.header("Content-Type", "application/json");
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching project", error: error.message });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  try {
    const { name, description, fields, theme } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, fields, theme },
      { new: true }
    );
    res.json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating project", error: error.message });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
});

module.exports = router;
