function validateAnswers(fields, answers) {
  const invalid = (message) => { const error = new Error(message); error.status = 400; throw error; };
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) invalid("Provide formAnswers keyed by question ID.");
  const known = new Set(fields.map((field) => String(field._id)));
  if (Object.keys(answers).some((id) => !known.has(id))) invalid("An answer refers to an unknown question.");
  const result = {};
  for (const field of fields) {
    const id = String(field._id), value = answers[id];
    if (value === undefined || value === null || value === "") {
      if (field.required) invalid(`Answer “${field.label}”.`);
      continue;
    }
    if (field.type === "slider") {
      const { min = 0, max = 100, step = 1 } = field.config || {};
      if (!Number.isFinite(value) || value < min || value > max || Math.abs((value - min) / step - Math.round((value - min) / step)) > 1e-7) invalid(`Invalid value for “${field.label}”.`);
    } else {
      if (typeof value !== "string" || !value.trim() || value.length > 12000) invalid(`Invalid answer for “${field.label}”.`);
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) invalid("Provide a valid email address.");
      if (field.type === "mcq" && !field.options.some((option) => option.value === value)) invalid(`Choose an option for “${field.label}”.`);
      if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) invalid("Provide a valid date as YYYY-MM-DD.");
    }
    result[id] = value;
  }
  if (!Object.keys(result).length) invalid("Provide at least one answer.");
  return result;
}
module.exports = { validateAnswers };
