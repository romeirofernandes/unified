import PreviewModeToggle from "./PreviewModeToggle";
import { previewThemeStyle } from "../../../../shared/form-theme.mjs";
import PreviewField from "./PreviewField";

export default function ProjectFormPreview({
  name,
  fields,
  theme = "light",
  appearance,
  onThemeChange,
  disabled,
}) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Live preview</h3>
        {onThemeChange && (
          <PreviewModeToggle
            value={theme}
            onChange={onThemeChange}
            disabled={disabled}
          />
        )}
      </div>
      <div
        style={previewThemeStyle(appearance, theme)}
        className="space-y-5 rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] p-5 text-[var(--uf-text)]"
      >
        <h3 className="text-xl">{name || "Your feedback form"}</h3>
        {fields.map((field) => (
          <PreviewField
            key={field.id || field._id}
            field={{ ...field, label: field.label || "Your question" }}
            theme={theme}
          />
        ))}
        <button
          type="button"
          disabled
          className="h-10 w-full rounded-md bg-[var(--uf-accent)] px-4 text-sm font-medium text-[var(--uf-accentText)]"
        >
          Submit feedback
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview only. No feedback is sent.
      </p>
    </aside>
  );
}
