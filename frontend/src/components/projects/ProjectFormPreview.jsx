import PreviewField from "./PreviewField";

export default function ProjectFormPreview({ name, fields, theme = "light" }) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Live preview</h3><span className="text-xs text-muted-foreground">Not submitted</span></div>
      <div className={`space-y-5 rounded-md border p-5 ${theme === "dark" ? "border-[#383838] bg-[#191919] text-[#fafafa]" : "border-[#dedede] bg-white text-[#171717]"}`}>
        <h3 className="text-xl">{name || "Your feedback form"}</h3>
        {fields.map((field) => <PreviewField key={field.id || field._id} field={{ ...field, label: field.label || "Your question" }} theme={theme} />)}
      </div>
    </aside>
  );
}
