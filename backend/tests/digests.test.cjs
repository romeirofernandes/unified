const test = require("node:test");
const assert = require("node:assert/strict");
process.env.INTEGRATION_ENCRYPTION_KEY = "f".repeat(64);
const { encrypt, decrypt } = require("../services/secret-storage");
const { validateSlackWebhook, deliverDigest, digestText } = require("../services/digest-delivery");
const { summaryHash, intervalMs, processDigest } = require("../services/digest-worker");
const webhook = "https://hooks.slack.com/services/T123/B456/abcDEF789";
const project = { _id: "project", name: "Feedback app", slackWebhookEncrypted: encrypt(webhook) };
const summary = { tldr: "People want better docs.", features: ["Add installation examples"] };

test("stored keys can be retrieved, while tampered ciphertext cannot be decrypted", () => {
  const original = "uf_" + "a".repeat(64);
  const ciphertext = encrypt(original);
  assert.notEqual(ciphertext, encrypt(original));
  assert.equal(decrypt(ciphertext), original);
  const parts = ciphertext.split(".");
  parts[2] = Buffer.from("tampered").toString("base64");
  assert.throws(() => decrypt(parts.join(".")));
});
test("Slack URLs reject redirects, credentials, private hosts and lookalike domains", () => {
  assert.equal(validateSlackWebhook(webhook), webhook);
  for (const url of ["http://hooks.slack.com/services/a/b/c", "https://hooks.slack.com.evil.test/services/a/b/c", "https://localhost/services/a/b/c", "https://u:p@hooks.slack.com/services/a/b/c", webhook + "?redirect=1"]) assert.throws(() => validateSlackWebhook(url), { status: 400 });
});
test("Slack delivery uses safe plain text and surfaces provider failures", async () => {
  const request = async (url, options) => {
    assert.equal(url, webhook);
    assert.equal(options.redirect, "error");
    const body = JSON.parse(options.body);
    assert.equal(body.blocks[0].text.type, "plain_text");
    assert.match(body.blocks[1].elements[0].text, /3 new responses/);
    assert.equal(body.blocks[3].text.type, "plain_text");
    return { ok: true };
  };
  await deliverDigest({ project, channel: "slack", count: 3, summary }, request);
  await assert.rejects(deliverDigest({ project, channel: "slack", count: 3, summary }, async () => ({ ok: false, status: 403 })), /Slack delivery failed/);
  assert.match(digestText({ project, summary, count: 1, test: true }), /Test digest.*Feedback app/);
});
test("email delivery uses the owner address, text content and a stable idempotency key", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.DIGEST_EMAIL_FROM = "Unified <feedback@example.com>";
  const keys = [];
  const request = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["owner@example.com"]);
    assert.match(body.text, /People want better docs/);
    keys.push(options.headers["Idempotency-Key"]);
    return { ok: true };
  };
  const input = { project, channel: "email", summary, count: 1, recipient: "owner@example.com", batchId: "fixed-batch" };
  await deliverDigest(input, request);
  await deliverDigest(input, request);
  assert.equal(keys[0], keys[1]);
  delete process.env.RESEND_API_KEY;
  delete process.env.DIGEST_EMAIL_FROM;
  await assert.rejects(deliverDigest(input, request), /not configured/);
});

