export const stages = [
  { id: "scope", label: "Assess scope", description: "Read the source and decide whether this issue fits a small fix." },
  { id: "patch", label: "Prepare patch", description: "Generate exact edits and review them against the saved brief." },
  { id: "pr", label: "Draft pull request", description: "Create a branch and open a draft PR with the proposed changes." },
  { id: "review", label: "Review & merge", description: "Review the PR on GitHub, including any automated checks." },
  { id: "ship", label: "Ship fix", description: "Confirm the fix is released and move the workbench issue to Done." },
  { id: "notify", label: "Notify reporters", description: "Deliver shipping emails to linked reporters who opted in." },
];
export function pipelineStates(run) {
  if (!run) return stages.map(stage => ({ ...stage, state: "waiting", detail: stage.description }));
  const status = run.status;
  const failure = run.failedStage || (run.branch ? "pr" : run.assessment ? "patch" : "scope");
  const index = ["queued", "assessing", "eligible", "not_suitable"].includes(status) ? 0 : ["queued_fix", "generating"].includes(status) ? 1 : status === "publishing" ? 2 : ["awaiting_checks", "checks_passed", "ready_for_review", "needs_attention", "closed"].includes(status) ? 3 : status === "merged" ? 4 : status === "shipped" ? 5 : Math.max(0, stages.findIndex(stage => stage.id === failure));
  return stages.map((stage, i) => {
    let state = i < index ? "complete" : i === index ? "active" : "waiting";
    let detail = stage.description;
    if (stage.id === "scope" && run.assessment?.reason) detail = run.assessment.reason;
    if (stage.id === "patch" && run.patch?.length) detail = `${new Set(run.patch.map(edit => edit.path)).size} files changed. ${run.review?.reason || "Exact replacements validated."}`;
    if (stage.id === "pr" && run.prUrl) detail = `Draft PR #${run.prNumber || ""} created on ${run.repository}.`;
    if (i === index && run.message) detail = run.message;
    if (status === "eligible" && i === 0) state = "complete";
    if (["failed", "needs_attention", "not_suitable"].includes(status) && i === index) state = "failed";
    if (["cancelled", "closed"].includes(status) && i === index) state = "stopped";
    if (stage.id === "notify" && status === "shipped") {
      detail = run.notification?.message || "Shipping updates are queued.";
      state = run.notification?.status === "sent" ? "complete" : ["disabled", "empty"].includes(run.notification?.status) ? "skipped" : run.notification?.status === "failed" ? "failed" : "active";
    }
    if (stage.id === "notify" && status !== "shipped" && run.shippingUpdatesEnabled === false) {
      state = "skipped";
      detail = "Shipping emails are disabled for this project.";
    }
    return { ...stage, state, detail };
  });
}
export function pipelineLayout(columns) {
  return stages.map((stage, i) => {
    const row = Math.floor(i / columns);
    const col = row % 2 ? columns - 1 - i % columns : i % columns;
    const nextRow = Math.floor((i + 1) / columns);
    return { id: stage.id, position: { x: col * 300, y: row * 210 }, input: i === 0 ? null : columns === 1 || i % columns === 0 ? "top" : row % 2 ? "right" : "left", output: i === stages.length - 1 ? null : columns === 1 || nextRow !== row ? "bottom" : row % 2 ? "left" : "right" };
  });
}
export function stageEvents(run, stageId) {
  let previous = "scope";
  const events = (run.events || []).filter(event => {
    const status = event.status;
    const stage = event.stage || (["queued", "assessing", "eligible", "not_suitable"].includes(status) ? "scope" : ["queued_fix", "generating"].includes(status) ? "patch" : ["publishing", "awaiting_checks"].includes(status) ? "pr" : ["checks_passed", "ready_for_review", "needs_attention", "merged", "closed"].includes(status) ? "review" : status === "shipped" ? "ship" : ["failed", "cancelled"].includes(status) ? run.failedStage || previous : previous);
    previous = stage;
    return stage === stageId;
  });
  if (stageId === "notify" && !events.length && run.notification?.message) return [{stage:"notify",status:run.notification.status === "failed" ? "failed" : run.status,message:run.notification.message}];
  return events;
}
