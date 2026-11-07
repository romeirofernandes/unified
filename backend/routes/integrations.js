const express = require("express");
const { randomUUID } = require("node:crypto");
const Project = require("../models/Project");
const { encrypt } = require("../services/secret-storage");
const { validateSlackWebhook, deliverDigest } = require("../services/digest-delivery");
const { intervalMs } = require("../services/digest-worker");
const router = express.Router();
const emailReady = () => !!(process.env.RESEND_API_KEY && process.env.DIGEST_EMAIL_FROM);
function publicSettings(project, email) {
  const channels = {};
  for (const channel of ["slack", "email"]) {
    const state = project.notifications?.[channel] || {};
    channels[channel] = Object.fromEntries(["enabled", "cadence", "nextRunAt", "lastSentAt", "lastCheckedAt", "lastCount", "error"].map((key) => [key, state[key]]));
  }
  return { ...channels, slackConnected: !!project.slackWebhookEncrypted, emailReady: emailReady(), email };
}
router.get("/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).select("+slackWebhookEncrypted").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(publicSettings(project, req.user.email));
  } catch { res.status(500).json({ message: "Could not load integrations." }); }
});
router.put("/:id/:channel", async (req, res) => {
  const { channel } = req.params;
  if (!["slack", "email"].includes(channel)) return res.status(400).json({ message: "Choose Slack or email." });
  try {
    const { enabled, cadence, webhook, disconnect = false } = req.body;
    if (typeof enabled !== "boolean" || !["hourly", "daily"].includes(cadence) || typeof disconnect !== "boolean") return res.status(400).json({ message: "Choose whether to enable delivery and an hourly or daily schedule." });
    const owner = { _id: req.params.id, userId: req.user.id };
    const project = await Project.findOne(owner).select("+slackWebhookEncrypted").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (channel === "email" && enabled && !emailReady()) return res.status(503).json({ message: "Email delivery needs RESEND_API_KEY and DIGEST_EMAIL_FROM on the server." });
    const prefix = `notifications.${channel}`;
    const previous = project.notifications?.[channel] || {};
    const set = { [`${prefix}.enabled`]: disconnect ? false : enabled, [`${prefix}.cadence`]: cadence, [`${prefix}.error`]: "" };
    const unset = { [`${prefix}.lockToken`]: 1, [`${prefix}.lockUntil`]: 1, [`${prefix}.pendingUntil`]: 1 };
    if (channel === "slack") {
      if (disconnect) unset.slackWebhookEncrypted = 1;
      else if (webhook) set.slackWebhookEncrypted = encrypt(validateSlackWebhook(webhook));
      else if (enabled && !project.slackWebhookEncrypted) return res.status(400).json({ message: "Add a Slack incoming webhook first." });
    }
    if (enabled && !disconnect) {
      // Paused periods are intentionally excluded when resuming.
      if (!previous.enabled || !previous.since) set[`${prefix}.since`] = new Date();
      set[`${prefix}.nextRunAt`] = new Date(Date.now() + intervalMs(cadence));
    }
    const updated = await Project.findOneAndUpdate(owner, { $set: set, $unset: unset }, { new: true, runValidators: true }).select("+slackWebhookEncrypted").lean();
    res.json(publicSettings(updated, req.user.email));
  } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : "Could not save integration." }); }
});
router.post("/:id/:channel/test", async (req, res) => {
  const { channel } = req.params;
  if (!["slack", "email"].includes(channel)) return res.status(400).json({ message: "Choose Slack or email." });
  const prefix = `notifications.${channel}`;
  try {
    const owner = { _id: req.params.id, userId: req.user.id };
    const existing = await Project.findOne(owner).select("+slackWebhookEncrypted").lean();
    if (!existing) return res.status(404).json({ message: "Project not found" });
    if (channel === "slack" && !existing.slackWebhookEncrypted) return res.status(400).json({ message: "Save a Slack connection first." });
    if (channel === "email" && !emailReady()) return res.status(503).json({ message: "Email delivery is not configured on the server." });
    const project = await Project.findOneAndUpdate({ ...owner, $or: [{ [`${prefix}.testAfter`]: null }, { [`${prefix}.testAfter`]: { $lte: new Date() } }] }, { $set: { [`${prefix}.testAfter`]: new Date(Date.now() + 60000) } }, { new: true }).select("+slackWebhookEncrypted").lean();
    if (!project) return res.status(429).json({ message: "Wait a minute before sending another test." });
    await deliverDigest({ project, channel, count: 3, recipient: req.user.email, test: true, batchId: randomUUID(), summary: { tldr: "This is a sample digest. Your real digests will summarize new feedback for this project.", features: ["Review recurring requests", "Identify issues worth addressing"] } });
    res.json({ message: "Test digest sent. Check your destination." });
  } catch { res.status(502).json({ message: "The test could not be delivered. Check the saved connection and server configuration." }); }
});
module.exports = router;
