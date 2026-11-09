const express = require("express");
const Connection = require("../models/PullRequestConnection");
const Project = require("../models/Project");
const Run = require("../models/PullRequestRun");
const github = require("../services/pr-github");
function createRouter(overrides = {}) {
  const d = { Connection, Project, Run, github, ...overrides };
  const router = express.Router();
  router.get("/callback", async (req, res) => {
    res.set("Cache-Control", "no-store"); res.set("Referrer-Policy", "no-referrer");
    const back = (result, projectId) => {
      const destination = new URL("/dashboard/pull-requests", process.env.FRONTEND_URL || "http://localhost:5173");
      if (projectId) destination.searchParams.set("project", String(projectId));
      destination.searchParams.set("github", result);
      return res.redirect(destination.toString());
    };
    if (!d.github.configured()) return back("unavailable");
    const validState = typeof req.query.state === "string" && /^[a-f0-9]{64}$/.test(req.query.state);
    // Installation and OAuth are different callbacks. Never consume an OAuth state for installation alone.
    const installation = !req.query.code && /^\d+$/.test(String(req.query.installation_id || "")) && ["install", "update"].includes(req.query.setup_action);
    if (!validState) return back(installation || req.query.code ? "installed" : "expired");
    const hash = d.github.stateHash(req.query.state);
    let connection;
    try {
      if (installation) {
        const pending = await d.Connection.findOne({ stateHash: hash, stateUntil: { $gt: new Date() } }).lean();
        if (!pending) return back("expired");
        return res.redirect(d.github.authorization(req.query.state).url);
      }
      connection = await d.Connection.findOneAndUpdate({ stateHash: hash, stateUntil: { $gt: new Date() } }, { $unset: { stateHash: 1, stateUntil: 1 }, $set: { returnStateHash: hash, returnStateUntil: new Date(Date.now() + 10 * 60000), returnStateResult: "pending" } }, { new: false }).select("+pendingRepository +pendingCheck").lean();
      if (!connection) {
        const previous = await d.Connection.findOne({ returnStateHash: hash, returnStateUntil: { $gt: new Date() } }).select("+returnStateResult").lean();
        const expired = previous || await d.Connection.findOne({ stateHash: hash }).lean();
        return back(previous?.returnStateResult === "connected" ? "connected" : "expired", expired?.projectId);
      }
      if (req.query.error) {
        await d.Connection.updateOne({ _id: connection._id, returnStateHash: hash }, { $set: { returnStateResult: "denied" } });
        return back("denied", connection.projectId);
      }
      if (typeof req.query.code !== "string" || req.query.code.length > 2000 || !req.query.code) throw new Error("Invalid code");
      if (!await d.Project.exists({ _id: connection.projectId, userId: connection.userId }) || await d.Run.exists({ projectId: connection.projectId, active: true })) throw new Error("Project unavailable");
      const repository = await d.github.exchange(req.query.code, connection.pendingRepository);
      const requiredCheck = connection.pendingCheck || (connection.repositoryId === repository.repositoryId ? connection.requiredCheck : "") || "";
      const updated = await d.Connection.updateOne({ _id: connection._id, returnStateHash: hash }, { $set: { ...repository, requiredCheck, connectedAt: new Date(), returnStateResult: "connected" }, $unset: { pendingRepository: 1, pendingCheck: 1 } });
      if (!updated.matchedCount) return back("expired", connection.projectId);
      return back("connected", connection.projectId);
    } catch (error) {
      const result = error.code === "GITHUB_INSTALL_REQUIRED" ? "install_required" : "error";
      if (connection) await d.Connection.updateOne({ _id: connection._id, returnStateHash: hash }, { $set: { returnStateResult: result } }).catch(() => {});
      return back(result, connection?.projectId);
    }
  });
  return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
