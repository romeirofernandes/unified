import test from "node:test";
import assert from "node:assert/strict";
import { morphTransitions, reverseEase, surfaceEase, contentEase, morphDuration } from "../src/components/feedback-motion.mjs";

test("opening matches beUI and closing reflects every track on the same timeline", () => {
  const opening = morphTransitions(true, false);
  const closing = morphTransitions(false, false);
  assert.equal(morphDuration, 0.4);
  assert.deepEqual(opening.surface.layout, { duration: 0.4, ease: [0.34, 1.25, 0.64, 1] });
  assert.deepEqual(opening.content.x, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
  for (const key of ["layout", "borderRadius"]) {
    assert.equal(closing.surface[key].duration, opening.surface[key].duration);
    assert.deepEqual(closing.surface[key].ease, reverseEase(surfaceEase));
  }
  for (const key of ["x", "scale", "rotate", "opacity", "filter"]) {
    assert.equal(closing.content[key].duration, opening.content[key].duration);
    assert.deepEqual(closing.content[key].ease, reverseEase(contentEase));
    assert.ok(Math.abs((closing.content[key].delay || 0) - (0.4 - opening.content[key].duration)) < 1e-9);
  }
});

test("reduced motion keeps only a fade", () => {
  const { surface, content } = morphTransitions(true, true);
  assert.equal(surface.duration, 0);
  assert.deepEqual(Object.keys(content), ["opacity"]);
  assert.deepEqual(morphTransitions(false, true), morphTransitions(true, true));
});
