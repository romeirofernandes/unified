import test from "node:test";
import assert from "node:assert/strict";
import { parseSummary, readSummary } from "../src/lib/feedback-summary.js";

test("summary parsing supports bullets and preserves the overview", () => {
  const result = parseSummary(
    "TLDR:\nCustomers want search.\n\nKEY FEATURES TO IMPROVE/ADD:\n• Search - Find feedback\n- Filters - Narrow results\n* Export - Share results",
  );
  assert.equal(result.tldr, "Customers want search.");
  assert.deepEqual(result.features, [
    "Search - Find feedback",
    "Filters - Narrow results",
    "Export - Share results",
  ]);
  assert.ok(Number.isFinite(Date.parse(result.timestamp)));
});

test("malformed provider responses fail with an actionable error", () => {
  for (const value of [undefined, "", "No headings", "TLDR:\nOverview only"]) {
    assert.throws(() => parseSummary(value), /summary response/);
  }
});

test("blocked, corrupted, and incompatible browser storage never crash the page", () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("Blocked");
      },
    };
    assert.equal(readSummary("test"), null);
    for (const value of [
      "{",
      "null",
      '{"tldr":"ok","features":[5]}',
      '{"tldr":5,"features":[]}',
    ]) {
      globalThis.localStorage = { getItem: () => value };
      assert.equal(readSummary("test"), null);
    }
    const saved = {
      tldr: "Works",
      features: ["Search"],
      timestamp: new Date().toISOString(),
    };
    globalThis.localStorage = { getItem: () => JSON.stringify(saved) };
    assert.deepEqual(readSummary("test"), saved);
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});
