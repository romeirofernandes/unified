const nodemailer = require("nodemailer");
const { createHash } = require("node:crypto");
function emailTransport() {
  return process.env.EMAIL_TRANSPORT || (process.env.SMTP_HOST ? "smtp" : "resend");
}
function emailReady() {
  if (!process.env.DIGEST_EMAIL_FROM) return false;
  return emailTransport() === "smtp"
    ? !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS)
    : emailTransport() === "resend" && !!process.env.RESEND_API_KEY;
}
async function sendSmtp({ recipient, subject, text, batchId }, createTransport = nodemailer.createTransport) {
  const port = Number(process.env.SMTP_PORT);
  if (!emailReady() || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Email delivery is not configured on the server.");
  const transport = createTransport({
    host: process.env.SMTP_HOST, port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({ from: process.env.DIGEST_EMAIL_FROM, to: recipient, subject, text, messageId: `<${createHash("sha256").update(batchId).digest("hex")}@unified.digest>` });
    if (!result.accepted?.length || result.rejected?.length) throw new Error("SMTP recipient rejected");
  } catch { throw new Error("Email delivery failed. Check the SMTP connection and try again."); }
  finally { transport.close(); }
}
module.exports = { emailTransport, emailReady, sendSmtp };
