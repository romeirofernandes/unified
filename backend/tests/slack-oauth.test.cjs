const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { authorization, stateHash, exchangeCode } = require("../services/slack-oauth");
process.env.SLACK_CLIENT_ID = "test-client";
process.env.SLACK_CLIENT_SECRET = "test-secret";
process.env.SLACK_REDIRECT_URI = "https://api.example.com/api/slack/callback";
process.env.FRONTEND_URL = "https://app.example.com";

test("Slack installs request the channel picker with a random state and exact redirect", () => {
  const first = authorization(), second = authorization();
  const url = new URL(first.url);
  assert.equal(url.origin, "https://slack.com");
  assert.equal(url.searchParams.get("scope"), "incoming-webhook");
  assert.equal(url.searchParams.get("redirect_uri"), process.env.SLACK_REDIRECT_URI);
  assert.equal(url.searchParams.get("state"), first.state);
  assert.notEqual(first.state, second.state);
  assert.notEqual(stateHash(first.state), first.state);
});
test("OAuth exchanges the code server-side and validates the returned webhook", async () => {
  const connection = await exchangeCode("code", async (url, options) => {
    assert.equal(url, "https://slack.com/api/oauth.v2.access");
    assert.equal(options.body.get("client_secret"), "test-secret");
    assert.equal(options.body.get("code"), "code");
    return { ok: true, json: async () => ({ ok: true, team: { name: "Team" }, incoming_webhook: { channel: "#feedback", url: "https://hooks.slack.com/services/T/B/token" } }) };
  });
  assert.equal(connection.workspace, "Team");
  assert.equal(connection.channel, "#feedback");
  await assert.rejects(exchangeCode("code", async () => ({ ok: true, json: async () => ({ ok: false, error: "secret provider details" }) })), /did not authorize/);
  await assert.rejects(exchangeCode("code", async () => ({ ok: true, json: async () => ({ ok: true, incoming_webhook: { url: "http://localhost" } }) })), /incoming webhook/);
});
function callbackRoutes({ project = { _id: "project", userId: "owner" }, exchange = async () => ({ webhook: "webhook", workspace: "Team", channel: "#feedback" }) } = {}) {
  let handler, consumed = false, written;
  const source = fs.readFileSync(path.join(__dirname, "../routes/slack.js"), "utf8");
  vm.runInNewContext(source, {
    require: (name) => name === "express" ? { Router: () => ({ get: (url, callback) => { handler = callback; } }) } : name === "../models/Project" ? {
      findOneAndUpdate: (filter) => { assert.equal(filter.slackOAuthStateHash, stateHash("a".repeat(64))); assert.ok(filter.slackOAuthStateUntil.$gt); return { lean: async () => { if (consumed) return null; consumed = true; return project; } }; },
      updateOne: async (filter, update) => { assert.equal(filter.userId, "owner"); written = update; return { matchedCount: 1 }; },
    } : name === "../services/secret-storage" ? { encrypt: (value) => `encrypted:${value}` } : name === "../services/slack-oauth" ? { configured: () => true, stateHash, exchangeCode: exchange } : require(name),
    module: { exports: {} }, process, URL,
  });
  return { handler: (...args) => handler(...args), written: () => written };
}
const response = () => ({ code: 200, set() {}, status(code) { this.code = code; return this; }, send(text) { this.text = text; return this; }, redirect(url) { this.location = url; return this; } });
test("callback consumes state once, encrypts the destination and blocks replay", async () => {
  const routes = callbackRoutes();
  const request = { query: { state: "a".repeat(64), code: "code" } };
  const res = response();
  await routes.handler(request, res);
  assert.equal(routes.written().$set.slackWebhookEncrypted, "encrypted:webhook");
  assert.match(res.location, /^https:\/\/app.example.com\/dashboard\/integrations\?/);
  assert.match(res.location, /slack=connected/);
  assert.doesNotMatch(res.location, /webhook|token|secret/);
  const replay = response();
  await routes.handler(request, replay);
  assert.equal(replay.code, 400);
});
test("invalid state and cancelled installations never exchange codes or change connections", async () => {
  const routes = callbackRoutes({ exchange: () => assert.fail("must not exchange") });
  const invalid = response();
  await routes.handler({ query: { state: "bad" } }, invalid);
  assert.equal(invalid.code, 400);
  const cancelled = response();
  await routes.handler({ query: { state: "a".repeat(64), error: "access_denied" } }, cancelled);
  assert.match(cancelled.location, /slack=cancelled/);
  assert.equal(routes.written(), undefined);
});
