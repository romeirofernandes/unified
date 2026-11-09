const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Project = require("../models/Project");
const Run = require("../models/PullRequestRun");
const Connection = require("../models/PullRequestConnection");
const Blob = require("../models/RepositoryBlob");
const workflow = require("../services/pr-workflow");
const { fingerprint } = require("../services/pr-policy");
const { sourceFile } = require("../services/pr-context");
const { createRouter } = require("../routes/pull-requests");
const { createRouter: callbackRouter } = require("../routes/github");
const { stateHash } = require("../services/pr-github");
let mongo, server, base, project, issue, connection;
const owner = new mongoose.Types.ObjectId();
const sha = "a".repeat(40), tree = "b".repeat(40), blobSha = "c".repeat(40), headSha = "d".repeat(40);
let calls, checkResult, pull, currentSha, answers, postFailure;
const files = [{ path: "src/Button.tsx", sha: blobSha, size: 25, content: '<button>Save</button>\n' }];
const fakeGithub = { configured: () => true, stateHash, authorization: () => ({ state: "a".repeat(64), url: "https://github.com/login/oauth/authorize?state=test" }), exchange: async () => ({ repository: "owner/repo", repositoryId: 1, installationId: 2, defaultBranch: "main" }), repositoryClient: async () => ({ api: async (path, options = {}) => {
  calls.push({ path, ...options });
  if (path.startsWith("/commits/main")) return { sha: currentSha, commit: { tree: { sha: tree } } };
  if (path === "/git/trees") return { sha: tree };
  if (path === "/git/commits") return { sha: headSha };
  if (path.startsWith("/git/ref/heads/")) return null;
  if (path === "/git/refs") return {};
  if (path.startsWith("/pulls?")) return pull ? [pull] : [];
  if (path === "/pulls" && options.method === "POST") { pull = { number: 7, html_url: "https://github.com/owner/repo/pull/7", state: "open", head: { sha: headSha, ref: options.body.head }, base: { ref: "main" } }; if (postFailure) throw new Error("timeout after creating PR"); return pull; }
  if (path === "/pulls/7") return pull;
  if (path.includes("/check-runs")) return { check_runs: checkResult };
  if (path.endsWith("/status?per_page=100")) return { statuses: [] };
  throw new Error(`Unexpected GitHub call: ${path}`);
} }) };
const dependencies = { github: fakeGithub, ask: async () => answers.shift(), selectContext: async () => ({ baseSha: sha, baseTree: tree, files }), sourceFile: async () => files[0] };
test.before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri());
  await Promise.all([Run.init(), Connection.init(), Blob.init()]);
  const app = express(); app.use(express.json()); app.use((req, res, next) => { req.user = { id: req.headers["x-user"] || String(owner) }; next(); });
  app.use("/pr", createRouter({ github: fakeGithub, workflow: { syncRun: id => workflow.syncRun(id, dependencies), markShipped: run => workflow.markShipped(run, dependencies) } }));
  app.use("/github", callbackRouter({ github: fakeGithub }));
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await mongo.stop(); });
test.beforeEach(async () => {
  await Promise.all([Project.deleteMany({}), Run.deleteMany({}), Connection.deleteMany({}), Blob.deleteMany({})]);
  project = await Project.create({ name: "Product", userId: owner, fields: [{ type: "text", label: "Feedback" }], workbenchIssues: [{ title: "Clarify the save button", description: "Use Save changes in the editor.", status: "todo" }] });
  issue = project.workbenchIssues[0];
  connection = await Connection.create({ projectId: project._id, userId: owner, repository: "owner/repo", repositoryId: 1, installationId: 2, defaultBranch: "main", requiredCheck: "tests", connectedAt: new Date() });
  calls = []; checkResult = []; pull = null; currentSha = sha; answers = []; postFailure = false;
});
async function api(path, body, user) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(user ? { "x-user": user } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function assessed() {
  const run = await Run.create({ projectId: project._id, userId: owner, issueId: issue._id, issue: { title: issue.title, description: issue.description, fingerprint: fingerprint(issue) }, acceptance: "The editor save button reads Save changes.", repository: connection.repository, repositoryId: 1, installationId: 2, baseBranch: "main", requiredCheck: "tests", status: "queued", active: true });
  answers = [{ suitable: true, category: "ui_copy", reason: "One existing label needs changing.", plan: ["Replace the label."] }];
  await workflow.processRun(run._id, dependencies);
  return Run.findById(run._id).select("+installationId").lean();
}
async function publish() {
  const run = await assessed();
  assert.equal(run.status, "eligible");
  assert.equal((await api(`/pr/${project._id}/runs/${run._id}/attempt`, {})).status, 202);
  answers = [{ edits: [{ path: files[0].path, before: "Save", after: "Save changes" }] }, { approved: true, reason: "Matches the acceptance criteria." }];
  await Promise.all([workflow.processRun(run._id, dependencies), workflow.processRun(run._id, dependencies)]);
  return Run.findById(run._id).select("+installationId").lean();
}
test("full lifecycle creates one draft, checks its exact head, and ships only after merge", async () => {
  const run = await publish();
  assert.equal(run.status, "awaiting_checks");
  assert.equal(calls.filter(call => call.path === "/pulls" && call.method === "POST").length, 1);
  assert.equal(calls.find(call => call.path === "/pulls" && call.method === "POST").body.draft, true);
  assert.equal((await Run.findById(run._id)).baseSha, sha);
  assert.equal((await Project.findById(project._id).select("+workbenchIssues")).workbenchIssues[0].status, "todo");
  await assert.rejects(() => workflow.markShipped(run, dependencies), /Only a merged/);
  checkResult = [{ name: "unrelated", status: "completed", conclusion: "success" }];
  await workflow.syncRun(run._id, dependencies); assert.equal((await Run.findById(run._id)).status, "awaiting_checks");
  checkResult = [{ name: "tests", status: "completed", conclusion: "success" }];
  await workflow.syncRun(run._id, dependencies); assert.equal((await Run.findById(run._id)).status, "checks_passed");
  pull.merged_at = new Date().toISOString(); pull.state = "closed";
  await workflow.markShipped(run, dependencies);
  assert.equal((await Run.findById(run._id)).status, "shipped");
  assert.equal((await Project.findById(project._id).select("+workbenchIssues")).workbenchIssues[0].status, "done");
});
test("ownership, snapshot consistency and one active job are enforced", async () => {
  const run = await assessed();
  assert.equal((await api(`/pr/${project._id}`, null, String(new mongoose.Types.ObjectId()))).status, 404);
  assert.equal((await api(`/pr/${project._id}/runs/${run._id}`, null, String(new mongoose.Types.ObjectId()))).status, 404);
  const responses = await Promise.all([api(`/pr/${project._id}/runs`, { issueId: String(issue._id), acceptance: "The save action should say Save changes." }), api(`/pr/${project._id}/runs`, { issueId: String(issue._id), acceptance: "The save action should say Save changes." })]);
  assert.deepEqual(responses.map(item => item.status).sort(), [202, 409]);
  await Run.updateMany({ active: true }, { $set: { active: false, status: "cancelled" } });
  await Project.updateOne({ _id: project._id }, { $set: { "workbenchIssues.0.description": "New scope" } });
  assert.equal((await api(`/pr/${project._id}/runs/${run._id}/attempt`, {})).status, 409);
});
test("moved bases and unsupported patches stop before GitHub writes", async () => {
  let run = await assessed();
  await api(`/pr/${project._id}/runs/${run._id}/attempt`, {}); currentSha = "e".repeat(40);
  await workflow.processRun(run._id, dependencies);
  assert.equal((await Run.findById(run._id)).status, "failed");
  assert.equal(calls.some(call => call.method === "POST"), false);
  currentSha = sha; run = await assessed(); await api(`/pr/${project._id}/runs/${run._id}/attempt`, {});
  answers = [{ edits: [{ path: "backend/auth.js", before: "a", after: "b" }] }];
  await workflow.processRun(run._id, dependencies);
  assert.equal((await Run.findById(run._id)).status, "failed");
  assert.equal(calls.some(call => call.method === "POST"), false);
});
test("publication timeouts recover the same PR, failures and closed PRs never ship", async () => {
  postFailure = true;
  const run = await publish(); assert.equal(run.status, "failed");
  await workflow.syncRun(run._id, dependencies);
  assert.equal((await Run.findById(run._id)).prNumber, 7);
  checkResult = [{ name: "tests", status: "completed", conclusion: "failure" }];
  await workflow.syncRun(run._id, dependencies); assert.equal((await Run.findById(run._id)).status, "needs_attention");
  pull.state = "closed";
  await workflow.syncRun(run._id, dependencies); assert.equal((await Run.findById(run._id)).status, "closed");
  await assert.rejects(() => workflow.markShipped(run, dependencies));
  assert.equal((await Project.findById(project._id).select("+workbenchIssues")).workbenchIssues[0].status, "todo");
});
test("cancellation revokes a running assessment before it can publish results", async () => {
  const run = await assessed(); await Run.updateOne({ _id: run._id }, { $set: { status: "queued", active: true } });
  const d = { ...dependencies, ask: async () => { await api(`/pr/${project._id}/runs/${run._id}/cancel`, {}); return { suitable: true, category: "ui_copy", reason: "Small fix", plan: ["Change label"] }; } };
  await workflow.processRun(run._id, d);
  assert.equal((await Run.findById(run._id)).status, "cancelled");
  assert.equal(calls.some(call => call.method === "POST"), false);
});
test("source cache is encrypted, reused by SHA and excludes credential-looking files", async () => {
  const run = { projectId: project._id, repositoryId: 1 }; let reads = 0;
  const api = async () => { reads++; return { encoding: "base64", size: files[0].content.length, content: Buffer.from(files[0].content).toString("base64") }; };
  assert.equal((await sourceFile(run, api, files[0])).content, files[0].content);
  await sourceFile(run, api, files[0]); assert.equal(reads, 1);
  assert.equal((await Blob.findOne({}).lean()).encrypted, undefined);
  assert.ok(!(await Blob.findOne({}).select("+encrypted")).encrypted.includes("Save"));
  await assert.rejects(() => sourceFile(run, async () => ({ encoding: "base64", content: Buffer.from("ghp_" + "x".repeat(30)).toString("base64") }), { ...files[0], sha: "f".repeat(40) }), /credentials/);
});
test("disconnect stops status access before an installation token is requested", async () => {
  const run = await publish(); await Connection.deleteMany({ projectId: project._id });
  const count = calls.length;
  await assert.rejects(() => workflow.syncRun(run._id, dependencies), /Reconnect/);
  assert.equal(calls.length, count);
});
test("recovery never duplicates an existing PR and releases a failed unpublished run", async () => {
  postFailure = true; const run = await publish();
  await workflow.recoverRun(run._id, dependencies);
  assert.equal((await Run.findById(run._id)).prNumber, 7);
  assert.equal(calls.filter(call => call.path === "/pulls" && call.method === "POST").length, 1);
  await Run.updateOne({ _id: run._id }, { $set: { status: "failed", active: false }, $unset: { prNumber: 1, prUrl: 1 } }); pull = null;
  await workflow.recoverRun(run._id, dependencies);
  assert.equal((await Run.findById(run._id)).status, "closed");
});
test("changed issue text prevents an old merged PR from resolving a different request", async () => {
  const run = await publish(); pull.merged_at = new Date().toISOString(); pull.state = "closed";
  await Project.updateOne({ _id: project._id }, { $set: { "workbenchIssues.0.title": "An unrelated new request" } });
  await assert.rejects(() => workflow.markShipped(run, dependencies), /issue changed/);
  assert.equal((await Project.findById(project._id).select("+workbenchIssues")).workbenchIssues[0].status, "todo");
});
test("skipped, cancelled and ambiguous named checks cannot count as verification", () => {
  for (const conclusion of ["skipped", "neutral", "cancelled", "failure", "timed_out"]) assert.equal(workflow.checkState({ requiredCheck: "tests" }, [{ name: "tests", status: "completed", conclusion }], []).status, "needs_attention");
  assert.equal(workflow.checkState({ requiredCheck: "tests" }, [{ name: "tests", status: "completed", conclusion: "success" }, { name: "tests", status: "completed", conclusion: "failure" }], []).status, "needs_attention");
});
test("GitHub callbacks require an expiring single-use state bound to the project", async () => {
  const state = "a".repeat(64);
  await Connection.updateOne({ _id: connection._id }, { $set: { stateHash: stateHash(state), stateUntil: new Date(Date.now() + 60000), pendingRepository: "owner/repo", pendingCheck: "tests" } });
  let result = await fetch(`${base}/github/callback?state=${state}&code=valid`, { redirect: "manual" });
  assert.equal(result.status, 302); assert.match(result.headers.get("location"), /github=connected/);
  result = await fetch(`${base}/github/callback?state=${state}&code=valid`, { redirect: "manual" }); assert.equal(result.status, 400);
  const data = (await api(`/pr/${project._id}`)).data;
  assert.equal(data.connection.requiredCheck, "tests"); assert.equal(data.connection.installationId, undefined);
});
