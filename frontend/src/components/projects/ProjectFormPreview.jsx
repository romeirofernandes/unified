import FeedbackLauncher from "../../../../shared/FeedbackLauncher";
import FormFont from "../../../../shared/FormFont";
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
      <FormFont appearance={appearance} />
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
        className="space-y-5 rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] [&_h3]:font-[inherit] p-5 text-[var(--uf-text)]"
      >
        <h3 style={{ fontFamily: "var(--uf-font)" }} className="text-xl">
          {name || "Your feedback form"}
        </h3>
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
      <div className={`flex ${appearance?.launcher?.position === "bottom-left" ? "justify-start" : "justify-end"} py-3`} style={previewThemeStyle(appearance, theme)}>
        <span className="inline-flex h-12 items-center justify-center gap-2.5 px-5 text-sm font-medium shadow-sm" style={{ background: "var(--uf-launcher-bg)", color: "var(--uf-launcher-text)", borderRadius: ["rounded", "tab"].includes(appearance?.launcher?.style) ? 14 : 99 }}>
          <FeedbackLauncher launcher={appearance?.launcher} />
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview only. No feedback is sent.
      </p>
    </aside>
  );
}
