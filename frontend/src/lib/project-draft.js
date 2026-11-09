import { serializeFields } from "./project-fields.js";

// Ignore editor-only IDs and object insertion order when comparing a draft.
function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, ordered(value[key])]),
    );
  return value;
}
export function projectDraftKey({
  name,
  description,
  theme,
  appearance,
  shippingUpdatesEnabled = false,
  fields,
}) {
  return JSON.stringify(
    ordered({
      name: name.trim(),
      description: description.trim(),
      theme,
      appearance,
      shippingUpdatesEnabled,
      fields: serializeFields(fields),
    }),
  );
}
