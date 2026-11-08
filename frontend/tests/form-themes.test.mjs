import test from "node:test";
import assert from "node:assert/strict";
import {
  contrastRatio,
  formThemeStyle,
  previewThemeStyle,
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

test("saved fonts apply consistently to the SDK and previews with a safe fallback", () => {
  for (const font of ["Inter", "DM Sans", "Manrope", "Lora", "Space Grotesk"]) {
    const appearance = { preset: "unified", font };
    assert.equal(formThemeStyle(appearance, "dark").fontFamily, `"${font}", sans-serif`);
    assert.equal(previewThemeStyle(appearance, "light").fontFamily, formThemeStyle(appearance, "light").fontFamily);
  }
  assert.equal(formThemeStyle({ font: "unknown" }, "light").fontFamily, '"Inter", sans-serif');
});

test("launcher colors are independent of form colors and isolated by mode", () => {
  const appearance = { preset: "unified", launcher: { colors: { light: { background: "#112233", text: "#ffffff" }, dark: { background: "#aabbcc", text: "#171717" } } } };
  const light = formThemeStyle(appearance, "light");
  const dark = previewThemeStyle(appearance, "dark");
  assert.equal(light["--uf-launcher-bg"], "#112233");
  assert.equal(dark["--uf-launcher-bg"], "#aabbcc");
  assert.equal(light["--uf-launcher-text"], "#ffffff");
  assert.equal(dark["--uf-launcher-text"], "#171717");
  assert.notEqual(light["--uf-background"], "#112233");
  assert.equal(formThemeStyle({ preset: "unified", launcher: { colors: { light: { background: "invalid" } } } }, "light")["--uf-launcher-bg"], light["--uf-accent"]);
});
