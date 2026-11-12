const test = require("node:test");
const assert = require("node:assert/strict");
const { batches, summarizeFeedback } = require("../services/feedback-summary");

test("large and oversized feedback records are split without losing text", () => {
  const answer = "x".repeat(90000);
  const result = batches([{ id: "long", answer }]);
  assert.ok(result.length > 1);
  assert.ok(result.every((batch) => batch.length <= 24000));
  assert.equal(result.join("").split("x").length - 1, answer.length);
});

test("large feedback sets are summarized in batches and merged with bounded concurrency", async () => {
  const originalFetch = global.fetch;
  const originalKeys = process.env.GROQ_API_KEYS;
  const inputs = [];
  let inFlight = 0;
  let peak = 0;
  process.env.GROQ_API_KEYS = "key-a,key-b,key-c";
  global.fetch = async (_, options) => {
    const request = JSON.parse(options.body);
    inputs.push(request);
    peak = Math.max(peak, ++inFlight);
    await new Promise((resolve) => setImmediate(resolve));
    inFlight--;
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ tldr: "Users report a search fault.", features: ["Fix the search fault."], evidence: [] }) } }] }) };
  };
  try {
    const result = await summarizeFeedback({ fields: [{ _id: "question", label: "Problem", type: "textarea" }] }, Array.from({ length: 400 }, (_, index) => ({ _id: index, formAnswers: { question: "x".repeat(1000) } })));
    assert.ok(inputs.length > 10);
    assert.ok(inputs.every((request) => request.messages[1].content.length < 25000));
    assert.ok(inputs.at(-1).messages[0].content.startsWith("Combine"));
    assert.ok(peak <= 3);
    assert.equal(result.features[0], "Fix the search fault.");
  } finally {
    global.fetch = originalFetch;
    if (originalKeys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = originalKeys;
  }
});

test("summary evidence carries original IDs through merges and rejects invented IDs", async () => {
  const originalFetch = global.fetch;
  const originalKeys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEYS = "test-key";
  let merged = false;
  global.fetch = async (_, options) => {
    const request = JSON.parse(options.body);
    const merging = request.messages[0].content.startsWith("Combine");
    let responseIds;
    if (merging) {
      merged = true;
      assert.ok(request.messages[1].content.includes('"support"'));
      responseIds = ["first", "second", "first", "invented"];
    } else {
      responseIds = request.messages[1].content.split("\n").map(line => JSON.parse(line).id);
    }
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ tldr: "Search fails.", features: ["Fix search"], evidence: [{ title: "Fix search", issueId: null, support: responseIds.map(responseId => ({responseId, quote: "xxxxxxxx"})) }, { title: "Unrelated", issueId: null, support: [{responseId:"invented",quote:"xxxxxxxx"}] }] }) } }] }) };
  };
  try {
    const result = await summarizeFeedback({ fields: [{ _id: "q", type: "text", label: "Problem" }] }, ["first", "second"].map(_id => ({ _id, formAnswers: { q: "x".repeat(15000) } })));
    assert.equal(merged, true);
    assert.deepEqual(result.evidence, [{ title: "Fix search", issueId: null, responseIds: ["first", "second"] }]);
  } finally {
    global.fetch = originalFetch;
    if (originalKeys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = originalKeys;
  }
});
