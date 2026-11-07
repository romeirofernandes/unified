const types = new Set(["text", "email", "textarea", "mcq", "slider", "date"]);

function validateFields(fields) {
  const invalid = (message) => { const error = new Error(message); error.status = 400; throw error; };
  if (!Array.isArray(fields) || !fields.length) invalid("Add at least one question before saving.");
  const ids = new Set();
  for (const field of fields) {
    if (!field || !types.has(field.type) || typeof field.label !== "string" || !field.label.trim()) invalid("Every question needs a supported type and a label.");
    if (field._id) {
      const id = String(field._id);
      if (ids.has(id)) invalid("Question IDs must be unique.");
      ids.add(id);
    }
    if (field.type === "slider") {
      const { min = 0, max = 100, step = 1 } = field.config || {};
      if (![min, max, step].every(Number.isFinite) || min >= max || step <= 0 || step > max - min) invalid("Sliders need finite bounds and a positive step within their range.");
    }
    if (field.type === "mcq") {
      if (!Array.isArray(field.options) || !field.options.length) invalid("Choice questions need at least one option.");
      const values = new Set();
      for (const option of field.options) {
        if (!option || typeof option.label !== "string" || !option.label.trim() || typeof option.value !== "string" || !option.value.trim() || values.has(option.value)) invalid("Choices need nonempty labels and unique values.");
        values.add(option.value);
      }
    }
  }
  return fields;
}
module.exports = { validateFields };
