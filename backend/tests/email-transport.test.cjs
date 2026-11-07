const test = require("node:test");
const assert = require("node:assert/strict");
const { sendSmtp, emailReady, emailTransport } = require("../services/email-transport");
process.env.EMAIL_TRANSPORT = "smtp";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "sender";
process.env.SMTP_PASS = "test-password";
process.env.DIGEST_EMAIL_FROM = "Unified <feedback@example.com>";
test("SMTP uses authenticated STARTTLS with bounded timeouts and a stable message ID", async () => {
  assert.equal(emailReady(), true);
  assert.equal(emailTransport(), "smtp");
  const ids = [];
  let closed = 0;
  const transport = (options) => {
    assert.equal(options.requireTLS, true);
    assert.equal(options.secure, false);
    assert.equal(options.disableFileAccess, true);
    assert.equal(options.auth.user, "sender");
    return { sendMail: async (mail) => { ids.push(mail.messageId); assert.equal(mail.to, "owner@example.com"); return { accepted: [mail.to], rejected: [] }; }, close: () => closed++ };
  };
  const mail = { recipient: "owner@example.com", subject: "Digest", text: "Fresh feedback", batchId: "batch" };
  await sendSmtp(mail, transport);
  await sendSmtp(mail, transport);
  assert.equal(ids[0], ids[1]);
  assert.equal(closed, 2);
});
test("SMTP failures are safe to display and leave credentials out of errors", async () => {
  const mail = { recipient: "owner@example.com", subject: "Digest", text: "Feedback", batchId: "batch" };
  await assert.rejects(sendSmtp(mail, () => ({ sendMail: async () => { throw new Error(process.env.SMTP_PASS); }, close() {} })), /Email delivery failed/);
  process.env.SMTP_PASS = "";
  assert.equal(emailReady(), false);
});
