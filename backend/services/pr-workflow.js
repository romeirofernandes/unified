const { randomUUID } = require("node:crypto");
const Project = require("../models/Project");
const Connection = require("../models/PullRequestConnection");
const Run = require("../models/PullRequestRun");
const Blob = require("../models/RepositoryBlob");
const github = require("./pr-github");
const { groqJson } = require("./groq-client");
const { system, selectContext, sourceFile } = require("./pr-context");
const { fail, fingerprint, validateAssessment, applyPatch } = require("./pr-policy");
const working = ["assessing", "generating", "publishing"];
const watched = ["awaiting_checks", "checks_passed", "ready_for_review", "needs_attention"];
function deps(overrides) { return { Project, Connection, Run, Blob, github, ask: groqJson, selectContext, sourceFile, ...overrides }; }
function cleanError(error) { return error.status ? error.message : "This run could not finish. Refresh its GitHub status before starting another attempt."; }
async function liveProject(run, d) {
  const project = await d.Project.findOne({ _id: run.projectId, userId: run.userId }).select("+workbenchIssues").lean();
  const issue = project?.workbenchIssues.find(item => String(item._id) === String(run.issueId) && !item.deleted && item.status !== "done");
  const connection = await d.Connection.findOne({ projectId: run.projectId, userId: run.userId }).lean();
  if (!issue || fingerprint(issue) !== run.issue.fingerprint) throw fail("The issue changed or is no longer open. Assess it again before attempting a fix.");
  if (!connection || connection.repositoryId !== run.repositoryId || connection.installationId !== run.installationId || connection.repository !== run.repository || connection.defaultBranch !== run.baseBranch) throw fail("The repository connection changed. Start a fresh assessment.");
  return project;
}
async function event(d, filter, status, message, extra = {}) {
  return d.Run.updateOne(filter, { $set: { status, message, ...extra }, $push: { events: { $each: [{ at: new Date(), status, message }], $slice: -40 } } });
}
function prBody(run) {
  return `## Summary\n\n${run.issue.title}\n\n\`\`\`text\nfeedback issue -> bounded patch -> ${run.requiredCheck || "GitHub review"} -> human review\n\`\`\`\n\nAcceptance criteria:\n${run.acceptance}\n\n${run.assessment.plan.map(step => `- ${step}`).join("\n")}\n\n## Evidence\n\n- **Before:** source commit \`${run.baseSha}\`; issue and file hashes saved in Unified run \`${run._id}\`.\n- **After:** ${run.patch.length} exact replacements. CI has not been verified yet. Review the diff and any reported GitHub checks before merging.\n\n## Merge Danger\n\n**Door:** two-way\n\n**Blast Radius:** UI\n\nAI-generated draft. No tests, dependencies or workflows were modified. Merging does not notify reporters; mark the issue shipped in Unified after release.\n`;
}
async function findPull(api, run) {
  const owner = run.repository.split("/")[0];
  const pulls = await api(`/pulls?state=all&head=${encodeURIComponent(`${owner}:${run.branch}`)}&base=${encodeURIComponent(run.baseBranch)}&per_page=10`);
  return pulls.find(pull => pull.head?.ref === run.branch && pull.base?.ref === run.baseBranch);
}
async function assessRun(run, d, filter) {
  const { api } = await d.github.repositoryClient(run);
  await liveProject(run, d);
  const context = await d.selectContext(run, api, d.ask, d.Blob);
  const value = await d.ask({ messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ task: "Assess this issue against the actual files. Return {suitable:boolean,category:ui_copy|ui_style|ui_behavior|documentation|unsupported,reason:string,plan:string[]}. Reject vague requests, changes requiring other files, security-sensitive changes, or behavior with no clear way for a reviewer to verify it. Do not count confidence as evidence.", issue: run.issue, acceptance: run.acceptance, files: context.files }) }], maxTokens: 2500 });
  const assessment = validateAssessment(value, context.files);
  await liveProject(run, d);
  await event(d, filter, assessment.suitable ? "eligible" : "not_suitable", assessment.reason, { active: false, assessment, baseSha: context.baseSha, baseTree: context.baseTree, files: context.files.map(({ path, sha, size }) => ({ path, sha, size })), leaseUntil: null });
}
async function fixRun(run, d, filter) {
  const { api } = await d.github.repositoryClient(run);
  await liveProject(run, d);
  const head = await api(`/commits/${encodeURIComponent(run.baseBranch)}`);
  if (head.sha !== run.baseSha) throw fail("The base branch changed. Create a fresh assessment against its latest commit.");
  const files = await Promise.all(run.files.map(file => d.sourceFile(run, api, file, d.Blob)));
  const proposal = await d.ask({ messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ task: "Implement only the assessed fix. Return {edits:[{path,before,after}]}. Each before must be an exact unique substring of a provided file. Use short replacements with enough context to match uniquely. Do not create files, change tests, widen scope, add network calls, change security behavior or rewrite whole files. At most 3 files, 12 replacements, 120 lines counting before plus after. Return {edits:[]} if it cannot be done precisely.", issue: run.issue, acceptance: run.acceptance, assessment: run.assessment, files }) }], maxTokens: 7000 });
  const updated = applyPatch(files, proposal.edits);
  const review = await d.ask({ messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ task: "Review this proposed patch against the original files and acceptance criteria. Return {approved:boolean,reason:string}. Reject incorrect changes, new sensitive behavior, missing context, out-of-scope changes, and weakened validation. This is a preflight review, not proof that tests passed.", issue: run.issue, acceptance: run.acceptance, files, edits: proposal.edits }) }], maxTokens: 1200 });
  if (review.approved !== true || typeof review.reason !== "string" || review.reason.length > 2000) throw fail("The proposed patch did not pass the scope review. A human should investigate this issue.");
  await liveProject(run, d);
  if ((await api(`/commits/${encodeURIComponent(run.baseBranch)}`)).sha !== run.baseSha) throw fail("The base branch changed during generation. Assess the issue again.");
  run.patch = proposal.edits;
  run.branch = `unified/fix-${run._id}`;
  const saved = await event(d, filter, "publishing", "Patch validated. Opening a draft pull request.", { patch: proposal.edits, branch: run.branch, review: { approved: true, reason: review.reason } });
  if (!saved.matchedCount) return;
  // Persist the deterministic branch before any external write. A timeout can be reconciled by branch/PR identity.
  const existing = await api(`/git/ref/heads/${run.branch}`, { allow404: true });
  if (existing) throw fail("This run already has a branch. Refresh its GitHub status before retrying.");
  const tree = await api("/git/trees", { method: "POST", body: { base_tree: run.baseTree, tree: updated.map(file => ({ path: file.path, mode: "100644", type: "blob", content: file.content })) } });
  const commit = await api("/git/commits", { method: "POST", body: { message: `fix: ${run.issue.title.replace(/[\r\n]/g, " ").slice(0, 160)}`, tree: tree.sha, parents: [run.baseSha] } });
  // Recheck project ownership immediately before the first visible side effect.
  await liveProject(run, d);
  if (!await d.Run.exists({ ...filter, leaseUntil: { $gt: new Date() } })) return;
  await d.Run.updateOne(filter, { $set: { headSha: commit.sha } });
  await api("/git/refs", { method: "POST", body: { ref: `refs/heads/${run.branch}`, sha: commit.sha } });
  const pull = await findPull(api, run) || await api("/pulls", { method: "POST", body: { title: run.issue.title.slice(0, 180), body: prBody(run), head: run.branch, base: run.baseBranch, draft: true, maintainer_can_modify: true } });
  await event(d, filter, "awaiting_checks", "Draft PR created. Waiting for GitHub review and any automated checks.", { active: false, leaseUntil: null, prNumber: pull.number, prUrl: pull.html_url, headSha: commit.sha, publishedAt: new Date(), nextCheckAt: new Date(Date.now() + 60000) });
}
async function processRun(id, overrides = {}) {
  const d = deps(overrides);
  const token = randomUUID();
  const run = await d.Run.findOneAndUpdate({ _id: id, status: { $in: ["queued", "queued_fix"] }, active: true }, { $set: { status: "assessing", leaseToken: token, leaseUntil: new Date(Date.now() + 10 * 60000) } }, { new: false }).select("+installationId").lean();
  if (!run) return;
  const ask = d.ask;
  d.ask = options => ask({ ...options, model: run.model || process.env.GROQ_MODEL || "qwen/qwen3.8-27b" });
  const filter = { _id: id, leaseToken: token, active: true };
  try {
    await event(d, filter, run.status === "queued" ? "assessing" : "generating", run.status === "queued" ? "Reading repository context and assessing scope." : "Generating a bounded patch from the saved context.");
    if (run.status === "queued") await assessRun(run, d, filter); else await fixRun(run, d, filter);
  } catch (error) {
    const saved = await d.Run.findOne(filter).lean();
    await event(d, filter, "failed", cleanError(error), { active: false, leaseUntil: null, failedStage: saved?.status === "publishing" ? "pr" : run.status === "queued" ? "scope" : "patch" });
    if (saved && !saved.branch) await restoreWorkbench(saved, overrides);
  }
}
function checkState(run, checkRuns, statuses) {
  const checks = [...checkRuns.map(item => ({ name: item.name, status: item.status, conclusion: item.conclusion })), ...statuses.map(item => ({ name: item.context, status: item.state === "pending" ? "in_progress" : "completed", conclusion: item.state }))];
  const matching = run.requiredCheck ? checks.filter(item => item.name === run.requiredCheck) : checks;
  if (!matching.length) return run.requiredCheck
    ? { checks, status: "awaiting_checks", message: `Waiting for “${run.requiredCheck}” to appear on this commit.` }
    : { checks, status: "ready_for_review", message: "No automated checks were reported. Review the draft on GitHub before merging." };
  const failed = matching.filter(item => item.status === "completed" && item.conclusion !== "success");
  if (failed.length) return { checks, status: "needs_attention", message: `GitHub check ${failed.map(item => `“${item.name}” (${item.conclusion || "unknown"})`).join(", ")} needs attention.`, failedStage: "review" };
  if (matching.every(item => item.status === "completed" && item.conclusion === "success")) return { checks, status: "checks_passed", message: "Reported GitHub checks passed. Review and merge the draft on GitHub." };
  return { checks, status: "awaiting_checks", message: "GitHub checks are running." };
}
async function syncRun(id, overrides = {}) {
  const d = deps(overrides);
  const run = await d.Run.findById(id).select("+installationId").lean();
  if (!run || !run.branch || run.active || ["shipped", "cancelled"].includes(run.status)) return;
  const connection = await d.Connection.findOne({ projectId: run.projectId, userId: run.userId }).lean();
  if (!connection || connection.repositoryId !== run.repositoryId || connection.installationId !== run.installationId) throw fail("Reconnect this repository before refreshing its PR status.", 409);
  const { api } = await d.github.repositoryClient(run);
  const pull = run.prNumber ? await api(`/pulls/${run.prNumber}`) : await findPull(api, run);
  if (!pull) throw fail("No PR was found. A branch may have been created before the request failed. Inspect it on GitHub before assessing again.");
  let result;
  if (pull.merged_at) result = { status: "merged", message: "Merged on GitHub. Mark shipped after this fix reaches users." };
  else if (pull.state === "closed") result = { status: "closed", message: "The PR was closed without merging. No shipping emails were triggered." };
  else if (pull.head.sha !== run.headSha) result = { status: "needs_attention", message: "The PR head changed outside this run. Review its new changes on GitHub.", failedStage: "review" };
  else {
    const [checks, status] = await Promise.all([api(`/commits/${run.headSha}/check-runs?per_page=100&filter=latest`), api(`/commits/${run.headSha}/status?per_page=100`)]);
    result = checkState(run, checks.check_runs || [], status.statuses || []);
    if (result.status === "awaiting_checks" && Date.now() - new Date(run.publishedAt || run.createdAt).getTime() > 60 * 60000) result = { ...result, status: "needs_attention", message: "GitHub checks have not completed. Inspect the check output on the PR." };
  }
  const extra = { active: false, prNumber: pull.number, prUrl: pull.html_url, nextCheckAt: new Date(Date.now() + 60000), failedStage: result.failedStage || (result.status === "needs_attention" ? "review" : ""), ...(result.checks ? { checks: result.checks.slice(0, 100) } : {}) };
  if (run.status !== result.status || run.message !== result.message) await event(d, { _id: run._id, active: false, status: run.status }, result.status, result.message, extra);
  else await d.Run.updateOne({ _id: run._id, active: false, status: run.status }, { $set: extra });
  if (result.status === "closed") await restoreWorkbench(run, overrides);
}
async function recoverRun(id, overrides = {}) {
  const d = deps(overrides);
  const token = randomUUID();
  const run = await d.Run.findOneAndUpdate({ _id: id, status: "failed", active: false, branch: { $exists: true } }, { $set: { active: true, status: "publishing", leaseToken: token, leaseUntil: new Date(Date.now() + 10 * 60000) } }, { new: false }).select("+installationId").lean();
  if (!run) throw fail("Only a failed publication can be recovered.", 409);
  const filter = { _id: id, active: true, leaseToken: token };
  try {
    await liveProject(run, d);
    const { api } = await d.github.repositoryClient(run);
    let pull = await findPull(api, run);
    if (!pull) {
      const branch = await api(`/git/ref/heads/${run.branch}`, { allow404: true });
      if (!branch) {
        await event(d, filter, "closed", "No branch or PR was created. A fresh assessment can be started.", { active: false, leaseUntil: null });
        await restoreWorkbench(run, overrides);
        return;
      }
      if (!run.headSha || branch.object?.sha !== run.headSha) throw fail("The recovery branch changed. Inspect it on GitHub before taking further action.");
      if (!await d.Run.exists({ ...filter, leaseUntil: { $gt: new Date() } })) return;
      pull = await api("/pulls", { method: "POST", body: { title: run.issue.title.slice(0, 180), body: prBody(run), head: run.branch, base: run.baseBranch, draft: true, maintainer_can_modify: true } });
    }
    await event(d, filter, "awaiting_checks", "Recovered the draft PR. GitHub status will refresh shortly.", { active: false, leaseUntil: null, prNumber: pull.number, prUrl: pull.html_url, publishedAt: run.publishedAt || new Date(), nextCheckAt: new Date() });
  } catch (error) { await event(d, filter, "failed", cleanError(error), { active: false, leaseUntil: null, failedStage: "pr" }); throw error; }
}
async function restoreWorkbench(run, overrides = {}) {
  if (!run.workbenchManaged) return;
  const d = deps(overrides);
  await d.Project.updateOne({ _id: run.projectId, userId: run.userId, workbenchIssues: { $elemMatch: { _id: run.issueId, deleted: false, status: "in_progress", title: run.issue.title, description: { $in: run.issue.description ? [run.issue.description] : ["", null] } } } }, { $set: { "workbenchIssues.$.status": run.workbenchPreviousStatus || "todo" } });
}
async function markShipped(run, overrides = {}) {
  const d = deps(overrides);
  await syncRun(run._id, overrides);
  const latest = await d.Run.findById(run._id).lean();
  if (latest?.status !== "merged") throw fail("Only a merged PR can be marked shipped. Release the fix first, then try again.", 409);
  const project = await d.Project.findOneAndUpdate({ _id: run.projectId, userId: run.userId, workbenchIssues: { $elemMatch: { _id: run.issueId, deleted: false, title: run.issue.title, description: { $in: run.issue.description ? [run.issue.description] : ["", null] } } } }, { $set: { "workbenchIssues.$.status": "done" } }, { new: true });
  if (!project) throw fail("The linked issue changed or was removed. Review it in the workbench before marking it done.", 409);
  await event(d, { _id: run._id, status: "merged" }, "shipped", "Marked shipped. Existing opt-in shipping notifications will process this issue.", { active: false, shippedAt: new Date() });
}
let running = false;
async function tick(overrides = {}) {
  if (running) return;
  running = true;
  const d = deps(overrides);
  try {
    const expired = await d.Run.find({ active: true, status: { $in: working }, leaseUntil: { $lt: new Date() } }).limit(10).lean();
    for (const run of expired) {
      await event(d, { _id: run._id, active: true, leaseUntil: { $lt: new Date() } }, "failed", "The worker stopped before finishing. Refresh GitHub status to recover a PR before starting again.", { active: false, leaseUntil: null, failedStage: run.status === "publishing" ? "pr" : run.status === "generating" ? "patch" : "scope" });
      if (!run.branch) await restoreWorkbench(run, overrides);
    }
    const jobs = await d.Run.find({ status: { $in: ["queued", "queued_fix"] }, active: true }).sort({ createdAt: 1 }).limit(5).select("_id").lean();
    for (const job of jobs) await processRun(job._id, overrides);
    const polling = await d.Run.find({ status: { $in: watched }, prNumber: { $exists: true }, nextCheckAt: { $lte: new Date() } }).sort({ nextCheckAt: 1 }).limit(20).select("_id").lean();
    for (const job of polling) {
      try { await syncRun(job._id, overrides); }
      catch { await d.Run.updateOne({ _id: job._id }, { $set: { nextCheckAt: new Date(Date.now() + 15 * 60000), message: "GitHub status could not be refreshed. Check access or refresh manually." } }); }
    }
  } finally { running = false; }
}
function startPullRequestWorker() {
  const scan = () => tick().catch(() => console.error("Pull request worker could not complete its scan."));
  const timer = setInterval(scan, 15000); timer.unref(); scan();
  return () => clearInterval(timer);
}
module.exports = { processRun, syncRun, recoverRun, markShipped, checkState, prBody, tick, startPullRequestWorker, liveProject, restoreWorkbench };
