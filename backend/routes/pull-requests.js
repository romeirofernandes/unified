const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Connection = require("../models/PullRequestConnection");
const Run = require("../models/PullRequestRun");
const Blob = require("../models/RepositoryBlob");
const Access = require("../models/GitHubAccess");
const github = require("../services/pr-github");
const workflow = require("../services/pr-workflow");
const { notificationState } = require("../services/pr-notifications");
const { consumeLimit } = require("../services/rate-limit");
const { fail, repositoryName, fingerprint, sensitive } = require("../services/pr-policy");
function createRouter(overrides = {}) {
  const d = { Project, Connection, Run, Blob, Access, github, workflow, ...overrides };
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
  async function repositories(req) {
    const [access, saved] = await Promise.all([d.Access.findOne({ userId: req.user.id, expiresAt: { $gt: new Date() } }).lean(), d.Connection.find({ userId: req.user.id, connectedAt: { $exists: true } }).lean()]);
    return [...new Map([...saved, ...(access?.repositories || [])].map(item => [item.repositoryId, { repository: item.repository, repositoryId: item.repositoryId, installationId: item.installationId, defaultBranch: item.defaultBranch }])).values()];
  }
  router.get("/:projectId", handler(async (req, res) => {
    const [connection, runs, available] = await Promise.all([d.Connection.findOne(owner(req)).select("+pendingRepository").lean(), d.Run.find(owner(req)).sort({ createdAt: -1 }).limit(30).select("-patch -events -files").lean(), repositories(req)]);
    res.json({ configured: d.github.configured(), installUrl: d.github.configured() ? `https://github.com/apps/${encodeURIComponent(process.env.GITHUB_APP_SLUG)}/installations/new` : null,
      repositories: available.map(({ repository, repositoryId }) => ({ repository, repositoryId })), setupRepository: connection?.pendingRepository || "", connection: connection?.connectedAt ? { repository: connection.repository, defaultBranch: connection.defaultBranch, connectedAt: connection.connectedAt } : null, runs });
  }));
  router.post("/:projectId/connect", handler(async (req, res) => {
    await idle(req);
    const repository = req.body?.repository ? repositoryName(req.body.repository) : "";
    const { state, url } = d.github.authorization();
    await d.Connection.updateOne({ projectId: req.project._id }, { $set: { userId: req.user.id, stateHash: d.github.stateHash(state), stateUntil: new Date(Date.now() + 10 * 60000), pendingRepository: repository, pendingCheck: "" }, $unset: { returnStateHash: 1, returnStateUntil: 1, returnStateResult: 1 } }, { upsert: true });
    res.json({ url });
  }));
  router.put("/:projectId/connection/repository", handler(async (req, res) => {
    await idle(req);
    const chosen = (await repositories(req)).find(item => item.repositoryId === req.body?.repositoryId);
    if (!chosen) throw fail("Refresh repositories from GitHub, then select one you have authorized.", 403);
    await consumeLimit(`pr-repository:${req.user.id}`, 10);
    const { repo } = await d.github.repositoryClient(chosen);
    const value = { ...chosen, defaultBranch: repo?.default_branch || chosen.defaultBranch, requiredCheck: "", connectedAt: new Date() };
    const connection = await mongoose.connection.transaction(async session => {
      const project = await d.Project.findOneAndUpdate({ _id: req.project._id, userId: req.user.id }, { $inc: { writeVersion: 1 } }, { session });
      if (!project) throw fail("Project not found.", 404);
      return d.Connection.findOneAndUpdate(owner(req), { $set: value }, { new: true, upsert: true, session });
    });
    res.json({ repository: connection.repository });
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
    if (await d.Run.exists({ ...owner(req), issueId: issue._id, branch: { $exists: true }, status: { $nin: ["closed", "shipped", "cancelled"] } })) throw fail("This issue already has a branch or PR. Refresh its status and resolve it before starting another run.", 409);
    // Bound inference spending per project as well as excluding concurrent jobs.
    if (await d.Run.countDocuments({ ...owner(req), createdAt: { $gt: new Date(Date.now() - 3600000) } }) >= 10) throw fail("This project reached its 10-assessments-per-hour limit. Try again later.", 429);
    await d.Run.init();
    // Share the project's write lock with account/project deletion so a deleted project cannot leave a new job behind.
    const run = await mongoose.connection.transaction(async session => {
      const current = await d.Project.findOneAndUpdate({ _id: req.project._id, userId: req.user.id, workbenchIssues: { $elemMatch: { _id: issue._id, title: issue.title, description: issue.description, deleted: false, status: { $ne: "done" } } } }, { $inc: { writeVersion: 1 } }, { session });
      if (!current) throw fail("The issue changed or the project was removed. Reload and try again.", 409);
      const [created] = await d.Run.create([{ ...owner(req), issueId: issue._id, issue: { title: issue.title, description: issue.description || "", fingerprint: fingerprint(issue) }, acceptance: acceptance.trim(), repository: connection.repository, repositoryId: connection.repositoryId, installationId: connection.installationId, baseBranch: connection.defaultBranch, requiredCheck: "", model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b", status: "queued", active: true, events: [{ at: new Date(), status: "queued", stage: "scope", message: "Assessment queued." }] }], { session });
      return created;
    });
    res.status(202).json({ _id: run._id });
  }));
  router.get("/:projectId/runs/:runId", handler(async (req, res) => res.json({ ...req.run, notification: await notificationState(req.run, req.project), shippingUpdatesEnabled: !!req.project.shippingUpdatesEnabled })));
  router.post("/:projectId/runs/:runId/attempt", handler(async (req, res) => {
    const issue = req.project.workbenchIssues.find(item => String(item._id) === String(req.run.issueId) && !item.deleted && item.status !== "done");
    if (!issue || fingerprint(issue) !== req.run.issue.fingerprint) throw fail("The issue changed. Start a fresh assessment.", 409);
    if (await d.Run.exists({ ...owner(req), issueId: issue._id, _id: { $ne: req.run._id }, branch: { $exists: true }, status: { $nin: ["closed", "shipped", "cancelled"] } })) throw fail("Another run already has a branch for this issue.", 409);
    await mongoose.connection.transaction(async session => {
      const result = await d.Run.updateOne({ _id: req.run._id, ...owner(req), status: "eligible", active: false }, { $set: { status: "queued_fix", active: true, message: "Fix queued.", workbenchManaged: issue.status === "todo", workbenchPreviousStatus: issue.status }, $push: { events: { at: new Date(), status: "queued_fix", stage: "patch", message: "Fix requested. Workbench issue moved to In progress." } } }, { session });
      if (!result.matchedCount) throw fail("Only an eligible assessment can be attempted once.", 409);
      const project = await d.Project.updateOne({ _id: req.project._id, userId: req.user.id, workbenchIssues: { $elemMatch: { _id: issue._id, deleted: false, title: issue.title, status: issue.status } } }, { $set: { "workbenchIssues.$.status": "in_progress" } }, { session });
      if (!project.matchedCount) throw fail("The issue changed. Reload the workbench before attempting it.", 409);
    });
    res.status(202).json({ queued: true });
  }));
  router.post("/:projectId/runs/:runId/cancel", handler(async (req, res) => {
    // Publishing cannot be interrupted between its external branch and PR writes.
    const result = await d.Run.updateOne({ _id: req.run._id, ...owner(req), status: { $in: ["queued", "assessing", "eligible", "queued_fix", "generating"] } }, { $set: { status: "cancelled", active: false, failedStage: ["queued_fix", "generating"].includes(req.run.status) ? "patch" : "scope", message: "Cancelled by the project owner." }, $unset: { leaseToken: 1, leaseUntil: 1 }, $push: { events: { at: new Date(), status: "cancelled", stage: ["queued_fix", "generating"].includes(req.run.status) ? "patch" : "scope", message: "Cancelled by the project owner." } } });
    if (!result.matchedCount) throw fail("This run cannot be cancelled now. Published PRs must be closed on GitHub.", 409);
    await workflow.restoreWorkbench(req.run);
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
