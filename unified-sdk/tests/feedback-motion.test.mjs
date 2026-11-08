import test from "node:test";
import assert from "node:assert/strict";
import { morphTransitions, contentEase } from "../src/components/feedback-motion.mjs";

test("opening keeps the beUI morph while closing settles without a reversed overshoot", () => {
  const opening = morphTransitions(true, false);
  const closing = morphTransitions(false, false);
  assert.deepEqual(opening.surface.layout, { duration: 0.4, ease: [0.34, 1.25, 0.64, 1] });
  assert.deepEqual(opening.content.x, { duration: 0.4, ease: contentEase });
  assert.deepEqual(closing.surface.layout, { duration: 0.28, ease: contentEase });
  assert.equal(closing.surface.backgroundColor, undefined);
  assert.deepEqual(closing.paint, closing.trigger.opacity);
  assert.ok(closing.paint.delay + closing.paint.duration < closing.surface.layout.duration);
  assert.equal(closing.content.opacity.duration, 0.12);
  assert.equal(closing.content.opacity.delay, undefined);
  assert.equal(closing.trigger.opacity.delay, 0.08);
  assert.deepEqual(Object.keys(closing.trigger), ["opacity"]);
});

test("reduced motion keeps only fades", () => {
  const { surface, content, trigger } = morphTransitions(false, true);
  assert.equal(surface.duration, 0);
  assert.deepEqual(Object.keys(content), ["opacity"]);
  assert.deepEqual(Object.keys(trigger), ["opacity"]);
});
