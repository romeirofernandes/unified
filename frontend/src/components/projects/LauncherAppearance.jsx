import { useState } from "react";
import AppearanceColorPicker from "./AppearanceColorPicker";
import FeedbackLauncher from "../../../../shared/FeedbackLauncher";
import { formThemeStyle, resolveFormTheme } from "../../../../shared/form-theme.mjs";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function LauncherAppearance({ appearance, onChange, mode }) {
  const [colorToken, setColorToken] = useState("background");
  const launcher = appearance.launcher || {};
  const palette = resolveFormTheme(appearance, mode);
  function update(patch) { onChange({ ...appearance, launcher: { ...launcher, ...patch } }); }
  function color(key, value) {
    update({ colors: { ...launcher.colors, [mode]: { ...launcher.colors?.[mode], [key]: value } } });
  }
  const style = launcher.style || "pill";
  return <fieldset className="space-y-5 border-t border-border pt-6">
    <legend className="float-left mb-1 text-sm font-medium">Feedback button</legend>
    <p className="clear-both text-xs leading-5 text-muted-foreground">The button visitors use to open your form. Changes appear on your site after saving.</p>
    <div style={formThemeStyle(appearance, mode)} className="flex min-h-28 items-center justify-center rounded-xl border border-border bg-[var(--uf-surface)] p-6">
      <span className="inline-flex h-12 items-center justify-center gap-2.5 px-5 text-sm font-medium shadow-sm" style={{ background: "var(--uf-launcher-bg)", color: "var(--uf-launcher-text)", borderRadius: style === "pill" || style === "icon" ? 99 : 12, paddingInline: style === "icon" ? 14 : 20 }}>
        <FeedbackLauncher launcher={launcher} />
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[
        ["style", "Style", { pill: "Pill", rounded: "Rounded", icon: "Icon only", text: "Text only", tab: "Tab" }],
        ["icon", "Icon", { chat: "Chat", mail: "Envelope", star: "Star", none: "No icon" }],
        ["position", "Position", { "bottom-right": "Bottom right", "bottom-left": "Bottom left" }],
      ].map(([key, label, options]) => <div key={key} className="space-y-2">
        <label id={`launcher-${key}`} className="text-xs font-medium">{label}</label>
        <Select value={launcher[key] || ({ style: "pill", icon: "chat", position: "bottom-right" })[key]} onValueChange={value => update({ [key]: value, ...(key === "style" && value === "icon" && launcher.icon === "none" ? { icon: "chat" } : {}), ...(key === "icon" && value === "none" && style === "icon" ? { style: "pill" } : {}) })}>
          <SelectTrigger aria-labelledby={`launcher-${key}`} className="w-full" />
          <SelectContent>{Object.entries(options).map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent>
        </Select>
      </div>)}
      <div className="space-y-2">
        <label htmlFor="launcher-label" className="text-xs font-medium">Button label</label>
        <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" id="launcher-label" maxLength={32} value={launcher.label ?? "Feedback"} disabled={style === "icon"} onChange={event => update({ label: event.target.value })} onBlur={() => { if (!launcher.label?.trim()) update({ label: "Feedback" }); }} />
      </div>
    </div>
    <div className="space-y-3">
      <p className="text-xs font-medium">Button colors · {mode}</p>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Button color to edit">
        {[["background", "Background", palette.accent], ["text", "Text & icon", palette.accentText]].map(([key, label, fallback]) => (
          <button
            key={key}
            type="button"
            aria-pressed={colorToken === key}
            onClick={() => setColorToken(key)}
            className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring ${colorToken === key ? "border-fluid-accent bg-fluid-accent/10" : "border-border"}`}
          >
            <span aria-hidden="true" className="size-4 shrink-0 rounded-sm border border-border" style={{ background: launcher.colors?.[mode]?.[key] || fallback }} />
            {label}
          </button>
        ))}
      </div>
      <AppearanceColorPicker
        key={`${mode}-${colorToken}`}
        label={colorToken === "background" ? "Button background" : "Button text & icon"}
        mode={mode}
        value={launcher.colors?.[mode]?.[colorToken] || (colorToken === "background" ? palette.accent : palette.accentText)}
        onChange={value => color(colorToken, value)}
      />
      <Button variant="ghost" size="sm" onClick={() => update({ colors: { ...launcher.colors, [mode]: {} } })}>Use theme colors</Button>
    </div>
  </fieldset>;
}
