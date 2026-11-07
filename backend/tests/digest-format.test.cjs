const test = require("node:test");
const assert = require("node:assert/strict");
const { digestHtml, slackDigest } = require("../services/digest-format");
const input = { project: { _id: "project", name: 'App <script>alert("name")</script>' }, count: 4, summary: { tldr: '<img src=x onerror="bad"> & overview', features: ["Fix **export**", "Improve setup <unsafe>"] } };
test("HTML digests escape feedback, preserve actions and link to responses and preferences", () => {
  const html = digestHtml(input);
  assert.doesNotMatch(html, /<script>|<img src=x|<unsafe>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /4 new responses/);
  assert.match(html, /Fix export/);
  assert.match(html, /Improve setup &lt;unsafe&gt;/);
  assert.match(html, /project\/project\/feedbacks/);
  assert.match(html, /integrations\?project=project/);
  assert.match(html, /background:#f5f4ef/);
  assert.match(html, /max-width:600px/);
});
test("Slack digests structure headers and actions while keeping all user content plain", () => {
  const payload = slackDigest(input);
  assert.equal(payload.blocks[0].type, "header");
  assert.equal(payload.blocks[0].text.type, "plain_text");
  assert.match(payload.blocks[1].elements[0].text, /4 new responses/);
  const actions = payload.blocks.filter((block) => block.type === "section" && block.text.type === "plain_text");
  assert.equal(actions.length, 3);
  assert.match(actions[1].text.text, /01   Fix export/);
  assert.equal(payload.blocks.at(-1).elements[0].text.text, "View responses");
  assert.ok(payload.blocks.length < 50);
});
