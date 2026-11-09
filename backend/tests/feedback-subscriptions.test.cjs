const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Feedback = require("../models/Feedback");
const { validateSubscription, processShippedUpdates } = require("../services/feedback-subscriptions");
let mongo;
test.before(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
test.after(async () => { await mongoose.disconnect(); await mongo?.stop(); });
test("subscription is optional and validates explicit email consent", () => {
  assert.equal(validateSubscription(undefined), undefined);
  assert.equal(validateSubscription(""), undefined);
  assert.equal(validateSubscription(" User@Example.com "), "user@example.com");
  for (const value of [true, {}, "invalid", "a@b.com\nBcc: other@example.com"]) assert.throws(() => validateSubscription(value), { status: 400 });
});
test("only subscribed, linked responses in this project receive one update per issue", async () => {
  const projectId = new mongoose.Types.ObjectId(), issueId = new mongoose.Types.ObjectId();
  const create = (data) => Feedback.create({ projectId, formAnswers: { text: "Feedback" }, ...data });
  const subscribed = await create({ subscriptionEmail: "user@example.com" });
  const anonymous = await create({});
  const unlinked = await create({ subscriptionEmail: "unlinked@example.com" });
  const other = await create({ projectId: new mongoose.Types.ObjectId(), subscriptionEmail: "other@example.com" });
  const issue = { _id: issueId, title: "Search", status: "todo", responseIds: [subscribed._id, anonymous._id, other._id] };
  const project = { _id: projectId, name: "Product", shippingUpdatesEnabled: true, workbenchIssues: [issue] };
  const sends = [];
  const send = async input => { sends.push(input.recipient); };
  await processShippedUpdates(project, send); assert.equal(sends.length, 0);
  issue.status = "done"; project.shippingUpdatesEnabled = false;
  await processShippedUpdates(project, send); assert.equal(sends.length, 0);
  project.shippingUpdatesEnabled = true; issue.deleted = true;
  await processShippedUpdates(project, send); assert.equal(sends.length, 0);
  issue.deleted = false;
  await Promise.all([processShippedUpdates(project, send), processShippedUpdates(project, send)]);
  await processShippedUpdates(project, send);
  issue.status = "todo"; await processShippedUpdates(project, send);
  issue.status = "done"; await processShippedUpdates(project, send);
  assert.deepEqual(sends, ["user@example.com"]);
  assert.equal((await Feedback.findById(subscribed._id).lean()).subscriptionEmail, undefined);
  assert.equal((await Feedback.findById(unlinked._id)).shippedIssueIds.length, 0);
});
test("definitive rejection retries, uncertain delivery does not send twice", async () => {
  const projectId = new mongoose.Types.ObjectId();
  for (const rejected of [true, false]) {
    const response = await Feedback.create({ projectId, formAnswers: {}, subscriptionEmail: "retry@example.com" });
    const project = { _id: projectId, name: "Product", shippingUpdatesEnabled: true, workbenchIssues: [{ _id: new mongoose.Types.ObjectId(), status: "done", responseIds: [response._id] }] };
    let calls = 0;
    const send = async () => { calls++; if (calls === 1) throw Object.assign(new Error("Failed"), { deliveryRejected: rejected }); };
    await processShippedUpdates(project, send); await processShippedUpdates(project, send);
    assert.equal(calls, rejected ? 2 : 1);
  }
});
