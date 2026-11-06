import test from "node:test";
import assert from "node:assert/strict";
import {
  dateParts,
  dateValue,
  changeDatePart,
  numberPrecision,
  sliderTicks,
  answerPlaceholder,
} from "../../shared/form-fields.mjs";
test("date wheels clamp invalid days when months or leap years change", () => {
  assert.equal(
    dateValue(changeDatePart(dateParts("2024-02-29"), "year", "2025")),
    "2025-02-28",
  );
  assert.equal(
    dateValue(changeDatePart(dateParts("2026-01-31"), "month", "04")),
    "2026-04-30",
  );
  assert.equal(dateParts("2025-02-29"), null);
  assert.equal(dateParts("not a date"), null);
});
test("slider labels preserve fractional values and remain bounded for tiny steps", () => {
  assert.equal(numberPrecision(0.125), 3);
  assert.equal(numberPrecision(1e-8), 8);
  assert.deepEqual(sliderTicks(0, 0.3, 0.1), [0, 0.1, 0.2, 0.3]);
  assert.ok(sliderTicks(0, 1, 0.000001).length <= 6);
  assert.ok(sliderTicks(0, 10, 3).includes(10));
});
test("preview and SDK use generic answer placeholders", () => {
  assert.equal(answerPlaceholder("email"), "you@example.com");
  assert.equal(answerPlaceholder("textarea"), "Type your answer…");
  assert.equal(answerPlaceholder("text"), "Type your answer…");
});
