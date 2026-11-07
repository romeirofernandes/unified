const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAnswers } = require("../services/submission-answers");
const fields = [{ _id: "email", type: "email", label: "Email", required: true }, { _id: "rating", type: "slider", label: "Rating", config: { min: 0, max: 10, step: 2 } }];
test("custom submissions preserve question IDs and enforce required and typed answers", () => {
  assert.deepEqual(validateAnswers(fields, { email: "a@example.com", rating: 0 }), { email: "a@example.com", rating: 0 });
  for (const answers of [null, [], {}, { unknown: "x" }, { email: "bad" }, { email: "a@example.com", rating: 3 }, { email: "a@example.com", rating: 12 }]) {
    assert.throws(() => validateAnswers(fields, answers), { status: 400 });
  }
});
test("empty optional submissions, impossible dates and unknown choices are rejected", () => {
  assert.throws(() => validateAnswers([{ _id: "text", type: "text", label: "Message" }], {}));
  assert.throws(() => validateAnswers([{ _id: "date", type: "date", label: "Date" }], { date: "2026-02-30" }));
  assert.throws(() => validateAnswers([{ _id: "choice", type: "mcq", label: "Choice", options: [{ label: "Yes", value: "yes" }] }], { choice: "no" }));
});
test("project documents reject zero questions", () => {
  const Project = require("../models/Project");
  const project = new Project({ name: "Empty", userId: "507f1f77bcf86cd799439011", fields: [] });
  assert.match(project.validateSync().message, /at least one question/);
});