function workerFixture({ feedback = [], failure = false, claimed = true, current = true, pendingUntil, lastSummaryHash, pendingSummary } = {}) {
  const writes = [], deliveries = [];
  const state = { enabled: true, cadence: "daily", since: new Date("2026-11-01T00:00:00Z"), pendingUntil, lastSummaryHash, pendingSummary };
  const document = { ...project, userId: "owner", notifications: { slack: state } };
  let query;
  const dependencies = {
    Project: {
      findOneAndUpdate: (filter) => {
        assert.equal(filter["notifications.slack.enabled"], true);
        assert.ok(filter.$or);
        return { select: () => ({ lean: async () => claimed ? document : null }) };
      },
      updateOne: async (filter, update) => { writes.push({ filter, update }); },
      exists: async () => current,
    },
    Feedback: { find: (filter) => { query = filter; return { sort: () => ({ lean: async () => feedback }) }; } },
    User: { findById: () => ({ lean: async () => ({ email: "owner@example.com" }) }) },
    summarizeFeedback: async () => summary,
    deliverOnce: async (input, send) => send(input),
    deliverDigest: async (input) => { deliveries.push(input); if (failure) throw new Error("Slack delivery failed (500). Check the connection and try again."); },
  };
  return { writes, deliveries, dependencies, query: () => query };
}
test("empty intervals advance their cursor without sending a message", async () => {
  const fixture = workerFixture();
  await processDigest("project", "slack", fixture.dependencies);
  assert.equal(fixture.deliveries.length, 0);
  assert.ok(fixture.writes.at(-1).update.$set["notifications.slack.since"]);
  assert.equal(fixture.writes.at(-1).update.$set["notifications.slack.lastSentAt"], undefined);
  assert.equal(intervalMs("hourly"), 3600000);
  assert.equal(intervalMs("daily"), 86400000);
});
test("successful digests send the new batch and advance only to the selected boundary", async () => {
  const boundary = new Date("2026-11-02T00:00:00Z");
  const fixture = workerFixture({ feedback: [{ _id: "response" }], pendingUntil: boundary });
  await processDigest("project", "slack", fixture.dependencies);
  assert.equal(fixture.query().timestamp.$lte, boundary);
  assert.equal(fixture.deliveries.length, 1);
  assert.equal(fixture.deliveries[0].count, 1);
  assert.equal(fixture.writes.at(-1).update.$set["notifications.slack.since"], boundary);
  assert.equal(fixture.writes.at(-1).update.$unset["notifications.slack.pendingUntil"], 1);
});
test("failed delivery preserves the cursor and batch boundary for retry", async () => {
  const fixture = workerFixture({ feedback: [{ _id: "response" }], failure: true });
  await processDigest("project", "slack", fixture.dependencies);
  assert.ok(fixture.writes[0].update.$set["notifications.slack.pendingUntil"]);
  const last = fixture.writes.at(-1).update;
  assert.equal(last.$set["notifications.slack.since"], undefined);
  assert.equal(last.$unset["notifications.slack.pendingUntil"], undefined);
  assert.match(last.$set["notifications.slack.error"], /Slack delivery failed/);
});
test("an active lease or changed settings prevent delivery", async () => {
  const locked = workerFixture({ claimed: false });
  await processDigest("project", "slack", locked.dependencies);
  assert.equal(locked.writes.length, 0);
  const changed = workerFixture({ feedback: [{ _id: "response" }], current: false });
  await processDigest("project", "slack", changed.dependencies);
  assert.equal(changed.deliveries.length, 0);
});

test("new feedback regenerates a summary but unchanged content is not sent again", async () => {
  const fixture = workerFixture({ feedback: [{ _id: "new-response" }], lastSummaryHash: summaryHash(summary) });
  let generated = 0;
  fixture.dependencies.summarizeFeedback = async () => { generated++; return summary; };
  await processDigest("project", "slack", fixture.dependencies);
  assert.equal(generated, 1);
  assert.equal(fixture.deliveries.length, 0);
  assert.ok(fixture.writes.at(-1).update.$set["notifications.slack.since"]);
  assert.equal(fixture.writes.at(-1).update.$set["notifications.slack.lastSentAt"], undefined);
});
test("retrying a batch uses its freshly generated frozen summary", async () => {
  const fixture = workerFixture({ feedback: [{ _id: "response" }], pendingUntil: new Date("2026-11-02"), pendingSummary: summary });
  fixture.dependencies.summarizeFeedback = () => assert.fail("must preserve the original retry content");
  await processDigest("project", "slack", fixture.dependencies);
  assert.deepEqual(fixture.deliveries[0].summary, summary);
});
test("summary comparisons ignore timestamps, whitespace, case and feature order", () => {
  assert.equal(summaryHash({ tldr: "Good docs", features: ["Fix form", "Add export"], timestamp: "old" }), summaryHash({ tldr: " GOOD   docs ", features: ["add export", "fix form"], timestamp: "new" }));
});

test("channel-capable Slack delivery posts structured blocks to the selected channel", async () => {
  await deliverDigest({ project: { ...project, slackBotTokenEncrypted: encrypt("test-bot-token"), slackChannelId: "C123456" }, channel: "slack", count: 2, summary, batchId: "batch" }, async (url, options) => {
    assert.equal(url, "https://slack.com/api/chat.postMessage");
    assert.equal(options.headers.Authorization, "Bearer test-bot-token");
    const body = JSON.parse(options.body);
    assert.equal(body.channel, "C123456");
    assert.equal(body.blocks[0].type, "header");
    assert.equal(body.parse, "none");
    return { ok: true, json: async () => ({ ok: true }) };
  });
});
test("transient email rejection retries with the same idempotency key", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.DIGEST_EMAIL_FROM = "Unified <feedback@example.com>";
  const keys = [];
  try {
    await deliverDigest({ project, channel: "email", summary, count: 1, recipient: "owner@example.com", batchId: "retry-batch" }, async (_url, options) => {
      keys.push(options.headers["Idempotency-Key"]);
      return { ok: keys.length > 1, status: 429 };
    });
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  } finally { delete process.env.RESEND_API_KEY; delete process.env.DIGEST_EMAIL_FROM; }
});
