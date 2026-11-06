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
  return {
    preset: value.preset,
    colors,
    ...(value.font ? { font: value.font } : {}),
  };
}
module.exports = { validateAppearance };
