const test = require("node:test");
const assert = require("node:assert/strict");
const { notificationState } = require("../services/pr-notifications");
const run = { _id: "run", projectId: "project", issueId: "issue", status: "shipped" };
const project = { _id: "project", shippingUpdatesEnabled: true, workbenchIssues: [{ _id: "issue", responseIds: ["first", "second"] }] };
const query = data => ({ select: () => ({ lean: async () => data }) });
test("notification progress reports opt-ins and delivery state without recipient addresses", async () => {
  let saved;
  const dependencies = { Feedback: { find: () => query([{ _id: "first", shippedIssueIds: ["issue"] }, { _id: "second", shippedIssueIds: [] }]) }, Delivery: { find: () => query([]) }, Run: { updateOne: async (_, update) => { saved = update.$set.notification; } } };
  let result = await notificationState(run, project, dependencies);
  assert.equal(result.status, "pending"); assert.equal(result.sent, 1); assert.equal(result.pending, 1); assert.equal(saved.total, 2);
  dependencies.Delivery.find = () => query([{ status: "unknown" }]);
  result = await notificationState(run, project, dependencies);
  assert.equal(result.status, "failed"); assert.match(result.message, /unknown/);
  dependencies.Feedback.find = () => query([{ _id: "first", shippedIssueIds: ["issue"] }, { _id: "second", shippedIssueIds: ["issue"] }]);
  result = await notificationState(run, project, dependencies);
  assert.equal(result.status, "sent"); assert.equal(result.sent, 2);
  assert.deepEqual(await notificationState({ ...run, notification: result }, { ...project, shippingUpdatesEnabled: false }, dependencies), result);
});
test("disabled settings and absent opt-ins never claim emails were sent", async () => {
  assert.equal((await notificationState(run, { ...project, shippingUpdatesEnabled: false })).status, "disabled");
  const result = await notificationState(run, project, { Feedback: { find: () => query([]) }, Run: { updateOne: async () => {} } });
  assert.equal(result.status, "empty"); assert.equal(result.sent, 0);
  assert.equal((await notificationState({ ...run, status: "merged" }, project)).status, "waiting");
});
