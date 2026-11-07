const { listChannels, selectedChannel } = require("../services/slack-client");
const express = require("express");
const { randomUUID } = require("node:crypto");
const Project = require("../models/Project");
const { encrypt, decrypt } = require("../services/secret-storage");
const { validateSlackWebhook, deliverDigest } = require("../services/digest-delivery");
const { intervalMs } = require("../services/digest-worker");
const router = express.Router();
const { emailReady } = require("../services/email-transport");
const slackOAuth = require("../services/slack-oauth");
function publicSettings(project, email) {
  const channels = {};
  for (const channel of ["slack", "email"]) {
    const state = project.notifications?.[channel] || {};
    channels[channel] = Object.fromEntries(["enabled", "cadence", "nextRunAt", "lastSentAt", "lastCheckedAt", "lastCount", "error"].map((key) => [key, state[key]]));
  }
  return { ...channels, slackConnected: !!(project.slackWebhookEncrypted || project.slackBotTokenEncrypted), slackCanChooseChannel: !!project.slackBotTokenEncrypted, slackChannelId: project.slackChannelId, slackInstallReady: slackOAuth.configured(), slackWorkspace: project.slackWorkspace, slackChannel: project.slackChannel, emailReady: emailReady(), emailAddress: email };
}
router.get("/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).select("+slackWebhookEncrypted +slackBotTokenEncrypted").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(publicSettings(project, req.user.email));
  } catch { res.status(500).json({ message: "Could not load integrations." }); }
});
router.get("/:id/slack/channels", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).select("+slackBotTokenEncrypted").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.slackBotTokenEncrypted) return res.status(409).json({ message: "Reconnect Slack to grant channel access." });
    const cursor = req.query.cursor || "";
    if (typeof cursor !== "string" || cursor.length > 2000) return res.status(400).json({ message: "Invalid channel page." });
    res.json(await listChannels(decrypt(project.slackBotTokenEncrypted), cursor));
  } catch (error) { res.status(error.status || 502).json({ message: error.status ? error.message : "Could not load Slack channels." }); }
});
router.post("/:id/slack/install", async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!slackOAuth.configured()) return res.status(503).json({ message: "Slack installation is not configured on the server yet." });
  try {
    const { state, url } = slackOAuth.authorization();
    const project = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { slackOAuthStateHash: slackOAuth.stateHash(state), slackOAuthStateUntil: new Date(Date.now() + 10 * 60 * 1000) } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ url });
  } catch { res.status(500).json({ message: "Could not start Slack installation." }); }
});
router.put("/:id/:channel", async (req, res) => {
  const { channel } = req.params;
  if (!["slack", "email"].includes(channel)) return res.status(400).json({ message: "Choose Slack or email." });
  try {
    const { enabled, cadence, webhook, channelId, disconnect = false } = req.body;
    if (typeof enabled !== "boolean" || !["hourly", "daily"].includes(cadence) || typeof disconnect !== "boolean") return res.status(400).json({ message: "Choose whether to enable delivery and an hourly or daily schedule." });
    const owner = { _id: req.params.id, userId: req.user.id };
    const project = await Project.findOne(owner).select("+slackWebhookEncrypted +slackBotTokenEncrypted").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (channel === "email" && enabled && !emailReady()) return res.status(503).json({ message: "Email delivery needs a configured SMTP or Resend transport on the server." });
    const prefix = `notifications.${channel}`;
    const previous = project.notifications?.[channel] || {};
    const set = { [`${prefix}.enabled`]: disconnect ? false : enabled, [`${prefix}.cadence`]: cadence, [`${prefix}.error`]: "" };
    const unset = { [`${prefix}.lockToken`]: 1, [`${prefix}.lockUntil`]: 1, [`${prefix}.pendingUntil`]: 1, [`${prefix}.pendingSummary`]: 1 };
    if (channel === "slack") {
      if (disconnect) { unset.slackWebhookEncrypted = 1; unset.slackBotTokenEncrypted = 1; unset.slackChannelId = 1; unset.slackWorkspace = 1; unset.slackChannel = 1; unset.slackOAuthStateHash = 1; unset.slackOAuthStateUntil = 1; }
      else if (webhook) { set.slackWebhookEncrypted = encrypt(validateSlackWebhook(webhook)); unset.slackBotTokenEncrypted = 1; unset.slackChannelId = 1; unset.slackWorkspace = 1; unset.slackChannel = 1; }
      else if (enabled && !project.slackWebhookEncrypted && !project.slackBotTokenEncrypted) return res.status(400).json({ message: "Add a Slack incoming webhook first." });
    }
    if (channel === "slack" && channelId && !webhook && !disconnect && channelId !== project.slackChannelId) {
      if (!project.slackBotTokenEncrypted) return res.status(409).json({ message: "Reconnect Slack to grant channel access." });
      const destination = await selectedChannel(decrypt(project.slackBotTokenEncrypted), channelId);
      set.slackChannelId = destination.id;
      set.slackChannel = destination.name;
    }
    if (enabled && !disconnect) {
      // Paused periods are intentionally excluded when resuming.
      if (!previous.enabled || !previous.since) set[`${prefix}.since`] = new Date();
      set[`${prefix}.nextRunAt`] = new Date(Date.now() + intervalMs(cadence));
    }
    const updated = await Project.findOneAndUpdate(owner, { $set: set, $unset: unset }, { new: true, runValidators: true }).select("+slackWebhookEncrypted +slackBotTokenEncrypted").lean();
    res.json(publicSettings(updated, req.user.email));
  } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : "Could not save integration." }); }
});
router.post("/:id/:channel/test", async (req, res) => {
  const { channel } = req.params;
  if (!["slack", "email"].includes(channel)) return res.status(400).json({ message: "Choose Slack or email." });
  const prefix = `notifications.${channel}`;
  try {
    const owner = { _id: req.params.id, userId: req.user.id };
    const existing = await Project.findOne(owner).select("+slackWebhookEncrypted +slackBotTokenEncrypted").lean();
    if (!existing) return res.status(404).json({ message: "Project not found" });
    if (channel === "slack" && !existing.slackWebhookEncrypted && !existing.slackBotTokenEncrypted) return res.status(400).json({ message: "Save a Slack connection first." });
    if (channel === "email" && !emailReady()) return res.status(503).json({ message: "Email delivery is not configured on the server." });
    const project = await Project.findOneAndUpdate({ ...owner, $or: [{ [`${prefix}.testAfter`]: null }, { [`${prefix}.testAfter`]: { $lte: new Date() } }] }, { $set: { [`${prefix}.testAfter`]: new Date(Date.now() + 60000) } }, { new: true }).select("+slackWebhookEncrypted +slackBotTokenEncrypted").lean();
    if (!project) return res.status(429).json({ message: "Wait a minute before sending another test." });
    await deliverDigest({ project, channel, count: 3, recipient: req.user.email, test: true, batchId: randomUUID(), summary: { tldr: "This is a sample digest. Your real digests will summarize new feedback for this project.", features: ["Review recurring requests", "Identify issues worth addressing"] } });
    res.json({ message: "Test digest sent. Check your destination." });
  } catch { res.status(502).json({ message: "The test could not be delivered. Check the saved connection and server configuration." }); }
});
module.exports = router;
