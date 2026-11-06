const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAppearance } = require("../services/project-appearance");
test("paired custom colors survive validation without arbitrary properties", () => {
  const value = validateAppearance({ preset: "ocean", colors: { light: { accent: "#12ABCD", background: "#ffffff", unknown: "bad" }, dark: { accent: "#55aabb" } } });
  assert.deepEqual(value.colors, { light: { accent: "#12abcd", background: "#ffffff" }, dark: { accent: "#55aabb" } });
  assert.equal(value.preset, "ocean");
});
test("invalid presets and CSS values cannot enter a project appearance", () => {
  assert.equal(validateAppearance(undefined), undefined);
  for (const value of [null, { preset: "missing" }, { preset: "unified", colors: { light: { accent: "url(unsafe)" } } }, { preset: "unified", colors: { light: [] } }]) assert.throws(() => validateAppearance(value));
});
