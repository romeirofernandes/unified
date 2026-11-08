import { useTheme } from "next-themes";
import { useWorkspaceBackground } from "@/hooks/use-workspace-background";
import { backgroundOptions } from "@/lib/workspace-background";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [background, setBackground] = useWorkspaceBackground();
  return (
    <div className="space-y-6">
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Workspace theme</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map(({ value, label }) => (
          <label key={value} className="group relative cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="workspace-theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
            />
            <span className="block overflow-hidden rounded-lg border border-border p-2 transition-colors peer-checked:border-fluid-accent peer-checked:ring-1 peer-checked:ring-fluid-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              <span
                aria-hidden="true"
                className={`flex h-12 overflow-hidden rounded border border-black/10 ${value === "light" ? "bg-[#f4f3ee]" : value === "dark" ? "bg-[#141414]" : "bg-linear-to-r from-[#f4f3ee] from-50% to-[#141414] to-50%"}`}
              >
                <span
                  className={`w-1/4 border-e border-black/10 ${value === "dark" ? "bg-white/5" : "bg-black/5"}`}
                />
                <span className="flex-1 space-y-2 p-3">
                  <span
                    className={`block h-1.5 w-2/3 rounded ${value === "dark" ? "bg-white/35" : "bg-black/25"}`}
                  />
                  <span className="block h-3 rounded bg-fluid-accent/20" />
                </span>
              </span>
              <span className="flex items-center justify-between px-1 pb-0 pt-2 text-sm">
                <span>{label}</span>
                <span
                  aria-hidden="true"
                  className={`size-3 rounded-full border ${theme === value ? "border-fluid-accent bg-fluid-accent" : "border-border"}`}
                />
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        System follows your device’s appearance. Press{" "}
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">
          D
        </kbd>{" "}
        to switch between light and dark when you’re not typing.
      </p>
    </fieldset>
    <fieldset className="space-y-3" aria-describedby="workspace-background-help">
      <legend className="text-sm font-medium">Workspace background</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {backgroundOptions.map(({ value, label, description }) => (
          <label key={value} className="relative cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="workspace-background"
              value={value}
              checked={background === value}
              onChange={() => setBackground(value)}
            />
            <span className="block h-full rounded-lg border border-border p-2 transition-colors peer-checked:border-fluid-accent peer-checked:ring-1 peer-checked:ring-fluid-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              <span aria-hidden="true" className="relative flex h-16 items-center justify-center overflow-hidden rounded border border-border bg-background">
                {value === "cursor" && (
                  <span className="flex -rotate-12 items-center gap-1 text-fluid-accent">
                    <span className="size-2 bg-current opacity-20" />
                    <span className="size-2 bg-current opacity-40" />
                    <span className="size-3 bg-current opacity-60" />
                    <span className="size-3 bg-current" />
                    <span className="size-2 bg-current opacity-60" />
                  </span>
                )}
                {value === "glyph" && (
                  <span className="whitespace-pre text-center font-mono text-[11px] leading-4 tracking-[0.2em] text-fluid-accent/70">{"a 7 x 2 k\n 0 m 4 z\np 3 b 8 n"}</span>
                )}
              </span>
              <span className="flex items-center justify-between gap-2 px-1 pt-2 text-sm">
                <span>{label}</span>
                <span aria-hidden="true" className={`size-3 shrink-0 rounded-full border ${background === value ? "border-fluid-accent bg-fluid-accent" : "border-border"}`} />
              </span>
              <span className="block px-1 pb-1 pt-1 text-xs leading-5 text-muted-foreground">{description}</span>
            </span>
          </label>
        ))}
      </div>
      <p id="workspace-background-help" className="text-xs leading-5 text-muted-foreground">
        Applies immediately and saves on this device. Background animation follows your reduced-motion preference.
      </p>
    </fieldset>
    </div>
  );
}
