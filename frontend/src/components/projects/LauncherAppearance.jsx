import FeedbackLauncher from "../../../../shared/FeedbackLauncher";
import { formThemeStyle, resolveFormTheme } from "../../../../shared/form-theme.mjs";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function LauncherAppearance({ appearance, onChange, mode }) {
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
      <div className="grid grid-cols-2 gap-3">
        {[["background", "Background", palette.accent], ["text", "Text & icon", palette.accentText]].map(([key, label, fallback]) => <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-xs">
          <input type="color" aria-label={`Button ${label.toLowerCase()} color`} value={launcher.colors?.[mode]?.[key] || fallback} onChange={event => color(key, event.target.value)} className="size-7 cursor-pointer border-0 bg-transparent p-0" />
          <span>{label}<span className="mt-1 block font-mono text-[10px] text-muted-foreground">{launcher.colors?.[mode]?.[key] || fallback}</span></span>
        </label>)}
      </div>
      <Button variant="ghost" size="sm" onClick={() => update({ colors: { ...launcher.colors, [mode]: {} } })}>Use theme colors</Button>
    </div>
  </fieldset>;
}
