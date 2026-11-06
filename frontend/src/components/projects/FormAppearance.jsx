import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerHexInput,
  ColorPickerEyeDropper,
} from "@/components/motion/color-picker";
import {
  colorTokens,
  contrastRatio,
  formPresets,
  resolveFormTheme,
} from "../../../../shared/form-theme.mjs";

const tokenLabels = {
  accent: "Accent",
  background: "Background",
  surface: "Inputs",
  text: "Text",
  muted: "Secondary text",
  border: "Borders",
};
export default function FormAppearance({
  appearance,
  onChange,
  mode,
  onModeChange,
}) {
  const [customize, setCustomize] = useState(false);
  const [token, setToken] = useState("accent");
  const palette = resolveFormTheme(appearance, mode);
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Default mode</legend>
        <div className="grid grid-cols-2 gap-3">
          {["light", "dark"].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="appearance-mode"
                checked={mode === value}
                onChange={() => onModeChange(value)}
                className="peer sr-only"
              />
              <span className="flex h-10 items-center justify-center rounded-md border border-border text-sm capitalize peer-checked:border-fluid-accent peer-checked:bg-fluid-accent/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                {value}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Each preset has both modes. Custom colors are saved separately for
          each.
        </p>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Theme preset</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {formPresets.map((preset) => (
            <label key={preset.id} className="cursor-pointer">
              <input
                type="radio"
                name="form-preset"
                checked={appearance.preset === preset.id}
                onChange={() => onChange({ preset: preset.id, colors: {} })}
                className="peer sr-only"
              />
              <span className="block rounded-md border border-border p-3 peer-checked:border-fluid-accent peer-checked:ring-1 peer-checked:ring-fluid-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                <span
                  aria-hidden="true"
                  className="mb-3 flex overflow-hidden rounded border border-black/10"
                >
                  {["light", "dark"].map((theme) => (
                    <span
                      key={theme}
                      className="flex h-10 flex-1 items-center justify-center"
                      style={{ background: preset[theme].background }}
                    >
                      <span
                        className="h-2 w-7 rounded-sm"
                        style={{ background: preset[theme].accent }}
                      />
                    </span>
                  ))}
                </span>
                <span className="text-sm">{preset.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Your colors</h3>
          <Button
            variant="secondary"
            onClick={() => setCustomize((value) => !value)}
          >
            {customize ? "Hide controls" : "Customize colors"}
          </Button>
        </div>
        {customize && (
          <>
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Color to edit"
            >
              {colorTokens.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={key === token}
                  onClick={() => setToken(key)}
                  className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring ${key === token ? "border-fluid-accent bg-fluid-accent/10" : "border-border"}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 rounded-sm border border-border"
                    style={{ background: palette[key] }}
                  />
                  {tokenLabels[key]}
                </button>
              ))}
            </div>
            <ColorPicker
              key={`${mode}-${token}`}
              value={palette[token]}
              onValueChange={(value) =>
                onChange({
                  ...appearance,
                  colors: {
                    ...appearance.colors,
                    [mode]: { ...appearance.colors?.[mode], [token]: value },
                  },
                })
              }
              alpha={false}
              aria-label={`${tokenLabels[token]} color for ${mode} mode`}
              className="space-y-3 rounded-md border border-border bg-background p-3"
            >
              <p className="text-xs text-muted-foreground">
                {tokenLabels[token]} · {mode} mode
              </p>
              <ColorPickerArea className="h-36 rounded-md" />
              <ColorPickerHue />
              <div className="flex items-center gap-3">
                <ColorPickerEyeDropper />
                <ColorPickerHexInput className="min-w-0 flex-1" />
              </div>
            </ColorPicker>
            {contrastRatio(palette.text, palette.background) < 4.5 && (
              <p role="status" className="text-xs text-destructive">
                The text and background have low contrast. Use a lighter or
                darker text color.
              </p>
            )}
            <Button
              variant="ghost"
              onClick={() =>
                onChange({
                  ...appearance,
                  colors: { ...appearance.colors, [mode]: {} },
                })
              }
            >
              Reset {mode} colors
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
