const presets = require("../../shared/form-themes.json");
const tokens = ["accent", "background", "surface", "text", "muted", "border"];
function validateAppearance(value) {
  if (value === undefined) return undefined;
  const fail = () => {
    const error = new Error(
      "Choose a valid theme preset and six-digit hex colors.",
    );
    error.status = 400;
    throw error;
  };
  if (!value || !presets.some((preset) => preset.id === value.preset)) fail();
  if (
    value.font !== undefined &&
    !require("../../shared/form-fonts.json").includes(value.font)
  )
    fail();
  const colors = {};
  for (const mode of ["light", "dark"]) {
    if (value.colors?.[mode] !== undefined) {
      if (
        !value.colors[mode] ||
        typeof value.colors[mode] !== "object" ||
        Array.isArray(value.colors[mode])
      )
        fail();
      colors[mode] = {};
      for (const token of tokens) {
        const color = value.colors[mode][token];
        if (color !== undefined) {
          if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color))
            fail();
          colors[mode][token] = color.toLowerCase();
        }
      }
    }
  }
  let launcher;
  if (value.launcher !== undefined) {
    const input = value.launcher;
    if (!input || typeof input !== "object" || Array.isArray(input)) fail();
    launcher = {};
    const choices = require("../../shared/feedback-launcher.json");
    for (const [key, allowed] of [["style", choices.styles], ["icon", choices.icons], ["position", choices.positions]]) {
      if (input[key] !== undefined) {
        if (!allowed.includes(input[key])) fail();
        launcher[key] = input[key];
      }
    }
    if (input.label !== undefined) {
      if (typeof input.label !== "string" || !input.label.trim() || input.label.trim().length > 32) fail();
      launcher.label = input.label.trim();
    }
    if (input.style === "icon" && input.icon === "none") fail();
    if (input.colors !== undefined) {
      if (!input.colors || typeof input.colors !== "object" || Array.isArray(input.colors)) fail();
      launcher.colors = {};
      for (const mode of ["light", "dark"]) {
        if (input.colors[mode] === undefined) continue;
        const palette = input.colors[mode];
        if (!palette || typeof palette !== "object" || Array.isArray(palette)) fail();
        launcher.colors[mode] = {};
        for (const token of ["background", "text"]) {
          if (palette[token] === undefined) continue;
          if (typeof palette[token] !== "string" || !/^#[0-9a-f]{6}$/i.test(palette[token])) fail();
          launcher.colors[mode][token] = palette[token].toLowerCase();
        }
      }
    }
  }
  return {
    ...(launcher ? { launcher } : {}),
    preset: value.preset,
    colors,
    ...(value.font ? { font: value.font } : {}),
  };
}
module.exports = { validateAppearance };
