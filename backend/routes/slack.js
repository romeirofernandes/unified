const express = require("express");
const Project = require("../models/Project");
const { encrypt } = require("../services/secret-storage");
const { configured, stateHash, exchangeCode } = require("../services/slack-oauth");
const router = express.Router();
router.get("/callback", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  if (!configured()) return res.status(503).send("Slack installation has not been configured.");
  if (typeof req.query.state !== "string" || !/^[a-f0-9]{64}$/.test(req.query.state)) return res.status(400).send("This Slack installation link is invalid or expired. Please start again in Integrations.");
  let project;
  try {
    // Consume a short-lived, single-use state bound to the authorized project.
    project = await Project.findOneAndUpdate({ slackOAuthStateHash: stateHash(req.query.state), slackOAuthStateUntil: { $gt: new Date() } }, { $unset: { slackOAuthStateHash: 1, slackOAuthStateUntil: 1 } }, { new: true }).lean();
    if (!project) return res.status(400).send("This Slack installation link is invalid or expired. Please start again in Integrations.");
    const destination = new URL("/dashboard/integrations", process.env.FRONTEND_URL || "http://localhost:5173");
    destination.searchParams.set("project", String(project._id));
    if (req.query.error) {
      destination.searchParams.set("slack", "cancelled");
      return res.redirect(destination.toString());
    }
    if (typeof req.query.code !== "string" || req.query.code.length > 2000) throw new Error("Invalid authorization code.");
    const connection = await exchangeCode(req.query.code);
    // Connecting chooses a destination; users enable their delivery schedule separately.
    const updated = await Project.updateOne({ _id: project._id, userId: project.userId }, { $set: { slackWebhookEncrypted: encrypt(connection.webhook), slackWorkspace: connection.workspace, slackChannel: connection.channel, ...(connection.channelId ? { slackChannelId: connection.channelId } : {}), ...(connection.token ? { slackBotTokenEncrypted: encrypt(connection.token) } : {}) }, $unset: { ...(!connection.token ? { slackBotTokenEncrypted: 1, slackChannelId: 1 } : {}), "notifications.slack.lockToken": 1, "notifications.slack.lockUntil": 1 } });
    if (!updated.matchedCount) throw new Error("Project unavailable.");
    destination.searchParams.set("slack", "connected");
    res.redirect(destination.toString());
  } catch {
    if (!project) return res.status(502).send("Slack installation failed. Please try again from Integrations.");
    const destination = new URL("/dashboard/integrations", process.env.FRONTEND_URL || "http://localhost:5173");
    destination.searchParams.set("project", String(project._id));
    destination.searchParams.set("slack", "error");
    res.redirect(destination.toString());
  }
});
module.exports = router;
