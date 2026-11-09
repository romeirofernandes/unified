const { createHmac, timingSafeEqual } = require("node:crypto");
const Run = require("../models/PullRequestRun");
function createWebhook({ Run: Runs = Run, secret = () => process.env.GITHUB_APP_WEBHOOK_SECRET } = {}) {
  return async (req, res) => {
    const key = secret();
    if (!key) return res.status(503).json({ message: "GitHub webhook is not configured." });
    const signature = req.get("x-hub-signature-256") || "";
    if (!Buffer.isBuffer(req.body) || !/^sha256=[a-f0-9]{64}$/.test(signature)) return res.sendStatus(401);
    const expected = createHmac("sha256", key).update(req.body).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex"))) return res.sendStatus(401);
    let payload;
    try { payload = JSON.parse(req.body.toString("utf8")); } catch { return res.sendStatus(400); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return res.sendStatus(400);
    const event = req.get("x-github-event");
    if (event === "ping") return res.sendStatus(200);
    if (!["pull_request", "check_run", "check_suite", "status"].includes(event)) return res.sendStatus(202);
    if (!Number.isSafeInteger(payload.repository?.id) || !Number.isSafeInteger(payload.installation?.id)) return res.sendStatus(400);
    const filter = { repositoryId: payload.repository.id, installationId: payload.installation.id, active: false, status: { $in: ["awaiting_checks", "checks_passed", "ready_for_review", "needs_attention"] } };
    if (event === "pull_request") {
      if (!Number.isSafeInteger(payload.pull_request?.number)) return res.sendStatus(400);
      filter.prNumber = payload.pull_request.number;
    } else {
      const sha = payload.check_run?.head_sha || payload.check_suite?.head_sha || payload.sha;
      if (!/^[a-f0-9]{40}$/.test(sha || "")) return res.sendStatus(400);
      filter.headSha = sha;
    }
    try {
      // Queue the existing durable worker. It reads canonical GitHub state before changing a run.
      // Replayed deliveries only schedule the same read; they cannot ship a fix or send email.
      await Runs.updateMany(filter, { $set: { nextCheckAt: new Date() } });
      return res.sendStatus(202);
    } catch { return res.sendStatus(503); }
  };
}
module.exports = { createWebhook };
