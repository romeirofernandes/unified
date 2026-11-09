const { createHash } = require("node:crypto");
const Feedback = require("../models/Feedback");
const Delivery = require("../models/DigestDelivery");
const Run = require("../models/PullRequestRun");
async function notificationState(run, project, dependencies = {}) {
  const d = { Feedback, Delivery, Run, ...dependencies };
  if (run.status !== "shipped") return { status: project.shippingUpdatesEnabled ? "waiting" : "disabled", total: 0, sent: 0, pending: 0, failed: 0, message: project.shippingUpdatesEnabled ? "Shipping updates are sent after this fix is marked shipped." : "Shipping emails are disabled for this project." };
  if (run.notification?.status === "sent") return run.notification;
  const issue = project.workbenchIssues?.find(item => String(item._id) === String(run.issueId));
  if (!project.shippingUpdatesEnabled) return { status: "disabled", total: 0, sent: 0, pending: 0, failed: 0, message: "Shipping emails are disabled for this project." };
  if (!issue || issue.deleted) return { status: "disabled", total: 0, sent: 0, pending: 0, failed: 0, message: "The linked issue was removed. No further shipping emails will be sent." };
  const responses = await d.Feedback.find({ projectId: project._id, _id: { $in: issue?.responseIds || [] }, subscriptionEmail: { $exists: true } }).select("_id shippedIssueIds").lean();
  const pending = responses.filter(item => !(item.shippedIssueIds || []).some(id => String(id) === String(run.issueId)));
  const ids = pending.map(item => createHash("sha256").update(`shipped:${project._id}:${run.issueId}:${item._id}`).digest("hex"));
  const failures = ids.length ? await d.Delivery.find({ _id: { $in: ids }, status: { $in: ["rejected", "unknown"] } }).select("status").lean() : [];
  const value = { status: !responses.length ? "empty" : failures.length ? "failed" : pending.length ? "pending" : "sent", total: responses.length, sent: responses.length - pending.length, pending: pending.length, failed: failures.length,
    message: !responses.length ? "No linked reporters opted in for email updates." : failures.some(item => item.status === "unknown") ? "Some delivery outcomes are unknown. Check email delivery before resending." : failures.length ? "Some emails were rejected. Delivery will be retried by the shipping worker." : pending.length ? `${pending.length} shipping ${pending.length === 1 ? "email is" : "emails are"} queued for delivery.` : `Shipping updates sent for ${responses.length} opted-in ${responses.length === 1 ? "response" : "responses"}.` };
  // Keep the last delivery result in the run history, without retaining recipient addresses.
  if (JSON.stringify(run.notification || {}) !== JSON.stringify(value)) await d.Run.updateOne({ _id: run._id, status: "shipped" }, { $set: { notification: value }, $push: { events: { $each: [{ at: new Date(), status: "shipped", stage: "notify", message: value.message }], $slice: -100 } } });
  return value;
}
module.exports = { notificationState };
