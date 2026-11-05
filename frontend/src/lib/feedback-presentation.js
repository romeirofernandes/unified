export function answerText(value) {
  if (Array.isArray(value))
    return value.length ? value.join(", ") : "No answer";
  return value === null || value === undefined || value === ""
    ? "No answer"
    : String(value);
}

export function responseDetails(feedback, fields) {
  const lookup = new Map(fields.map((field) => [String(field._id), field]));
  const answers = Object.entries(feedback.formAnswers || {}).map(
    ([id, value]) => ({
      id,
      label: lookup.get(id)?.label || "Removed question",
      type: lookup.get(id)?.type,
      value: answerText(value),
    }),
  );
  const email = answers.find(
    (answer) => answer.type === "email" && answer.value !== "No answer",
  )?.value;
  const written =
    answers.find(
      (answer) => answer.type === "textarea" && answer.value !== "No answer",
    ) ||
    answers.find(
      (answer) => answer.type === "text" && answer.value !== "No answer",
    );
  const timestamp = new Date(feedback.timestamp).getTime();
  return {
    feedback,
    answers,
    sender: email || "Anonymous response",
    preview:
      written?.value ||
      `${answers.length} ${answers.length === 1 ? "answer" : "answers"}`,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
  };
}
