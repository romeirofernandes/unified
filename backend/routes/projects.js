const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const { generateForm } = require("../services/form-generation");
const { validateAppearance } = require("../services/project-appearance");
const generationInFlight = new Set();

router.post("/generate-form", async (req, res) => {
  const transcript = req.body?.transcript;
  if (
    typeof transcript !== "string" ||
    !transcript.trim() ||
    transcript.length > 12000
  )
    return res.status(400).json({
      message: "Describe the questions you need in 12,000 characters or fewer.",
    });
  const owner = String(req.user.id);
  if (generationInFlight.has(owner))
    return res
      .status(409)
      .json({ message: "A form is already being generated. Please wait." });
  generationInFlight.add(owner);
  try {
    res.json(await generateForm(transcript.trim()));
  } catch (error) {
    res.status(error.status || 502).json({
      message: error.status
        ? error.message
        : "Could not create the draft. Please try again.",
    });
  } finally {
    generationInFlight.delete(owner);
  }
});

router.post(
  "/transcribe",
  express.raw({ type: ["audio/*", "video/webm", "video/mp4"], limit: "12mb" }),
  async (req, res) => {
    const owner = String(req.user.id);
    if (generationInFlight.has(owner))
      return res
        .status(409)
        .json({
          message: "An AI request is already in progress. Please wait.",
        });
    generationInFlight.add(owner);
    try {
      res.json(
        await require("../services/transcription").transcribeAudio(
          req.body,
          req.headers["content-type"],
          "en",
        ),
      );
    } catch (error) {
      res
        .status(error.status || 502)
        .json({
          message: error.status
            ? error.message
            : "Could not transcribe this recording. Please try again or type your description.",
        });
    } finally {
      generationInFlight.delete(owner);
    }
  },
);
router.use((error, req, res, next) => {
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({
        message:
          "This recording is too large. Please record a shorter description.",
      });
  next(error);
});

// Create project
router.post("/", async (req, res) => {
  try {
    const { name, description, fields, theme } = req.body;
    if (!Array.isArray(fields) || !fields.length) return res.status(400).json({ message: "Add at least one question before saving." });
    const appearance = validateAppearance(req.body.appearance);
    const userId = req.user.id; // Will add auth middleware later

    const project = new Project({
      name,
      description,
      fields,
      theme,
      appearance,
      userId,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.status ? error.message : "Error creating project",
    });
  }
});

// Get all projects for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id; // Will add auth middleware later
    const projects = await Project.find({ userId }).lean();
    const counts = projects.length
      ? await Feedback.aggregate([
          {
            $match: {
              projectId: { $in: projects.map((project) => project._id) },
            },
          },
          { $group: { _id: "$projectId", count: { $sum: 1 } } },
        ])
      : [];
    const countByProject = new Map(
      counts.map((entry) => [String(entry._id), entry.count]),
    );
    res.json(
      projects.map((project) => ({
        ...project,
        feedbackCount: countByProject.get(String(project._id)) || 0,
      })),
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

// Keys grant submission access only. Store only a digest and reveal once.
router.post("/:id/submission-key", async (req, res) => {
  try {
    const { randomBytes, createHash } = require("node:crypto");
    const key = `uf_${randomBytes(32).toString("hex")}`;
    const project = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { submissionKeyHash: createHash("sha256").update(key).digest("hex") } }, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ key });
  } catch { res.status(500).json({ message: "Could not create submission key." }); }
});
router.delete("/:id/submission-key", async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $unset: { submissionKeyHash: 1 } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Submission key revoked." });
  } catch { res.status(500).json({ message: "Could not revoke submission key." }); }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    res.header("Content-Type", "application/json");
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
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
    if (!Array.isArray(fields) || !fields.length) return res.status(400).json({ message: "Add at least one question before saving." });
    const appearance = validateAppearance(req.body.appearance);
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        name,
        description,
        fields,
        theme,
        ...(appearance ? { appearance } : {}),
      },
      { new: true, runValidators: true },
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.status ? error.message : "Error updating project",
    });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    // Keep the project available for a retry if feedback cleanup fails.
    await Feedback.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id, userId: req.user.id });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
});

module.exports = router;
