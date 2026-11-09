import test from "node:test";
import assert from "node:assert/strict";
import { pipelineStates, pipelineLayout } from "../src/lib/fix-pipeline.js";
test("pipeline failures attach to the actual failed step and keep later steps waiting", () => {
  const states = pipelineStates({ status: "failed", failedStage: "pr", message: "GitHub denied branch creation.", assessment: { reason: "Small copy change" } });
  assert.equal(states[0].state, "complete"); assert.equal(states[2].state, "failed");
  assert.match(states[2].detail, /denied/); assert.equal(states[3].state, "waiting");
  assert.equal(pipelineStates({ status: "not_suitable", message: "Needs backend work" })[0].state, "failed");
});
test("shipping and notification completion are separate stages", () => {
  let states = pipelineStates({ status: "merged", message: "Release the fix first" });
  assert.equal(states[3].state, "complete"); assert.equal(states[4].state, "active"); assert.equal(states[5].state, "waiting");
  states = pipelineStates({ status: "shipped", notification: { status: "failed", message: "Some emails were rejected" } });
  assert.equal(states[4].state, "complete"); assert.equal(states[5].state, "failed"); assert.match(states[5].detail, /rejected/);
  assert.equal(pipelineStates({ status: "shipped", notification: { status: "disabled" } })[5].state, "skipped");
});
test("responsive pipeline paths keep six distinct nodes connected in process order", () => {
  for (const columns of [1, 2, 3]) {
    const layout = pipelineLayout(columns);
    assert.equal(new Set(layout.map(item => `${item.position.x}:${item.position.y}`)).size, 6);
    assert.equal(layout[0].input, null); assert.equal(layout.at(-1).output, null);
    assert.ok(layout.slice(0, -1).every(item => item.output)); assert.ok(layout.slice(1).every(item => item.input));
  }
});
