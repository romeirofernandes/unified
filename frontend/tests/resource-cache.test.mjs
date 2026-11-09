import { setAccessTokenProvider } from "../src/lib/access-token.js";
setAccessTokenProvider(async () => "signed-test-token");
import test from "node:test";
import assert from "node:assert/strict";
import { cacheResource, readResource, prefetchResource, forgetResource, forgetResourcePrefix } from "../src/lib/resource-cache.js";

test("navigation reuses prefetched responses and isolates them by user", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  try {
    globalThis.fetch = async () => { requests++; return { ok: true, status: 200, json: async () => [{ _id: "response" }] }; };
    const first = await prefetchResource("/feedback/project/cache-project", "cache-user");
    assert.deepEqual(await prefetchResource("/feedback/project/cache-project", "cache-user"), first);
    assert.equal(requests, 1);
    assert.equal(readResource("/feedback/project/cache-project", "other-user"), undefined);
    await prefetchResource("/feedback/project/cache-project", "cache-user", true);
    assert.equal(requests, 2);
  } finally { globalThis.fetch = original; }
});
test("concurrent consumers share a request and old responses cannot overwrite saved data", async () => {
  const original = globalThis.fetch;
  let release;
  try {
    globalThis.fetch = () => new Promise((resolve) => { release = () => resolve({ ok: true, status: 200, json: async () => ({ enabled: false }) }); });
    const first = prefetchResource("/integrations/race", "race-user");
    assert.equal(prefetchResource("/integrations/race", "race-user"), first);
    cacheResource("/integrations/race", "race-user", { enabled: true });
    while (!release) await new Promise(resolve => setImmediate(resolve));
    release();
    assert.deepEqual(await first, { enabled: true });
    assert.deepEqual(readResource("/integrations/race", "race-user").data, { enabled: true });
  } finally { globalThis.fetch = original; }
});
test("project lists warm detail views and explicit invalidation removes them", () => {
  const project = { _id: "warm-project", fields: [{ label: "Feedback" }] };
  cacheResource("/projects", "warm-user", [project]);
  assert.deepEqual(readResource("/projects/warm-project", "warm-user").data, project);
  forgetResource("/projects/warm-project", "warm-user");
  assert.equal(readResource("/projects/warm-project", "warm-user"), undefined);
});
test("reset invalidates cached evidence and fences in-flight reads without affecting another project", async () => {
  const original = globalThis.fetch;
  let release;
  const uid = "reset-cache-user";
  try {
    cacheResource("/workbench/reset-project", uid, [{ _id: "issue" }]);
    cacheResource("/workbench/other-project", uid, [{ _id: "other" }]);
    globalThis.fetch = () => new Promise(resolve => { release = () => resolve({ ok: true, status: 200, json: async () => ({ responses: ["old"] }) }); });
    const reading = prefetchResource("/workbench/reset-project/issue/evidence", uid);
    while (!release) await new Promise(resolve => setImmediate(resolve));
    forgetResourcePrefix("/workbench/reset-project", uid);
    release();
    assert.equal(await reading, null);
    assert.equal(readResource("/workbench/reset-project", uid), undefined);
    assert.equal(readResource("/workbench/reset-project/issue/evidence", uid), undefined);
    assert.equal(readResource("/workbench/other-project", uid).data[0]._id, "other");
  } finally { globalThis.fetch = original; }
});
