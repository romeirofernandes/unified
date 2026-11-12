const { slackApi } = require("./slack-client");
const { digestHtml, slackDigest } = require("./digest-format");
const { emailFrom, emailTransport, emailReady, sendSmtp } = require("./email-transport");
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
    body = slackDigest({ project, summary, count, test });
    if (project.slackBotTokenEncrypted && project.slackChannelId) {
      const digestId = createHash("sha256").update(batchId || text).digest("hex");
      await slackApi(decrypt(project.slackBotTokenEncrypted), "chat.postMessage", { ...body, channel: project.slackChannelId, client_msg_id: `${digestId.slice(0,8)}-${digestId.slice(8,12)}-4${digestId.slice(13,16)}-8${digestId.slice(17,20)}-${digestId.slice(20,32)}`, parse: "none" }, request);
      return;
    }
    url = validateSlackWebhook(decrypt(project.slackWebhookEncrypted));
  } else {
    if (!emailReady()) throw Object.assign(new Error("Email delivery is not configured on the server."), { deliveryRejected: true });
    const subject = `${test ? "[Test] " : ""}${project.name.replace(/[\r\n]/g, " ").slice(0, 120)} · feedback digest`;
    if (emailTransport() === "smtp") return sendSmtp({ recipient, subject, text, html: digestHtml({ project, summary, count, test }), batchId });
    url = "https://api.resend.com/emails";
    headers.Authorization = `Bearer ${process.env.RESEND_API_KEY}`;
    headers["Idempotency-Key"] = createHash("sha256").update(batchId).digest("hex");
    body = { from: emailFrom(), to: [recipient], subject, text, html: digestHtml({ project, summary, count, test }) };
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000), redirect: "error" });
    if (response.ok) return;
    // Resend honours the same idempotency key, including across transient retries.
    if (channel === "email" && !attempt && [429, 500, 502, 503, 504].includes(response.status)) {
      const seconds = Number(response.headers?.get("retry-after") || 1);
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, Math.min(5, Math.max(1, Number.isFinite(seconds) ? seconds : 1)) * 1000));
      continue;
    }
    throw Object.assign(new Error(`${channel === "slack" ? "Slack" : "Email"} delivery failed (${response.status}). Check the connection and try again.`), { deliveryRejected: response.status < 500 });
  }
}
module.exports = { validateSlackWebhook, digestText, deliverDigest };
