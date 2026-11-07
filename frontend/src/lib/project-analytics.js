const DAY = 86400000;
const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const formatNumber = (value) => formatter.format(value);
const present = (value) => value !== undefined && value !== null && !(typeof value === "string" && !value.trim()) && !(Array.isArray(value) && !value.length);
const normalize = (value) => String(value).normalize("NFKC").trim().replace(/\s+/g, " ");
const textOf = (value) => Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
export function filteredResponses(responses, range = "all", now = Date.now()) {
  if (range === "all") return responses;
  const days = range === "7d" ? 7 : 30;
  return responses.filter((response) => { const time = Date.parse(response.timestamp); return Number.isFinite(time) && time >= now - days * DAY && time <= now; });
}
export function dateValue(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? +date : null;
}
export function timeSeries(timestamps) {
  const valid = timestamps.filter(Number.isFinite);
  if (!valid.length) return { data: [], unit: "day" };
  let min = Infinity, max = -Infinity;
  for (const time of valid) { min = Math.min(min, time); max = Math.max(max, time); }
  const span = (max - min) / DAY;
  const unit = span <= 45 ? "day" : span <= 270 ? "week" : span <= 1460 ? "month" : "year";
  const yearStep = Math.max(1, Math.ceil((new Date(max).getUTCFullYear() - new Date(min).getUTCFullYear() + 1) / 60));
  const start = (time) => {
    const date = new Date(time), year = date.getUTCFullYear(), month = date.getUTCMonth();
    if (unit === "year") return Date.UTC(Math.floor(year / yearStep) * yearStep, 0, 1);
    if (unit === "month") return Date.UTC(year, month, 1);
    const day = Date.UTC(year, month, date.getUTCDate());
    return unit === "week" ? day - ((date.getUTCDay() + 6) % 7) * DAY : day;
  };
  const counts = new Map();
  for (const time of valid) { const key = start(time); counts.set(key, (counts.get(key) || 0) + 1); }
  const data = [];
  const last = start(max);
  for (let cursor = start(min); cursor <= last;) {
    const date = new Date(cursor);
    const label = unit === "year" ? `${date.getUTCFullYear()}${yearStep > 1 ? `–${date.getUTCFullYear() + yearStep - 1}` : ""}` : new Intl.DateTimeFormat("en", { timeZone: "UTC", month: "short", ...(unit === "month" ? { year: "numeric" } : { day: "numeric", ...(new Date(min).getUTCFullYear() !== new Date(max).getUTCFullYear() ? { year: "2-digit" } : {}) }) }).format(date);
    data.push({ date, label, count: counts.get(cursor) || 0 });
    cursor = unit === "year" ? Date.UTC(date.getUTCFullYear() + yearStep, 0, 1) : unit === "month" ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) : cursor + DAY * (unit === "week" ? 7 : 1);
  }
  return { data, unit: unit === "year" && yearStep > 1 ? `${yearStep}-year period` : unit };
}
const STOP = new Set("a an the and or but if then than so to of in on at by for from with as is are was were be been being it its i me my we us our you your he she they them their this that these those there here have has had do does did can could would should will just very really also please thanks thank about into more much some any all not no yes am im ive dont didnt doesnt cant wont good great nice website app product feedback use using used like love want need make get one something everything nothing".split(" "));
function words(answers) {
  const counts = new Map();
  for (const answer of answers) {
    const tokens = new Set((answer.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) || []).filter((word) => word.length > 2 && !STOP.has(word) && !/^\d+$/.test(word)));
    for (const word of tokens) counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
function numericDistribution(values, config = {}) {
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0], max = sorted.at(-1);
  const low = Number.isFinite(config.min) ? Math.min(config.min, min) : min;
  const high = Number.isFinite(config.max) ? Math.max(config.max, max) : max;
  const step = Number.isFinite(config.step) && config.step > 0 ? config.step : 1;
  const slots = (high - low) / step;
  const formatStep = (value, interval) => new Intl.NumberFormat(undefined, { maximumFractionDigits: Math.min(20, Math.max(2, Math.ceil(-Math.log10(interval)) + 1)) }).format(value);
  let data;
  if (slots <= 19 && Math.abs(slots - Math.round(slots)) < 1e-7 && values.every((value) => Math.abs((value - low) / step - Math.round((value - low) / step)) < 1e-7)) {
    data = Array.from({ length: Math.round(slots) + 1 }, (_, index) => ({ label: formatStep(low + index * step, step), count: 0 }));
    for (const value of values) data[Math.round((value - low) / step)].count++;
  } else if (min === max && high === low) data = [{ label: formatNumber(min), count: values.length }];
  else {
    const width = (high - low) / 10;
    data = Array.from({ length: 10 }, (_, index) => ({ label: `${formatStep(low + index * width, width)} to ${index === 9 ? "" : "<"}${formatStep(low + (index + 1) * width, width)}`, count: 0 }));
    for (const value of values) data[Math.min(9, Math.max(0, Math.floor((value - low) / width)))].count++;
  }
  return { data, mean: values.reduce((sum, value) => sum + value, 0) / values.length, median: (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2, min, max, outsideRange: values.some((value) => (Number.isFinite(config.min) && value < config.min) || (Number.isFinite(config.max) && value > config.max)) };
}
export function questionAnalytics(field, responses) {
  const entries = responses.map((response) => response.formAnswers?.[field._id]).filter(present);
  const base = { field, provided: entries.length, skipped: responses.length - entries.length, total: responses.length, invalid: 0, valid: entries.length, stats: [], data: [], answers: [] };
  if (field.type === "slider") {
    const values = entries.filter((value) => typeof value === "number" || typeof value === "string").map(Number).filter(Number.isFinite);
    const distribution = values.length ? numericDistribution(values, field.config) : { data: [] };
    return { ...base, ...distribution, kind: "numeric", valid: values.length, invalid: entries.length - values.length, explanation: "Each bar shows the number of answers in one value or range. Taller bars show the values selected more often.", stats: values.length ? [["Average", formatNumber(distribution.mean)], ["Middle value", formatNumber(distribution.median)], ["Lowest / highest", `${formatNumber(distribution.min)} / ${formatNumber(distribution.max)}`]] : [] };
  }
  if (field.type === "mcq") {
    const options = field.options || [];
    const counts = new Map(options.map((option) => [String(option.value), { label: option.label, count: 0 }]));
    let invalid = 0;
    for (const value of entries) {
      if (typeof value !== "string" && typeof value !== "number") { invalid++; continue; }
      const key = String(value);
      const option = options.find((item) => String(item.value) === key || item.label === key);
      const canonical = option ? String(option.value) : key;
      if (!counts.has(canonical)) counts.set(canonical, { label: `${key} · Previous option`, count: 0 });
      counts.get(canonical).count++;
    }
    return { ...base, kind: "choice", invalid, valid: entries.length - invalid, data: [...counts.values()], explanation: "Each bar shows the number of people who selected that answer. Compare the bar lengths to find the most selected answers." };
  }
  if (field.type === "date") {
    const values = entries.map(dateValue).filter((value) => value !== null);
    const series = timeSeries(values);
    return { ...base, ...series, kind: "dates", valid: values.length, invalid: entries.length - values.length, explanation: "Each bar shows how many people selected dates in that period. These are answer dates, not the dates when responses arrived.", stats: values.length ? [["First date", new Date(values.reduce((low, value) => Math.min(low, value), Infinity)).toISOString().slice(0, 10)], ["Last date", new Date(values.reduce((high, value) => Math.max(high, value), -Infinity)).toISOString().slice(0, 10)], ["Time groups", `By ${series.unit}`]] : [] };
  }
  if (field.type === "email") {
    const valid = entries.filter((value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
    const unique = new Set(valid.map((value) => value.trim().toLowerCase()));
    return { ...base, kind: "email", valid: valid.length, invalid: entries.length - valid.length, data: [{ label: "Valid email", count: valid.length }, { label: "No valid email", count: responses.length - valid.length }], explanation: "This chart shows how many responses include a valid email address. It does not show email addresses.", stats: [["Valid addresses", formatNumber(valid.length)], ["Different addresses", formatNumber(unique.size)], ["With valid email", `${responses.length ? Math.round(valid.length / responses.length * 100) : 0}%`]] };
  }
  const usable = field.type === "unknown" ? entries : entries.filter((value) => typeof value === "string" || typeof value === "number");
  const answers = usable.map(textOf).map(normalize).filter(Boolean);
  const counts = new Map();
  for (const answer of answers) { const key = answer.toLowerCase(); const item = counts.get(key); if (item) item.count++; else counts.set(key, { label: answer, count: 1 }); }
  const categories = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const short = field.type !== "textarea" && categories.length <= 12 && answers.every((answer) => answer.length <= 60);
  return { ...base, valid: usable.length, invalid: entries.length - usable.length, kind: short ? "text-categories" : "words", data: short ? categories : words(answers).slice(0, 10), answers, distinct: categories.length, explanation: short ? "Each bar counts answers with the same text. Letter case and extra spaces do not change the count." : "Each bar counts answers that contain the word. A word count does not show whether the answer is positive or negative.", stats: [["Written answers", formatNumber(answers.length)], ["Different answers", formatNumber(categories.length)]] };
}
export function projectAnalytics(project, responses) {
  const fields = project.fields || [];
  const known = new Set(fields.map((field) => String(field._id)));
  const removed = new Set();
  for (const response of responses) for (const id of Object.keys(response.formAnswers || {})) if (!known.has(id)) removed.add(id);
  const questions = [...fields, ...[...removed].map((id, index) => ({ _id: id, label: `Previous question ${index + 1}`, type: "unknown", removed: true }))].map((field) => questionAnalytics(field, responses));
  const dates = responses.map((response) => Date.parse(response.timestamp)).filter(Number.isFinite);
  return { questions, activity: timeSeries(dates), undated: responses.length - dates.length, total: responses.length, currentQuestions: fields.length, previousQuestions: removed.size, answered: questions.filter((question) => !question.field.removed).reduce((sum, question) => sum + question.provided, 0) };
}
