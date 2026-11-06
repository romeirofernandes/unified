const test = require("node:test");
const assert = require("node:assert/strict");
const { validateGeneratedForm } = require("../services/form-generation");
const form = (fields) => ({ name: "Feedback", description: "A form", fields });
test("generated drafts keep only supported data and omit the built-in email", () => {
  const result = validateGeneratedForm(
    form([
      { type: "email", label: "Email" },
      {
        _id: "forged",
        type: "mcq",
        label: "Choose",
        required: true,
        options: ["Design", "Speed"],
      },
    ]),
  );
  assert.equal(result.fields.length, 1);
  assert.equal(result.fields[0]._id, undefined);
  assert.deepEqual(result.fields[0].options, [
    { label: "Design", value: "Design" },
    { label: "Speed", value: "Speed" },
  ]);
});
test("malformed generated forms are rejected before they reach the editor", () => {
  for (const fields of [
    [{ type: "script", label: "Run" }],
    [{ type: "text", label: "" }],
    [{ type: "mcq", label: "Choose", options: ["One"] }],
    [{ type: "slider", label: "Rate", config: { min: 10, max: 0, step: 1 } }],
    [{ type: "text", label: "Name", required: "false" }],
  ]) {
    assert.throws(() => validateGeneratedForm(form(fields)), /invalid/);
  }
});
test("a generated slider preserves zero and a valid fractional step", () => {
  const result = validateGeneratedForm(
    form([
      { type: "slider", label: "Rate", config: { min: 0, max: 5, step: 0.5 } },
    ]),
  );
  assert.equal(result.fields[0].config.min, 0);
  assert.equal(result.fields[0].config.step, 0.5);
});

test("date questions are accepted without invented options or range settings", () => {
  const result = validateGeneratedForm(
    form([{ type: "date", label: "When did you start?", required: true }]),
  );
  assert.deepEqual(result.fields[0], {
    type: "date",
    label: "When did you start?",
    required: true,
  });
});
