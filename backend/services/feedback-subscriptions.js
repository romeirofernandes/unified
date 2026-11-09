const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const { deliverOnce } = require("./deliver-once");
const { emailReady, emailTransport, emailFrom, sendSmtp } = require("./email-transport");
const { createHash } = require("node:crypto");

function validateSubscription(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim())) throw Object.assign(new Error("Enter a valid email for shipping updates, or leave it blank."), { status: 400 });
  return value.trim().toLowerCase();
}
async function sendUpdate({ recipient, project, issue, batchId }, request = fetch) {
  if (!emailReady()) throw Object.assign(new Error("Email delivery is not configured."), { deliveryRejected: true });
  const subject = `${project.name.replace(/[\r\n]/g, " ").slice(0, 120)} · your request shipped`;
  const text = `Thanks for your feedback on ${project.name}.\n\nWe’ve shipped: ${issue.title}\n\nYou’re receiving this update because you asked to be notified when your request ships.`;
  if (emailTransport() === "smtp") return sendSmtp({ recipient, subject, text, batchId });
  const response = await request("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Idempotency-Key": createHash("sha256").update(batchId).digest("hex") }, body: JSON.stringify({ from: emailFrom(), to: [recipient], subject, text }), signal: AbortSignal.timeout(20000), redirect: "error" });
  if (!response.ok) throw Object.assign(new Error("Shipping update delivery failed."), { deliveryRejected: response.status < 500 });
}
async function processShippedUpdates(project, send = sendUpdate) {
  if (!project.shippingUpdatesEnabled) return;
  for (const issue of project.workbenchIssues || []) {
    if (issue.deleted || issue.status !== "done" || !issue.responseIds?.length) continue;
    const responses = await Feedback.find({ projectId: project._id, _id: { $in: issue.responseIds }, subscriptionEmail: { $exists: true }, shippedIssueIds: { $ne: issue._id } }).select("+subscriptionEmail");
    for (const response of responses) {
      try {
        await deliverOnce({ recipient: response.subscriptionEmail, project, issue, batchId: `shipped:${project._id}:${issue._id}:${response._id}` }, send);
        await Feedback.updateOne({ _id: response._id, projectId: project._id }, { $addToSet: { shippedIssueIds: issue._id } });
      } catch { console.error("Shipping update could not be delivered."); }
    }
  }
}
let running = false;
function startShippingWorker() {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const projects = Project.find({ shippingUpdatesEnabled: true, workbenchIssues: { $elemMatch: { status: "done", deleted: false, "responseIds.0": { $exists: true } } } }).select("name shippingUpdatesEnabled +workbenchIssues").cursor();
      for await (const project of projects) await processShippedUpdates(project);
    } catch { console.error("Shipping update scan failed."); }
    finally { running = false; }
  };
  const timer = setInterval(tick, 60000);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
module.exports = { validateSubscription, sendUpdate, processShippedUpdates, startShippingWorker };
