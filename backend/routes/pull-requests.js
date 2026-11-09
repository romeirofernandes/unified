const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Connection = require("../models/PullRequestConnection");
const Run = require("../models/PullRequestRun");
const Blob = require("../models/RepositoryBlob");
const github = require("../services/pr-github");
const workflow = require("../services/pr-workflow");
const { consumeLimit } = require("../services/rate-limit");
const { fail, repositoryName, fingerprint, sensitive } = require("../services/pr-policy");
function createRouter(overrides = {}) {
  const d = { Project, Connection, Run, Blob, github, workflow, ...overrides };
  const router = express.Router();
  router.param("projectId", async (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid project." });
    try {
      req.project = await d.Project.findOne({ _id: id, userId: req.user.id }).select("+workbenchIssues").lean();
      if (!req.project) return res.status(404).json({ message: "Project not found." });
      next();
    } catch { res.status(503).json({ message: "Could not load the project." }); }
  });
  router.param("runId", async (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid run." });
    try {
      req.run = await d.Run.findOne({ _id: id, projectId: req.project._id, userId: req.user.id }).lean();
      if (!req.run) return res.status(404).json({ message: "Run not found." });
      next();
    } catch { res.status(503).json({ message: "Could not load the run." }); }
  });
  const handler = action => async (req, res) => { try { await action(req, res); } catch (error) { res.status(error.code === 11000 ? 409 : error.status || 502).json({ message: error.code === 11000 ? "This project already has an active run. Wait for it to finish." : error.status ? error.message : "Could not complete this operation. Please try again." }); } };
  const owner = req => ({ projectId: req.project._id, userId: req.user.id });
  async function idle(req) { if (await d.Run.exists({ ...owner(req), active: true })) throw fail("Wait for the active run before changing this connection.", 409); }
  router.get("/:projectId", handler(async (req, res) => {
    const [connection, runs] = await Promise.all([d.Connection.findOne(owner(req)).select("+pendingRepository").lean(), d.Run.find(owner(req)).sort({ createdAt: -1 }).limit(30).select("-patch -events -files").lean()]);
    res.json({ configured: d.github.configured(), installUrl: d.github.configured() ? `https://github.com/apps/${encodeURIComponent(process.env.GITHUB_APP_SLUG)}/installations/new` : null,
      setupRepository: connection?.pendingRepository || "", connection: connection?.connectedAt ? { repository: connection.repository, defaultBranch: connection.defaultBranch, requiredCheck: connection.requiredCheck, connectedAt: connection.connectedAt } : null, runs });
  }));
  router.post("/:projectId/connect", handler(async (req, res) => {
    await idle(req);
    const repository = repositoryName(req.body?.repository);
    const requiredCheck = req.body?.requiredCheck ?? "";
    if (typeof requiredCheck !== "string" || requiredCheck.length > 120 || /[\r\n\x00-\x1f]/.test(requiredCheck)) throw fail("Enter a valid test check name.", 400);
    const { state, url } = d.github.authorization();
    await d.Connection.updateOne({ projectId: req.project._id }, { $set: { userId: req.user.id, stateHash: d.github.stateHash(state), stateUntil: new Date(Date.now() + 10 * 60000), pendingRepository: repository, pendingCheck: requiredCheck.trim() }, $unset: { returnStateHash: 1, returnStateUntil: 1, returnStateResult: 1 } }, { upsert: true });
    res.json({ url });
  }));
  router.get("/:projectId/checks", handler(async (req, res) => {
    const connection = await d.Connection.findOne({ ...owner(req), connectedAt: { $exists: true } }).lean();
    if (!connection) throw fail("Connect a repository first.", 409);
    await consumeLimit(`pr-checks:${req.user.id}`, 10);
    res.json({ names: await d.github.checkNames(connection) });
  }));
  router.put("/:projectId/connection/check", handler(async (req, res) => {
    await idle(req);
    const name = req.body?.requiredCheck;
    if (typeof name !== "string" || !name.trim() || name.length > 120 || /[\x00-\x1f]/.test(name)) throw fail("Choose a test check, or enter its exact name.", 400);
    const connection = await d.Connection.findOneAndUpdate({ ...owner(req), connectedAt: { $exists: true } }, { $set: { requiredCheck: name.trim() } }, { new: true });
    if (!connection) throw fail("Connect a repository first.", 409);
    res.json({ requiredCheck: connection.requiredCheck });
  }));
  router.delete("/:projectId/connection", handler(async (req, res) => {
    await idle(req);
    await d.Connection.deleteOne(owner(req));
    await d.Blob.deleteMany({ projectId: req.project._id });
    res.json({ disconnected: true });
  }));
  router.post("/:projectId/runs", handler(async (req, res) => {
    const issue = req.project.workbenchIssues.find(item => String(item._id) === req.body?.issueId && !item.deleted && item.status !== "done");
    const acceptance = req.body?.acceptance;
    if (!issue) throw fail("Choose an open workbench issue.", 400);
    if (typeof acceptance !== "string" || acceptance.trim().length < 20 || acceptance.length > 4000) throw fail("Describe the expected behavior and how to verify it in 20–4,000 characters.", 400);
    if (sensitive(`${issue.title}\n${issue.description}\n${acceptance}`)) throw fail("Remove credentials from the issue and acceptance criteria first.", 400);
    if (!d.github.configured()) throw fail("GitHub App connection is not configured on this server.", 503);
    const connection = await d.Connection.findOne({ ...owner(req), connectedAt: { $exists: true } }).lean();
    if (!connection) throw fail("Connect a GitHub repository first.", 409);
    if (!connection.requiredCheck) throw fail("Choose the test check for this repository before assessing an issue.", 409);
    if (await d.Run.exists({ ...owner(req), issueId: issue._id, branch: { $exists: true }, status: { $nin: ["closed", "shipped", "cancelled"] } })) throw fail("This issue already has a branch or PR. Refresh its status and resolve it before starting another run.", 409);
    // Bound inference spending per project as well as excluding concurrent jobs.
    if (await d.Run.countDocuments({ ...owner(req), createdAt: { $gt: new Date(Date.now() - 3600000) } }) >= 10) throw fail("This project reached its 10-assessments-per-hour limit. Try again later.", 429);
    await d.Run.init();
    // Share the project's write lock with account/project deletion so a deleted project cannot leave a new job behind.
    const run = await mongoose.connection.transaction(async session => {
      const current = await d.Project.findOneAndUpdate({ _id: req.project._id, userId: req.user.id, workbenchIssues: { $elemMatch: { _id: issue._id, title: issue.title, description: issue.description, deleted: false, status: { $ne: "done" } } } }, { $inc: { writeVersion: 1 } }, { session });
      if (!current) throw fail("The issue changed or the project was removed. Reload and try again.", 409);
      const [created] = await d.Run.create([{ ...owner(req), issueId: issue._id, issue: { title: issue.title, description: issue.description || "", fingerprint: fingerprint(issue) }, acceptance: acceptance.trim(), repository: connection.repository, repositoryId: connection.repositoryId, installationId: connection.installationId, baseBranch: connection.defaultBranch, requiredCheck: connection.requiredCheck, model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b", status: "queued", active: true, events: [{ at: new Date(), status: "queued", message: "Assessment queued." }] }], { session });
      return created;
    });
    res.status(202).json({ _id: run._id });
  }));
  router.get("/:projectId/runs/:runId", handler(async (req, res) => res.json(req.run)));
  router.post("/:projectId/runs/:runId/attempt", handler(async (req, res) => {
    const issue = req.project.workbenchIssues.find(item => String(item._id) === String(req.run.issueId) && !item.deleted && item.status !== "done");
    if (!issue || fingerprint(issue) !== req.run.issue.fingerprint) throw fail("The issue changed. Start a fresh assessment.", 409);
    if (await d.Run.exists({ ...owner(req), issueId: issue._id, _id: { $ne: req.run._id }, branch: { $exists: true }, status: { $nin: ["closed", "shipped", "cancelled"] } })) throw fail("Another run already has a branch for this issue.", 409);
    const result = await d.Run.updateOne({ _id: req.run._id, ...owner(req), status: "eligible", active: false }, { $set: { status: "queued_fix", active: true, message: "Fix queued." }, $push: { events: { at: new Date(), status: "queued_fix", message: "Owner requested a draft PR attempt." } } });
    if (!result.matchedCount) throw fail("Only an eligible assessment can be attempted once.", 409);
    res.status(202).json({ queued: true });
  }));
  router.post("/:projectId/runs/:runId/cancel", handler(async (req, res) => {
    // Publishing cannot be interrupted between its external branch and PR writes.
    const result = await d.Run.updateOne({ _id: req.run._id, ...owner(req), status: { $in: ["queued", "assessing", "eligible", "queued_fix", "generating"] } }, { $set: { status: "cancelled", active: false, message: "Cancelled by the project owner." }, $unset: { leaseToken: 1, leaseUntil: 1 }, $push: { events: { at: new Date(), status: "cancelled", message: "Cancelled by the project owner." } } });
    if (!result.matchedCount) throw fail("This run cannot be cancelled now. Published PRs must be closed on GitHub.", 409);
    res.json({ cancelled: true });
  }));
  router.post("/:projectId/runs/:runId/refresh", handler(async (req, res) => {
    if (req.run.active || !req.run.branch) throw fail("This run has no published branch to refresh yet.", 409);
    await consumeLimit(`pr-sync:${req.user.id}`, 6);
    await d.workflow.syncRun(req.run._id);
    res.json({ refreshed: true });
  }));
  router.post("/:projectId/runs/:runId/recover", handler(async (req, res) => {
    await consumeLimit(`pr-sync:${req.user.id}`, 6);
    await d.workflow.recoverRun(req.run._id);
    res.json({ recovered: true });
  }));
  router.post("/:projectId/runs/:runId/shipped", handler(async (req, res) => {
    await consumeLimit(`pr-sync:${req.user.id}`, 6);
    await d.workflow.markShipped(req.run);
    res.json({ shipped: true });
  }));
  return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
