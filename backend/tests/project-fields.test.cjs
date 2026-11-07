const test = require("node:test");
const assert = require("node:assert/strict");
const { validateFields } = require("../services/project-fields");

test("question definitions enforce the assumptions used by renderers and answer validation", () => {
  for (const fields of [[], [{ type: "unknown", label: "Question" }], [{ type: "text", label: " " }],
    [{ type: "slider", label: "Score", config: { min: 1, max: 0 } }],
    [{ type: "slider", label: "Score", config: { step: 0 } }],
    [{ type: "mcq", label: "Pick", options: [] }],
    [{ type: "mcq", label: "Pick", options: [{ label: "A", value: "a" }, { label: "B", value: "a" }] }],
    [{ _id: "same", type: "text", label: "A" }, { _id: "same", type: "text", label: "B" }],
  ]) assert.throws(() => validateFields(fields), { status: 400 });
  const fields = [{ type: "slider", label: "Score", config: { min: 0, max: 1, step: 0.1 } }];
  assert.equal(validateFields(fields), fields);
});
