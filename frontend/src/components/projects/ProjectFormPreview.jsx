import { previewThemeStyle } from "../../../../shared/form-theme.mjs";
import PreviewField from "./PreviewField";

export default function ProjectFormPreview({
  name,
  fields,
  theme = "light",
  appearance,
}) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Live preview</h3>
        <span className="text-xs text-muted-foreground">Not submitted</span>
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
      </div>
    </aside>
  );
}
