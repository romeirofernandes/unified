const { createHash } = require("node:crypto");
const { decrypt } = require("./secret-storage");
function validateSlackWebhook(value) {
  if (typeof value !== "string" || !/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(value)) {
    const error = new Error("Enter a Slack incoming webhook URL from hooks.slack.com.");
    error.status = 400;
    throw error;
  }
  return value;
}
function digestText({ project, summary, count, test = false }) {
  const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${test ? "Test digest · " : ""}${project.name}\n${count} new response${count === 1 ? "" : "s"}\n\n${summary.tldr}\n\nWhat to address\n${summary.features.map((item) => `• ${item}`).join("\n")}\n\nView responses: ${base}/project/${project._id}/feedbacks`;
}
async function deliverDigest({ project, channel, summary, count, recipient, batchId, test = false }, request = fetch) {
  const text = digestText({ project, summary, count, test });
  let url, body, headers = { "Content-Type": "application/json" };
  if (channel === "slack") {
    url = validateSlackWebhook(decrypt(project.slackWebhookEncrypted));
    // Plain text blocks prevent feedback from creating mentions or Slack markup.
    body = { text: `Feedback digest for ${project.name}`.slice(0, 200), blocks: [{ type: "section", text: { type: "plain_text", text: text.slice(0, 2900), emoji: false } }] };
  } else {
    if (!process.env.RESEND_API_KEY || !process.env.DIGEST_EMAIL_FROM) throw new Error("Email delivery is not configured on the server.");
    url = "https://api.resend.com/emails";
    headers.Authorization = `Bearer ${process.env.RESEND_API_KEY}`;
    headers["Idempotency-Key"] = createHash("sha256").update(batchId).digest("hex");
    body = { from: process.env.DIGEST_EMAIL_FROM, to: [recipient], subject: `${test ? "[Test] " : ""}${project.name.replace(/[\r\n]/g, " ").slice(0, 120)} · feedback digest`, text };
  }
  const response = await request(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000), redirect: "error" });
  if (!response.ok) throw new Error(`${channel === "slack" ? "Slack" : "Email"} delivery failed (${response.status}). Check the connection and try again.`);
}
module.exports = { validateSlackWebhook, digestText, deliverDigest };
