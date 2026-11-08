const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAppearance } = require("../services/project-appearance");
test("paired custom colors survive validation without arbitrary properties", () => {
  const value = validateAppearance({
    preset: "ocean",
    colors: {
      light: { accent: "#12ABCD", background: "#ffffff", unknown: "bad" },
      dark: { accent: "#55aabb" },
    },
  });
  assert.deepEqual(value.colors, {
    light: { accent: "#12abcd", background: "#ffffff" },
    dark: { accent: "#55aabb" },
  });
  assert.equal(value.preset, "ocean");
});
test("invalid presets and CSS values cannot enter a project appearance", () => {
  assert.equal(validateAppearance(undefined), undefined);
  for (const value of [
    null,
    { preset: "missing" },
    { preset: "unified", colors: { light: { accent: "url(unsafe)" } } },
    { preset: "unified", colors: { light: [] } },
  ])
    assert.throws(() => validateAppearance(value));
});

test("project documents retain both palettes and reject invalid stored colors", () => {
  const Project = require("../models/Project");
  const project = new Project({
    name: "Demo",
    userId: "507f1f77bcf86cd799439011",
    fields: [{ type: "text", label: "Feedback" }],
    appearance: {
      preset: "iris",
      colors: { light: { accent: "#7650bc" }, dark: { background: "#171717" } },
    },
  });
  assert.equal(project.validateSync(), undefined);
  const stored = project.toObject().appearance;
  assert.equal(stored.colors.light.accent, "#7650bc");
  assert.equal(stored.colors.dark.background, "#171717");
  project.appearance.colors.light.accent = "invalid";
  assert.ok(project.validateSync());
});

test("form fonts are validated and saved with the project", () => {
  const Project = require("../models/Project");
  const appearance = validateAppearance({
    preset: "unified",
    font: "DM Sans",
    colors: {},
  });
  const project = new Project({
    name: "Font test",
    userId: "507f1f77bcf86cd799439011",
    fields: [{ type: "text", label: "Feedback" }],
    appearance,
  });
  assert.equal(project.validateSync(), undefined);
  assert.equal(project.toObject().appearance.font, "DM Sans");
  assert.throws(() =>
    validateAppearance({ preset: "unified", font: "url(unsafe)" }),
  );
  project.appearance.font = "unknown";
  assert.ok(project.validateSync());
});

test("launcher choices and paired colors survive validation and Mongo serialization", () => {
  const Project = require("../models/Project");
  const appearance = validateAppearance({
    preset: "unified",
    launcher: { style: "rounded", icon: "mail", label: " Talk to us ", position: "bottom-left",
      colors: { light: { background: "#12ABCD", text: "#171717" }, dark: { background: "#171717", text: "#FFFFFF" } },
      unknown: "ignored",
    },
  });
  assert.equal(appearance.launcher.label, "Talk to us");
  assert.equal(appearance.launcher.colors.light.background, "#12abcd");
  assert.equal(appearance.launcher.unknown, undefined);
  const project = new Project({ name: "Launcher", userId: "507f1f77bcf86cd799439011", fields: [{ type: "text", label: "Feedback" }], appearance });
  assert.equal(project.validateSync(), undefined);
  assert.deepEqual(project.toObject().appearance.launcher, appearance.launcher);
  project.appearance.launcher.icon = "missing";
  assert.ok(project.validateSync());
});

test("invalid launcher configuration is rejected", () => {
  for (const launcher of [null, [], { style: "unknown" }, { icon: "missing" }, { label: " " }, { label: "a".repeat(33) },
    { position: "top" }, { style: "icon", icon: "none" }, { colors: [] }, { colors: { light: [] } },
    { colors: { dark: { background: "red" } } }, { colors: { light: { text: "url(unsafe)" } } }]) {
    assert.throws(() => validateAppearance({ preset: "unified", launcher }));
  }
});
