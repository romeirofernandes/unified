const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
function routes(model, deliver = async () => {}) {
  const result = new Map();
  const router = Object.fromEntries(["get", "put", "post"].map((method) => [method, (url, handler) => result.set(`${method} ${url}`, handler)]));
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../routes/integrations.js"), "utf8"), {
    require: (name) => name === "express" ? { Router: () => router } : name === "../models/Project" ? model : name === "../services/secret-storage" ? { encrypt: (value) => `encrypted:${value}` } : name === "../services/digest-worker" ? { intervalMs: () => 86400000 } : name === "../services/digest-delivery" ? { ...require("../services/digest-delivery"), deliverDigest: deliver } : require(name),
    module: { exports: {} }, process,
  });
  return result;
}
const query = (value) => ({ select: () => ({ lean: async () => value }) });
const response = () => ({ statusCode: 200, set() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.data = value; return this; } });
const request = (channel = "slack", body = {}) => ({ params: { id: "project", channel }, user: { id: "owner", email: "owner@example.com" }, body });

test("integration settings enforce ownership and omit stored secrets", async () => {
  const handlers = routes({ findOne: (filter) => { assert.equal(filter.userId, "owner"); return query({ slackWebhookEncrypted: "secret", notifications: { slack: { enabled: true, lockToken: "private" } } }); } });
  const res = response();
  await handlers.get("get /:id")(request(), res);
  assert.equal(res.data.slackConnected, true);
  assert.equal(res.data.slackWebhookEncrypted, undefined);
  assert.equal(res.data.slack.lockToken, undefined);
});
test("enabling Slack encrypts the webhook and starts the first digest in the future", async () => {
  let update;
  const handlers = routes({ findOne: () => query({ notifications: {} }), findOneAndUpdate: (filter, value) => { assert.equal(filter.userId, "owner"); update = value; return query({ notifications: { slack: {} } }); } });
  const res = response();
  await handlers.get("put /:id/:channel")(request("slack", { enabled: true, cadence: "daily", webhook: "https://hooks.slack.com/services/T/B/secret" }), res);
  assert.equal(res.statusCode, 200);
  assert.match(update.$set.slackWebhookEncrypted, /^encrypted:/);
  assert.ok(update.$set["notifications.slack.nextRunAt"] > new Date());
  assert.ok(update.$set["notifications.slack.since"]);
});
test("disconnecting Slack pauses delivery and removes its encrypted credential", async () => {
  let update;
  const handlers = routes({ findOne: () => query({ notifications: {} }), findOneAndUpdate: (filter, value) => { update = value; return query({ notifications: {} }); } });
  await handlers.get("put /:id/:channel")(request("slack", { enabled: true, cadence: "daily", disconnect: true }), response());
  assert.equal(update.$set["notifications.slack.enabled"], false);
  assert.equal(update.$unset.slackWebhookEncrypted, 1);
  assert.equal(update.$unset["notifications.slack.lockToken"], 1);
});
test("missing provider setup and invalid channels cannot enable delivery", async () => {
  const handlers = routes({ findOne: () => query({ notifications: {} }) });
  const email = response();
  await handlers.get("put /:id/:channel")(request("email", { enabled: true, cadence: "daily" }), email);
  assert.equal(email.statusCode, 503);
  const slack = response();
  await handlers.get("put /:id/:channel")(request("slack", { enabled: true, cadence: "daily" }), slack);
  assert.equal(slack.statusCode, 400);
  const invalid = response();
  await handlers.get("put /:id/:channel")(request("other", { enabled: true, cadence: "daily" }), invalid);
  assert.equal(invalid.statusCode, 400);
});
test("test sends use sample feedback and do not advance pending cursors", async () => {
  let sent, write;
  const project = { name: "App", slackWebhookEncrypted: "secret", notifications: { slack: {} } };
  const handlers = routes({ findOne: () => query(project), findOneAndUpdate: (filter, update) => { write = update; return query(project); } }, async (input) => { sent = input; });
  const res = response();
  await handlers.get("post /:id/:channel/test")(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.test, true);
  assert.equal(sent.recipient, "owner@example.com");
  assert.equal(write.$set["notifications.slack.since"], undefined);
  assert.ok(write.$set["notifications.slack.testAfter"]);
});

test("install links are project-owned and persist only a short-lived hashed state", async () => {
  process.env.SLACK_CLIENT_ID = "client";
  process.env.SLACK_CLIENT_SECRET = "secret";
  process.env.SLACK_REDIRECT_URI = "https://api.example.com/api/slack/callback";
  let saved;
  const handlers = routes({ findOneAndUpdate: async (filter, update) => { assert.equal(filter.userId, "owner"); assert.equal(filter._id, "project"); saved = update.$set; return {}; } });
  const res = response();
  await handlers.get("post /:id/slack/install")(request(), res);
  const url = new URL(res.data.url);
  const state = url.searchParams.get("state");
  assert.equal(saved.slackOAuthStateHash, require("node:crypto").createHash("sha256").update(state).digest("hex"));
  assert.ok(saved.slackOAuthStateUntil > new Date());
  assert.equal(saved.state, undefined);
  const missing = routes({ findOneAndUpdate: async () => null });
  const denied = response();
  await missing.get("post /:id/slack/install")(request(), denied);
  assert.equal(denied.statusCode, 404);
  delete process.env.SLACK_CLIENT_ID;
  delete process.env.SLACK_CLIENT_SECRET;
  delete process.env.SLACK_REDIRECT_URI;
});
