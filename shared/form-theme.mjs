import presets from "./form-themes.json" with { type: "json" };
export const formPresets = presets;
export const colorTokens = [
  "accent",
  "background",
  "surface",
  "text",
  "muted",
  "border",
];
export const isHexColor = (value) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

function luminance(hex) {
  const values = hex
    .slice(1)
    .match(/../g)
    .map((part) => parseInt(part, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
export function contrastRatio(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
export function resolveFormTheme(appearance, mode = "light") {
  const preset =
    presets.find((item) => item.id === appearance?.preset) || presets[0];
  const palette = { ...preset[mode === "dark" ? "dark" : "light"] };
  for (const key of colorTokens) {
    const value = appearance?.colors?.[mode]?.[key];
    if (isHexColor(value)) palette[key] = value;
  }
  palette.accentText =
    contrastRatio(palette.accent, "#ffffff") >=
    contrastRatio(palette.accent, "#171717")
      ? "#ffffff"
      : "#171717";
  return palette;
}
export function formThemeStyle(appearance, mode) {
  const palette = resolveFormTheme(appearance, mode);
  return Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [`--uf-${key}`, value]),
  );
}
export function previewThemeStyle(appearance, mode) {
  const palette = resolveFormTheme(appearance, mode);
  return {
    ...formThemeStyle(appearance, mode),
    "--background": palette.background,
    "--card": palette.surface,
    "--foreground": palette.text,
    "--muted-foreground": palette.muted,
    "--muted": palette.border,
    "--border": palette.border,
    "--input": palette.border,
    "--primary": palette.accent,
    "--primary-foreground": palette.accentText,
    "--ring": palette.accent,
  };
}
