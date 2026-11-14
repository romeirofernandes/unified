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
    <div className="flex flex-1 flex-col gap-8">
    <fieldset className="flex min-w-0 flex-1 flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">
        <span className="inline-flex flex-wrap items-center gap-2">
          Workspace theme
          <kbd title="Toggle light and dark theme when not typing" className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-muted-foreground">D</kbd>
        </span>
      </legend>
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        {options.map(({ value, label }) => (
          <label key={value} className="group relative flex min-w-0 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="workspace-theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
            />
            <span className="flex w-full flex-col overflow-hidden rounded-lg border border-border p-2 transition-colors hover:border-fluid-accent hover:ring-1 hover:ring-fluid-accent peer-checked:border-fluid-accent peer-checked:ring-1 peer-checked:ring-fluid-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              <span
                aria-hidden="true"
                className={`flex min-h-20 flex-1 overflow-hidden rounded border border-black/10 ${value === "light" ? "bg-[#f4f3ee]" : value === "dark" ? "bg-[#141414]" : "bg-linear-to-r from-[#f4f3ee] from-50% to-[#141414] to-50%"}`}
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

    </fieldset>
    <fieldset className="flex min-w-0 flex-1 flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">
        <span className="inline-flex flex-wrap items-center gap-2">
          Workspace background
          <kbd title="Cycle backgrounds when not typing" className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-muted-foreground">B</kbd>
        </span>
      </legend>
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        {backgroundOptions.map(({ value, label, description }) => (
          <label key={value} className="relative flex min-w-0 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="workspace-background"
              value={value}
              checked={background === value}
              onChange={() => setBackground(value)}
            />
            <span className="flex w-full flex-col rounded-lg border border-border p-2 transition-colors hover:border-fluid-accent hover:ring-1 hover:ring-fluid-accent peer-checked:border-fluid-accent peer-checked:ring-1 peer-checked:ring-fluid-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              <span aria-hidden="true" className="relative flex min-h-24 flex-1 items-center justify-center overflow-hidden rounded border border-border bg-background">
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

    </fieldset>
    </div>
  );
}
