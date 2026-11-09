export const runLabels = {
  queued: "Assessment queued", assessing: "Assessing scope", eligible: "Ready to attempt", not_suitable: "Needs a human",
  queued_fix: "Fix queued", generating: "Preparing patch", publishing: "Opening draft", awaiting_checks: "Waiting for CI",
  checks_passed: "Ready for review", ready_for_review: "Review required", needs_attention: "Needs attention", merged: "Merged · awaiting release", closed: "Closed", shipped: "Shipped", failed: "Run stopped", cancelled: "Cancelled",
};
export const activeStatuses = ["queued", "assessing", "queued_fix", "generating", "publishing"];
export const watchedStatuses = ["awaiting_checks", "checks_passed", "ready_for_review", "needs_attention"];
