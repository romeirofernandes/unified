function describe(event) {
  const message = event.message || "";
  if (/AI request started|AI response|AI request failed|malformed structured/i.test(message)) return {tool:"ai",label:"Model request",target:message.split(" · ")[1] || "Groq"};
  if (/queued|requested/i.test(message)) return {tool:"queue",label:"Queue task",target:"Worker"};
  if (/selected|matched|ranked|selecting|file list/i.test(message)) return {tool:"read",label:"Select source",target:"Repository files"};
  if (/reading|loaded|context|source hashes/i.test(message)) return {tool:"read",label:"Read context",target:"Source snapshot"};
  if (/patch|replacement|validated/i.test(message)) return {tool:"edit",label:"Validate patch",target:"Exact edits"};
  if (/PR|GitHub|branch|merge/i.test(message)) return {tool:"git",label:"GitHub",target:"Pull request"};
  if (/email|shipping update|reporter/i.test(message)) return {tool:"mail",label:"Email delivery",target:"Opted-in reporters"};
  return {tool:"check",label:event.status === "failed" ? "Step failed" : "Step result",target:event.status === "eligible" ? "Ready for a fix" : "Result"};
}
export function traceTools(events, state) {
  const rows = []; let pendingAI;
  events.forEach((event, index) => {
    const inferred = describe(event);
    let key = event.operation;
    if (!key && inferred.tool === "ai") {
      if (/AI request started/.test(event.message)) pendingAI = `legacy-ai-${index}`;
      key = pendingAI;
    }
    let row = key && rows.find(item => item.key === key);
    if (!row) {
      row = {key:key || `event-${index}`,tool:event.tool || inferred.tool,label:event.label || inferred.label,target:event.target || inferred.target,messages:[],state:"complete"};
      rows.push(row);
    }
    row.messages.push(event.message);
    row.state = event.state || (event.status === "failed" || /AI request failed/.test(event.message) ? "failed" : /AI request started/.test(event.message) ? "running" : "complete");
    if (event.durationMs !== undefined) row.durationMs = event.durationMs;
  });
  // A worker can fail between a tool's start and finish. Never leave a historical spinner running.
  rows.forEach(row => { if (row.state === "running" && state !== "active") row.state = state === "failed" ? "failed" : state === "complete" ? "complete" : "stopped"; });
  return rows;
}
