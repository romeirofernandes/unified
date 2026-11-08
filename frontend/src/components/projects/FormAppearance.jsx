import LauncherAppearance from "./LauncherAppearance";
import fonts from "../../../../shared/form-fonts.json";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AppearanceColorPicker from "./AppearanceColorPicker";
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
export default function FormAppearance({ appearance, onChange, mode }) {
  const [customize, setCustomize] = useState(false);
  const [token, setToken] = useState("accent");
  const palette = resolveFormTheme(appearance, mode);
  return (
    <div className="space-y-6">
      <p className="text-xs leading-5 text-muted-foreground">
        Each preset has light and dark colors. Switch modes beside the live
        preview. You are editing {mode} mode.
      </p>
      <div className="space-y-2">
        <label id="form-font-label" className="text-sm font-medium">
          Font
        </label>
        <Select
          value={appearance.font || "Inter"}
          onValueChange={(font) => onChange({ ...appearance, font })}
        >
          <SelectTrigger aria-labelledby="form-font-label" className="w-full" />
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="space-y-5">
        <legend className="text-sm font-medium">Theme preset</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {formPresets.map((preset) => (
            <label key={preset.id} className="cursor-pointer">
              <input
                type="radio"
                name="form-preset"
                checked={appearance.preset === preset.id}
                onChange={() =>
                  onChange({ ...appearance, preset: preset.id, colors: {} })
                }
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
              <AppearanceColorPicker
                key={`${mode}-${token}`}
                label={tokenLabels[token]}
                mode={mode}
                value={palette[token]}
                onChange={(value) =>
                  onChange({
                    ...appearance,
                    colors: {
                      ...appearance.colors,
                      [mode]: { ...appearance.colors?.[mode], [token]: value },
                    },
                  })
                }
              />
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
        <LauncherAppearance appearance={appearance} onChange={onChange} mode={mode} />
      </fieldset>
    </div>
  );
}
