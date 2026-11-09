const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const User = require("../models/User");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const Run = require("../models/PullRequestRun");
const { resetFeedback, submitFeedback } = require("../services/project-lifecycle");
let mongo, server, base, user, project;
test.before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri());
  await Promise.all([Project.init(), Feedback.init(), User.init(), Run.init()]);
  const app = express(); app.use(express.json()); app.use((req, res, next) => { req.user = { id: req.headers["x-user"] || String(user._id) }; next(); });
  app.use("/feedback", require("../routes/feedback")); server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await mongo.stop(); });
test.beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Feedback.deleteMany({}), Run.deleteMany({})]);
  user = await User.create({ firebaseUid: "reset-user", email: "owner@example.com" });
  project = await Project.create({ userId: user._id, name: "Product", shippingUpdatesEnabled: true, fields: [{ type: "text", label: "Feedback" }], feedbackSummary: { tldr: "Old feedback", features: ["Fix label"] }, summaryLock: "old-lease", summaryLockUntil: new Date(Date.now() + 60000), workbenchIssues: [{ title: "Fix label", status: "todo" }], notifications: { email: { enabled: true, cadence: "hourly", pendingSummary: { tldr: "Stale digest" }, pendingUntil: new Date(), lockToken: "old-digest", lockUntil: new Date(Date.now() + 60000), lastCount: 5 } } });
});
const post = (id, body, owner) => fetch(`${base}/feedback/project/${id}/reset`, { method: "POST", headers: { "Content-Type": "application/json", ...(owner ? { "x-user": owner } : {}) }, body: JSON.stringify(body) });
test("reset deletes responses and opt-ins, clears summary/digests/evidence, and preserves issues and PR runs", async () => {
  const response = await Feedback.create({ projectId: project._id, formAnswers: { message: "Old feedback" }, subscriptionEmail: "customer@example.com" });
  await Project.updateOne({ _id: project._id }, { $set: { "workbenchIssues.0.responseIds": [response._id] } });
  const issue = project.workbenchIssues[0];
  await Run.create({ projectId: project._id, userId: user._id, issueId: issue._id, acceptance: "Existing acceptance criteria", status: "eligible", active: false });
  const result = await post(project._id, { confirm: true }); assert.equal(result.status, 200); assert.equal((await result.json()).deletedCount, 1);
  const saved = await Project.findById(project._id).select("+workbenchIssues +summaryLock");
  assert.equal(await Feedback.countDocuments({ projectId: project._id }), 0);
  assert.equal(saved.feedbackSummary, null); assert.equal(saved.summaryLock, undefined); assert.equal(saved.feedbackGeneration, 1);
  assert.equal(saved.workbenchIssues[0].title, issue.title); assert.equal(saved.workbenchIssues[0].responseIds.length, 0);
  assert.equal(saved.fields[0].label, "Feedback"); assert.equal(await Run.countDocuments({ projectId: project._id }), 1);
  assert.equal(saved.notifications.email.enabled, true); assert.equal(saved.notifications.email.pendingSummary, undefined); assert.equal(saved.notifications.email.lockToken, undefined); assert.equal(saved.notifications.email.lastCount, 0);
  assert.equal((await Project.updateOne({ _id: project._id, summaryLock: "old-lease" }, { $set: { feedbackSummary: { tldr: "Late summary" } } })).matchedCount, 0);
  assert.equal((await Project.updateOne({ _id: project._id, "notifications.email.lockToken": "old-digest" }, { $set: { "notifications.email.pendingSummary": { tldr: "Late digest" } } })).matchedCount, 0);
});
test("reset requires explicit confirmation and project ownership", async () => {
  assert.equal((await post(project._id, {})).status, 400);
  assert.equal((await post("invalid", { confirm: true })).status, 400);
  assert.equal((await post(project._id, { confirm: true }, String(new mongoose.Types.ObjectId()))).status, 404);
  assert.equal((await Project.findById(project._id)).feedbackGeneration, 0);
});
test("reset fences summaries read before the reset and handles concurrent new submissions", async () => {
  await Promise.all([
    resetFeedback({ _id: project._id, userId: user._id }),
    submitFeedback({ _id: project._id }, { [project.fields[0]._id]: "New feedback" }),
  ]);
  assert.equal((await Project.findOneAndUpdate({ _id: project._id, feedbackGeneration: 0 }, { $set: { summaryLock: "stale-snapshot" } })), null);
  const count = await Feedback.countDocuments({ projectId: project._id }); assert.ok(count === 0 || count === 1);
  await submitFeedback({ _id: project._id }, { [project.fields[0]._id]: "After reset" });
  assert.equal(await Feedback.countDocuments({ projectId: project._id }), count + 1);
});
