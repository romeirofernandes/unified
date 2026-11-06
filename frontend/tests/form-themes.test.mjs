import test from "node:test";
import assert from "node:assert/strict";
import {
  contrastRatio,
  formPresets,
  resolveFormTheme,
} from "../../shared/form-theme.mjs";
test("each preset has readable light and dark palettes", () => {
  for (const preset of formPresets)
    for (const mode of ["light", "dark"]) {
      const colors = resolveFormTheme({ preset: preset.id }, mode);
      assert.ok(contrastRatio(colors.text, colors.background) >= 4.5);
      assert.ok(contrastRatio(colors.accent, colors.accentText) >= 4.5);
    }
});
test("custom colors are isolated by mode and invalid colors fall back safely", () => {
  const appearance = {
    preset: "forest",
    colors: { light: { accent: "#ffffff", text: "invalid" } },
  };
  const light = resolveFormTheme(appearance, "light");
  assert.equal(light.accent, "#ffffff");
  assert.equal(
    light.text,
    formPresets.find((item) => item.id === "forest").light.text,
  );
  assert.equal(light.accentText, "#171717");
  assert.notEqual(resolveFormTheme(appearance, "dark").accent, "#ffffff");
});
