const { randomUUID, createHash } = require("node:crypto");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { summarizeFeedback } = require("./feedback-summary");
const { deliverDigest } = require("./digest-delivery");
const intervalMs = (cadence) => cadence === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

function summaryHash(summary) {
  const normalize = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256").update(JSON.stringify({ tldr: normalize(summary.tldr), features: summary.features.map(normalize).sort() })).digest("hex");
}

async function processDigest(id, channel, dependencies = {}) {
  const models = { Project, Feedback, User, ...dependencies };
  const now = new Date();
  const token = randomUUID();
  const prefix = `notifications.${channel}`;
  const project = await models.Project.findOneAndUpdate({
    _id: id, [`${prefix}.enabled`]: true, [`${prefix}.nextRunAt`]: { $lte: now },
    $or: [{ [`${prefix}.lockUntil`]: null }, { [`${prefix}.lockUntil`]: { $lt: now } }],
  }, { $set: { [`${prefix}.lockToken`]: token, [`${prefix}.lockUntil`]: new Date(Date.now() + 12 * 60 * 1000) } }, { new: true }).select("+slackWebhookEncrypted").lean();
  if (!project) return;
  const owner = { _id: id, [`${prefix}.lockToken`]: token };
  const state = project.notifications[channel];
  const until = state.pendingUntil || now;
  try {
    // Retain the batch boundary on failures so retries cover the same feedback.
    await models.Project.updateOne(owner, { $set: { [`${prefix}.pendingUntil`]: until } });
    const feedback = await models.Feedback.find({ projectId: id, timestamp: { $gt: state.since, $lte: until } }).sort({ timestamp: 1 }).lean();
    let sentHash;
    if (feedback.length) {
      // Freshly summarize every new batch, independently of visits to the dashboard.
      // Freeze the generated content for retries so email idempotency stays valid.
      const summary = state.pendingSummary || await (dependencies.summarizeFeedback || summarizeFeedback)(project, feedback);
      await models.Project.updateOne(owner, { $set: { [`${prefix}.pendingSummary`]: summary } });
      const hash = summaryHash(summary);
      if (hash !== state.lastSummaryHash) {
        const user = await models.User.findById(project.userId).lean();
        if (!user) throw new Error("The project owner is unavailable.");
        // Config edits clear the token, cancelling work which has not been delivered yet.
        if (!await models.Project.exists(owner)) return;
        await (dependencies.deliverDigest || deliverDigest)({ project, channel, summary, count: feedback.length, recipient: user.email, batchId: `${id}:${channel}:${new Date(state.since).toISOString()}:${new Date(until).toISOString()}` });
        sentHash = hash;
      }
    }
    await models.Project.updateOne(owner, {
      $set: { [`${prefix}.since`]: until, [`${prefix}.nextRunAt`]: new Date(Date.now() + intervalMs(state.cadence)), [`${prefix}.lastCheckedAt`]: new Date(), [`${prefix}.error`]: "", ...(sentHash ? { [`${prefix}.lastSentAt`]: new Date(), [`${prefix}.lastCount`]: feedback.length, [`${prefix}.lastSummaryHash`]: sentHash } : {}) },
      $unset: { [`${prefix}.lockToken`]: 1, [`${prefix}.lockUntil`]: 1, [`${prefix}.pendingUntil`]: 1, [`${prefix}.pendingSummary`]: 1 },
    });
  } catch (error) {
    // Provider payloads and credentials never enter user-visible errors.
    const message = /delivery failed|not configured|owner is unavailable/.test(error.message) ? error.message : "Could not prepare or deliver the digest. We’ll retry in 15 minutes.";
    await models.Project.updateOne(owner, { $set: { [`${prefix}.error`]: message, [`${prefix}.nextRunAt`]: new Date(Date.now() + 15 * 60 * 1000) }, $unset: { [`${prefix}.lockToken`]: 1, [`${prefix}.lockUntil`]: 1 } });
  }
}
let running = false;
async function runDigests() {
  if (running) return;
  running = true;
  try {
    for (const channel of ["slack", "email"]) {
      const projects = await Project.find({ [`notifications.${channel}.enabled`]: true, [`notifications.${channel}.nextRunAt`]: { $lte: new Date() } }).select("_id").limit(20).lean();
      for (const project of projects) await processDigest(project._id, channel);
    }
  } finally { running = false; }
}
function startDigestWorker() {
  const tick = () => runDigests().catch(() => console.error("Digest worker could not complete its scan."));
  const timer = setInterval(tick, 60000);
  timer.unref();
  tick();
  return () => clearInterval(timer);
}
module.exports = { summaryHash, intervalMs, processDigest, startDigestWorker };
