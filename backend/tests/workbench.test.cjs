const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Project = require("../models/Project");
let mongo, server, base;
const userId = new mongoose.Types.ObjectId();
test.before(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.user = { id: req.headers["x-test-user"] || String(userId) }; next(); });
  app.use("/workbench", require("../routes/workbench"));
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/workbench`;
});
test.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await mongo?.stop(); });
const fixture = () => Project.create({ userId, name: "Workbench", fields: [{ type: "text", label: "Feedback" }], feedbackSummary: { features: ["Fix search", " fix   SEARCH ", "Add filters"] } });
const request = (path, method = "GET", body, headers = {}) => fetch(`${base}/${path}`, { method, headers: { "Content-Type": "application/json", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
test("concurrent imports deduplicate and preserve edits, moves, and deletions", async () => {
  const project = await fixture(), id = String(project._id);
  const reads = await Promise.all(Array.from({ length: 5 }, () => request(id)));
  assert.ok(reads.every(res => res.status === 200));
  let cards = await (await request(id)).json(); assert.equal(cards.length, 2);
  const search = cards.find(card => card.title === "Fix search");
  assert.equal((await request(`${id}/${search._id}`, "PUT", { title: "Repair search", description: "On mobile", status: "done" })).status, 200);
  cards = await (await request(id)).json();
  assert.equal(cards.find(card => card._id === search._id).status, "done");
  assert.equal(cards.find(card => card._id === search._id).title, "Repair search");
  assert.equal((await request(`${id}/${search._id}`, "DELETE")).status, 200);
  await Project.updateOne({ _id: id }, { $set: { "feedbackSummary.features": ["Fix search", "Add filters", "Support exports"] } });
  cards = await (await request(id)).json(); assert.equal(cards.length, 2);
  assert.ok(cards.some(card => card.title === "Support exports" && card.status === "todo"));
  assert.ok(!cards.some(card => card._id === search._id));
});
test("manual CRUD validates inputs and cannot restore deleted cards", async () => {
  const project = await Project.create({ userId, name: "Empty", fields: [{ type: "text", label: "Feedback" }] }), id = String(project._id);
  assert.deepEqual(await (await request(id)).json(), []);
  for (const body of [{ title: " ", description: "", status: "todo" }, { title: "Test", description: "", status: "invalid" }, { title: "Test", description: {}, status: "todo" }, { title: "x".repeat(2001), description: "", status: "todo" }]) assert.equal((await request(id, "POST", body)).status, 400);
  const res = await request(id, "POST", { title: " Manual task ", description: "Details", status: "todo", sourceKey: "forged", deleted: true }); assert.equal(res.status, 201);
  const [card] = await res.json(); assert.equal(card.title, "Manual task"); assert.equal(card.deleted, false); assert.equal(card.sourceKey, undefined);
  assert.equal((await request(`${id}/${card._id}`, "DELETE")).status, 200);
  assert.equal((await request(`${id}/${card._id}`, "PUT", { title: "Restore", description: "", status: "todo" })).status, 404);
  assert.deepEqual(await (await request(id)).json(), []);
  assert.equal((await request("invalid")).status, 400);
});
test("all operations enforce ownership and project isolation", async () => {
  const project = await fixture(), id = String(project._id);
  const [card] = await (await request(id)).json();
  const stranger = { "x-test-user": String(new mongoose.Types.ObjectId()) }, input = { title: "Intrusion", description: "", status: "done" };
  for (const [path, method, body] of [[id, "GET"], [id, "POST", input], [`${id}/${card._id}`, "PUT", input], [`${id}/${card._id}`, "DELETE"]]) assert.equal((await request(path, method, body, stranger)).status, 404);
  const other = await fixture(); assert.equal((await request(`${other._id}/${card._id}`, "DELETE")).status, 404);
  assert.equal((await (await request(id)).json()).length, 2);
  assert.equal((await Project.findById(id).lean()).workbenchIssues, undefined);
});

test("legacy Backlog issues migrate to To do and placement persists", async () => {
  const project = await fixture(), id = String(project._id), issueId = new mongoose.Types.ObjectId();
  await Project.collection.updateOne({ _id: project._id }, { $push: { workbenchIssues: { _id: issueId, title: "Legacy issue", status: "backlog", description: "", deleted: false, createdAt: new Date() } } });
  const cards = await (await request(id)).json();
  assert.equal(cards.find(card => card._id === String(issueId)).status, "todo");
  const input = { title: "Legacy issue", description: "", status: "in_progress", position: 42 };
  assert.equal((await request(`${id}/${issueId}`, "PUT", input)).status, 200);
  assert.equal((await (await request(id)).json()).find(card => card._id === String(issueId)).position, 42);
  for (const position of ["42", null, 1e30]) assert.equal((await request(`${id}/${issueId}`, "PUT", { ...input, position })).status, 400);
  assert.equal((await request(id, "POST", { ...input, status: "backlog" })).status, 400);
});

test("older projects without a board or actionable summary return an empty board", async () => {
  for (const feedbackSummary of [null, {}, { features: [] }, { features: null }]) {
    const _id = new mongoose.Types.ObjectId();
    await Project.collection.insertOne({ _id, userId, name: "Older project", fields: [{ type: "text", label: "Feedback" }], feedbackSummary });
    const res = await request(String(_id));
    assert.equal(res.status, 200, JSON.stringify(feedbackSummary));
    assert.deepEqual(await res.json(), []);
    const created = await request(String(_id), "POST", { title: "First issue", description: "", status: "todo" });
    assert.equal(created.status, 201);
    assert.equal((await created.json())[0].title, "First issue");
  }
});

test("evidence retains original responses, deduplicates users, and enforces isolation", async () => {
  const Feedback = require("../models/Feedback");
  const project = await Project.create({ userId, name: "Evidence", fields: [{ type: "text", label: "Problem" }, { type: "email", label: "Email" }] });
  const [question, email] = project.fields.map(field => String(field._id));
  const feedbacks = await Feedback.create([
    { projectId: project._id, formAnswers: { [question]: "Search freezes", [email]: "USER@example.com" } },
    { projectId: project._id, formAnswers: { [question]: "Search still freezes", [email]: "user@example.com" } },
    { projectId: project._id, formAnswers: { [question]: "Search is broken" } },
    { projectId: new mongoose.Types.ObjectId(), formAnswers: { [question]: "Private" } },
  ]);
  await Project.updateOne({ _id: project._id }, { $set: { feedbackSummary: { features: ["Fix search"], evidence: [{ title: "Fix search", responseIds: [...feedbacks.map(item => String(item._id)), "invalid"] }] } } });
  const [issue] = await (await request(String(project._id))).json();
  const path = `${project._id}/${issue._id}/evidence`;
  const evidence = await (await request(path)).json();
  assert.equal(evidence.responseCount, 3);
  assert.equal(evidence.affectedUserCount, 1);
  assert.equal(evidence.unidentifiedResponseCount, 1);
  assert.ok(evidence.responses.some(item => item.answers[0].answer === "Search freezes"));
  assert.ok(evidence.responses.every(item => item.answers.length === 1));
  assert.equal((await request(path, "GET", undefined, { "x-test-user": String(new mongoose.Types.ObjectId()) })).status, 404);
  await request(`${project._id}/${issue._id}`, "PUT", { title: "Renamed", description: "", status: "done" });
  assert.equal((await (await request(path)).json()).responseCount, 3);
  await Feedback.deleteOne({ _id: feedbacks[0]._id });
  assert.equal((await (await request(path)).json()).responseCount, 2);
  await request(`${project._id}/${issue._id}`, "DELETE");
  assert.equal((await request(path)).status, 404);
});
