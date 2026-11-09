const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const User = require("../models/User");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const { createProject, submitFeedback, deleteProject, deleteAccount } = require("../services/project-lifecycle");
let mongo;
test.before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});
test.after(async () => { await mongoose.disconnect(); await mongo?.stop(); });
async function fixture() {
  const uid = new mongoose.Types.ObjectId().toString();
  const user = await User.create({ firebaseUid: uid, email: `${uid}@example.com` });
  const project = await createProject({ userId: user._id, name: "Feedback", fields: [{ type: "text", label: "Message", required: true }] });
  return { user, project, answers: { [project.fields[0]._id]: "A useful response" } };
}
test("concurrent submissions and deletion cannot leave orphan responses", async () => {
  const { user, project, answers } = await fixture();
  await Promise.allSettled([
    ...Array.from({ length: 5 }, () => submitFeedback({ _id: project._id }, answers)),
    deleteProject({ _id: project._id, userId: user._id }),
  ]);
  assert.equal(await Project.countDocuments({ _id: project._id }), 0);
  assert.equal(await Feedback.countDocuments({ projectId: project._id }), 0);
});
test("account deletion fences new work and resumes after identity-provider failure", async () => {
  const { user, project, answers } = await fixture();
  await assert.rejects(deleteAccount(user.firebaseUid, "token", async () => { throw new Error("provider unavailable"); }));
  assert.equal((await User.findById(user._id)).deleting, true);
  await assert.rejects(createProject({ userId: user._id, name: "Too late", fields: [{ type: "text", label: "Message" }] }), { status: 404 });
  await assert.rejects(submitFeedback({ _id: project._id }, answers), { status: 404 });
  await deleteAccount(user.firebaseUid, "token", async () => {});
  assert.equal(await User.findById(user._id), null);
  assert.equal(await Project.countDocuments({ userId: user._id }), 0);
});

test("persistent send records survive worker retries and competing workers", async () => {
  const { deliverOnce } = require("../services/deliver-once");
  let sends = 0, release;
  const input = { batchId: "one-batch" };
  const first = deliverOnce(input, async () => { sends++; await new Promise(resolve => { release = resolve; }); });
  while (!release) await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(deliverOnce(input, async () => { sends++; }), { deliveryUncertain: true });
  release(); await first;
  await deliverOnce(input, async () => { sends++; });
  assert.equal(sends, 1);
});
test("unknown send outcomes pause retries, explicit rejection can retry", async () => {
  const { deliverOnce } = require("../services/deliver-once");
  let sends = 0;
  await assert.rejects(deliverOnce({ batchId: "ambiguous" }, async () => { sends++; throw new Error("connection lost after send"); }), { deliveryUncertain: true });
  await assert.rejects(deliverOnce({ batchId: "ambiguous" }, async () => { sends++; }), { deliveryUncertain: true });
  assert.equal(sends, 1);
  await assert.rejects(deliverOnce({ batchId: "rejected" }, async () => { throw Object.assign(new Error("rate limited"), { deliveryRejected: true }); }));
  await deliverOnce({ batchId: "rejected" }, async () => { sends++; });
  assert.equal(sends, 2);
});

test("public widget exposes only form configuration and cannot use UID headers as owner access", async (t) => {
  const express = require("express");
  const app = express(); app.use(express.json());
  app.use("/api/widget", require("../routes/widget"));
  app.use("/api/private", require("../middleware/auth"), (_, res) => res.json({ private: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { user, project, answers } = await fixture();
  await Project.updateOne({ _id: project._id }, { $set: { slackWorkspace: "private-workspace", submissionKeyHash: "private-hash" } });
  const config = await fetch(`${base}/api/widget/${project._id}`);
  assert.equal(config.status, 200);
  assert.deepEqual(Object.keys(await config.json()).sort(), ["appearance", "fields", "name", "shippingUpdatesEnabled", "theme"]);
  const denied = await fetch(`${base}/api/private`, { headers: { "firebase-uid": user.firebaseUid } });
  assert.equal(denied.status, 401);
  const post = (formAnswers) => fetch(`${base}/api/widget/${project._id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formAnswers }) });
  assert.equal((await post({})).status, 400);
  assert.equal((await post(answers)).status, 201);
  await deleteProject({ _id: project._id, userId: user._id });
  assert.equal((await post(answers)).status, 404);
});
test("the public submission quota is atomic across concurrent requests", async () => {
  const { consumeLimit } = require("../services/rate-limit");
  const results = await Promise.allSettled(Array.from({ length: 30 }, () => consumeLimit("concurrent-test", 10)));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 10);
  assert.equal(results.filter(result => result.status === "rejected" && result.reason.status === 429).length, 20);
});

test("custom forms accept cross-origin Bearer submissions and preflight from unrelated frontends", async (t) => {
  const express = require("express");
  const cors = require("cors");
  const { createHash } = require("node:crypto");
  const app = express();
  app.use(cors(require("../config/cors"))); app.use(express.json());
  app.use("/api/submissions", require("../routes/submissions"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const { project, answers } = await fixture();
  const key = `uf_${"a".repeat(64)}`;
  await Project.updateOne({ _id: project._id }, { $set: { submissionKeyHash: createHash("sha256").update(key).digest("hex") } });
  const url = `http://127.0.0.1:${server.address().port}/api/submissions/${project._id}`;
  for (const origin of ["http://localhost:3000", "https://independent-frontend.example"]) {
    const preflight = await fetch(url, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
    assert.match(preflight.headers.get("access-control-allow-headers"), /authorization/i);
    const response = await fetch(url, { method: "POST", headers: { Origin: origin, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ formAnswers: answers }) });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
  }
  await Project.updateOne({ _id: project._id }, { $unset: { submissionKeyHash: 1 } });
  const revoked = await fetch(url, { method: "POST", headers: { Origin: "https://independent-frontend.example", Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ formAnswers: answers }) });
  assert.equal(revoked.status, 404);
});

test("project setting controls subscriptions on every submission path", async () => {
  const { project, answers } = await fixture();
  assert.equal(project.shippingUpdatesEnabled, false);
  const submit = () => submitFeedback({ _id: project._id }, answers, "person@example.com");
  let feedback = await submit();
  assert.equal((await Feedback.findById(feedback._id).select("+subscriptionEmail")).subscriptionEmail, undefined);
  await Project.updateOne({ _id: project._id }, { $set: { shippingUpdatesEnabled: true } });
  feedback = await submit();
  assert.equal((await Feedback.findById(feedback._id).select("+subscriptionEmail")).subscriptionEmail, "person@example.com");
  await Project.updateOne({ _id: project._id }, { $set: { shippingUpdatesEnabled: false } });
  feedback = await submit();
  assert.equal((await Feedback.findById(feedback._id).select("+subscriptionEmail")).subscriptionEmail, undefined);
});
