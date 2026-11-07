const test = require("node:test");
const assert = require("node:assert/strict");
const { slackApi, listChannels, selectedChannel } = require("../services/slack-client");
test("channel pages exclude archives and inaccessible private channels and keep the cursor", async () => {
  const result = await listChannels("token", "page", async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("cursor"), "page");
    assert.equal(options.headers.Authorization, "Bearer token");
    return { ok: true, json: async () => ({ ok: true, channels: [{ id: "C123456", name: "general" }, { id: "G123456", name: "private", is_private: true, is_member: true }, { id: "G234567", name: "hidden", is_private: true }, { id: "C234567", name: "archived", is_archived: true }], response_metadata: { next_cursor: "more" } }) };
  });
  assert.deepEqual(result.channels.map((item) => item.name), ["general", "private"]);
  assert.equal(result.nextCursor, "more");
});
test("channel selection rejects invalid IDs and unavailable channels", async () => {
  await assert.rejects(selectedChannel("token", "bad"), { status: 400 });
  await assert.rejects(selectedChannel("token", "C123456", async () => ({ ok: true, json: async () => ({ ok: true, channel: { is_archived: true } }) })), { status: 400 });
  const channel = await selectedChannel("token", "C123456", async () => ({ ok: true, json: async () => ({ ok: true, channel: { id: "C123456", name: "feedback", is_private: false } }) }));
  assert.deepEqual(channel, { id: "C123456", name: "#feedback" });
});
test("missing permissions request reconnection without exposing provider details", async () => {
  await assert.rejects(slackApi("token", "conversations.list", {}, async () => ({ ok: true, json: async () => ({ ok: false, error: "missing_scope", needed: "private provider details" }) })), { status: 409, message: "Reconnect Slack to grant channel access." });
});
