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
    if (!d.github.configured()) return res.status(503).send("GitHub connection is not configured.");
    if (typeof req.query.state !== "string" || !/^[a-f0-9]{64}$/.test(req.query.state)) return res.status(400).send("Invalid connection link. Start again in Pull requests.");
    let connection;
    try {
      connection = await d.Connection.findOneAndUpdate({ stateHash: d.github.stateHash(req.query.state), stateUntil: { $gt: new Date() } }, { $unset: { stateHash: 1, stateUntil: 1 } }, { new: false }).select("+pendingRepository +pendingCheck").lean();
      if (!connection) return res.status(400).send("Expired or already used connection link. Start again in Pull requests.");
      if (typeof req.query.code !== "string" || req.query.code.length > 2000 || !req.query.code) throw new Error("Invalid code");
      if (!await d.Project.exists({ _id: connection.projectId, userId: connection.userId }) || await d.Run.exists({ projectId: connection.projectId, active: true })) throw new Error("Project unavailable");
      const repository = await d.github.exchange(req.query.code, connection.pendingRepository);
      const updated = await d.Connection.updateOne({ _id: connection._id, pendingRepository: connection.pendingRepository, pendingCheck: connection.pendingCheck }, { $set: { ...repository, requiredCheck: connection.pendingCheck, connectedAt: new Date() }, $unset: { pendingRepository: 1, pendingCheck: 1 } });
      if (!updated.matchedCount) throw new Error("Connection changed during authorization");
      const destination = new URL("/dashboard/pull-requests", process.env.FRONTEND_URL || "http://localhost:5173");
      destination.searchParams.set("project", String(connection.projectId)); destination.searchParams.set("github", "connected");
      res.redirect(destination.toString());
    } catch {
      if (!connection) return res.status(502).send("GitHub connection failed. Start again in Pull requests.");
      const destination = new URL("/dashboard/pull-requests", process.env.FRONTEND_URL || "http://localhost:5173");
      destination.searchParams.set("project", String(connection.projectId)); destination.searchParams.set("github", "error");
      res.redirect(destination.toString());
    }
  });
  return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
