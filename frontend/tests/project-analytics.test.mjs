import test from "node:test";
import assert from "node:assert/strict";
import { filteredResponses, questionAnalytics, projectAnalytics, timeSeries, dateValue } from "../src/lib/project-analytics.js";
const answers = (values) => values.map((value, index) => ({ _id: String(index), timestamp: "2026-11-01T12:00:00Z", formAnswers: { q: value } }));
const field = (type, extra = {}) => ({ _id: "q", label: "Question", type, ...extra });

test("numeric answers preserve zero, include empty scale values, and calculate the middle value", () => {
  const result = questionAnalytics(field("slider", { config: { min: 0, max: 10, step: 1 } }), answers([0, 2, 2, 10, "", "invalid", null]));
  assert.equal(result.valid, 4);
  assert.equal(result.skipped, 2);
  assert.equal(result.invalid, 1);
  assert.equal(result.mean, 3.5);
  assert.equal(result.median, 2);
  assert.equal(result.data.length, 11);
  assert.equal(result.data[0].count, 1);
  assert.equal(result.data[1].count, 0);
  assert.equal(result.data[10].count, 1);
});
test("histogram ranges include their final maximum and all historic numeric values", () => {
  const result = questionAnalytics(field("slider", { config: { min: 0, max: 100, step: 1 } }), answers([0, 50, 100, 101]));
  assert.equal(result.data.reduce((sum, row) => sum + row.count, 0), 4);
  assert.equal(result.data.at(-1).count, 2);
  assert.equal(result.outsideRange, true);
});
test("choice counts retain form order, zero-count options and previously removed choices", () => {
  const result = questionAnalytics(field("mcq", { options: [{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }] }), answers(["low", "Low", "high", "old", []]));
  assert.deepEqual(result.data.map((row) => row.count), [2, 0, 1, 1]);
  assert.equal(result.data[0].label, "Low");
  assert.match(result.data.at(-1).label, /Previous option/);
  assert.equal(result.skipped, 1);
});
test("calendar answer dates are validated and are separate from submission dates", () => {
  assert.equal(dateValue("2026-02-30"), null);
  const result = questionAnalytics(field("date"), answers(["2000-01-01", "2000-01-03", "2000-02-30", ""]));
  assert.equal(result.valid, 2);
  assert.equal(result.invalid, 1);
  assert.equal(result.data.length, 3);
  assert.deepEqual(result.data.map((point) => point.count), [1, 0, 1]);
  assert.equal(result.data[0].date.getUTCFullYear(), 2000);
});
test("email coverage uses all responses, groups repeated addresses, and reveals no address", () => {
  const result = questionAnalytics(field("email"), answers(["Person@example.com", "person@example.com", "bad", undefined]));
  assert.equal(result.valid, 2);
  assert.equal(result.invalid, 1);
  assert.equal(result.stats[1][1], "1");
  assert.equal(result.stats[2][1], "50%");
  assert.deepEqual(result.data.map((row) => row.count), [2, 2]);
  assert.doesNotMatch(JSON.stringify(result.data), /@/);
  assert.deepEqual(result.answers, []);
});
test("written answer counts normalize case and spaces without inventing categories", () => {
  const result = questionAnalytics(field("text"), answers([" Dark  mode ", "dark mode", "Export"]));
  assert.equal(result.kind, "text-categories");
  assert.equal(result.data[0].count, 2);
  assert.equal(result.data[0].label, "Dark mode");
});
test("word frequency counts answers containing a word, not repetitions inside one answer", () => {
  const result = questionAnalytics(field("textarea"), answers(["Export export export, please.", "Export and search.", "Search"]));
  assert.equal(result.kind, "words");
  assert.equal(result.data.find((row) => row.label === "export").count, 2);
  assert.equal(result.data.find((row) => row.label === "search").count, 2);
  assert.equal(result.answers.length, 3);
});
test("empty and malformed answers do not produce invented chart observations", () => {
  const empty = questionAnalytics(field("slider", { config: { min: 0, max: 10 } }), answers([]));
  assert.deepEqual(empty.data, []);
  const invalid = questionAnalytics(field("textarea"), answers([{ invalid: true }, null, " "]));
  assert.equal(invalid.invalid, 1);
  assert.equal(invalid.skipped, 2);
  assert.deepEqual(invalid.data, []);
});
test("time grouping preserves counts and includes zero periods without daily expansion over years", () => {
  const result = timeSeries([Date.parse("2020-01-01"), Date.parse("2026-01-01")]);
  assert.equal(result.unit, "year");
  assert.equal(result.data.length, 7);
  assert.equal(result.data.reduce((sum, row) => sum + row.count, 0), 2);
});
test("date filtering uses receipt time and all-time keeps undated responses", () => {
  const now = Date.parse("2026-11-07T00:00:00Z");
  const data = [{ timestamp: "2026-11-06" }, { timestamp: "2026-10-01" }, { timestamp: "invalid" }, { timestamp: "2026-12-01" }];
  assert.equal(filteredResponses(data, "7d", now).length, 1);
  assert.equal(filteredResponses(data, "30d", now).length, 1);
  assert.equal(filteredResponses(data, "all", now).length, 4);
});
test("answers to removed questions remain available without invented question text", () => {
  const project = { fields: [field("text")] };
  const result = projectAnalytics(project, [{ timestamp: "invalid", formAnswers: { q: "Answer", removed: "Old answer" } }]);
  assert.equal(result.questions.length, 2);
  assert.equal(result.previousQuestions, 1);
  assert.equal(result.questions[1].field.removed, true);
  assert.equal(result.questions[1].provided, 1);
  assert.equal(result.undated, 1);
});
test("each chart explanation uses at most two short descriptive sentences", () => {
  for (const type of ["slider", "mcq", "date", "email", "text", "textarea"]) {
    const description = questionAnalytics(field(type), []).explanation;
    const sentences = description.split(/[.!?]+/).filter((sentence) => sentence.trim());
    assert.ok(sentences.length <= 2);
    for (const sentence of sentences) assert.ok(sentence.trim().split(/\s+/).length <= 25);
    assert.doesNotMatch(description, /\b(?:can't|don't|doesn't|isn't)\b/i);
  }
});
