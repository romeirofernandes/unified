export const fieldTypes = [
  { value: "text", label: "Short text" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Long text" },
  { value: "mcq", label: "Multiple choice" },
  { value: "slider", label: "Slider" },
];

export function createField(type = "text") {
  return {
    id: crypto.randomUUID(),
    type,
    label: type === "email" ? "Email" : "",
    required: type === "email",
    options: [],
    config: { min: 0, max: 100, step: 1 },
  };
}

export function validateFields(fields) {
  for (const [index, field] of fields.entries()) {
    if (!field.label.trim()) return `Add a label for field ${index + 1}.`;
    if (
      field.type === "mcq" &&
      (!field.options.length ||
        field.options.some((option) => !option.label.trim()))
    )
      return `Add a label to every option in “${field.label}”.`;
    if (field.type === "slider") {
      const { min, max, step } = field.config;
      if (
        ![min, max, step].every(Number.isFinite) ||
        min >= max ||
        step <= 0 ||
        step > max - min
      )
        return `“${field.label}” needs a maximum above its minimum and a valid positive step.`;
    }
  }
  return "";
}

export function serializeFields(fields) {
  return fields.map(({ type, label, required, options, config }) => ({
    type,
    label: label.trim(),
    required,
    ...(type === "mcq"
      ? {
          options: options.map(({ label, value }) => ({
            label: label.trim(),
            value: value.trim(),
          })),
        }
      : {}),
    ...(type === "slider" ? { config } : {}),
  }));
}
