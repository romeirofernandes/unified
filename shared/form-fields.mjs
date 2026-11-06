export function numberPrecision(value) {
  const [base, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.min(
    12,
    Math.max(0, (base.split(".")[1]?.length || 0) - Number(exponent)),
  );
}
export function answerPlaceholder(type) {
  return type === "email" ? "you@example.com" : "Type your answer…";
}
export function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}
export function dateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const [, year, month, day] = match;
  if (
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > daysInMonth(year, month)
  )
    return null;
  return { year, month, day };
}
export function dateValue(parts) {
  return `${parts.year}-${parts.month}-${String(Math.min(Number(parts.day), daysInMonth(parts.year, parts.month))).padStart(2, "0")}`;
}
export function changeDatePart(parts, key, value) {
  return dateParts(dateValue({ ...parts, [key]: value }));
}
export function sliderTicks(min, max, step) {
  const count = Math.floor(Number(((max - min) / step).toFixed(6)));
  if (!(count > 0) || !Number.isFinite(count)) return [min, max];
  const ticks = Array.from({ length: Math.min(count + 1, 5) }, (_, index) =>
    Number(
      (
        min +
        Math.round((index * count) / (Math.min(count + 1, 5) - 1)) * step
      ).toFixed(Math.max(numberPrecision(min), numberPrecision(step))),
    ),
  );
  if (ticks.at(-1) !== max) ticks.push(max);
  return [...new Set(ticks)];
}
