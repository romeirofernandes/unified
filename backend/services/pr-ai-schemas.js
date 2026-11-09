// Provider schemas guarantee shape; pr-policy still validates scope and exact source edits.
const selection = {
  type: "object", additionalProperties: false, required: ["paths"],
  properties: { paths: { type: "array", items: { type: "string" } } },
};
const assessment = {
  type: "object", additionalProperties: false, required: ["suitable", "category", "reason", "plan"],
  properties: {
    suitable: { type: "boolean" },
    category: { type: "string", enum: ["ui_copy", "ui_style", "ui_behavior", "documentation", "unsupported"] },
    reason: { type: "string" }, plan: { type: "array", items: { type: "string" } },
  },
};
const patch = {
  type: "object", additionalProperties: false, required: ["edits"],
  properties: { edits: { type: "array", items: {
    type: "object", additionalProperties: false, required: ["path", "before", "after"],
    properties: { path: { type: "string" }, before: { type: "string" }, after: { type: "string" } },
  } } },
};
const review = {
  type: "object", additionalProperties: false, required: ["approved", "reason"],
  properties: { approved: { type: "boolean" }, reason: { type: "string" } },
};
module.exports = { selection, assessment, patch, review };
