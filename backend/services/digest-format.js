const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const plain = (value) => String(value).replace(/\*\*/g, "");
function digestLinks(project) {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  const origin = new URL(base);
  if (!["http:", "https:"].includes(origin.protocol)) throw new Error("Invalid frontend origin.");
  return { responses: new URL(`/project/${encodeURIComponent(project._id)}/feedbacks`, origin).toString(), settings: new URL(`/dashboard/integrations?project=${encodeURIComponent(project._id)}`, origin).toString() };
}
function digestHtml({ project, summary, count, test = false }) {
  const links = digestLinks(project);
  const e = escapeHtml;
  const items = summary.features.map((feature, index) => `<tr><td valign="top" width="32" style="padding:12px 0;border-bottom:1px solid #e4e1d9;color:#8a877f;font:12px/24px monospace">${String(index + 1).padStart(2, "0")}</td><td style="padding:12px 0;border-bottom:1px solid #e4e1d9;font:14px/24px Arial,sans-serif;color:#292923">${e(plain(feature))}</td></tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Feedback digest</title></head><body style="margin:0;padding:0;background:#f5f4ef;color:#292923"><div style="display:none;max-height:0;overflow:hidden">${e(`${count} new responses for ${project.name}. ${plain(summary.tldr).slice(0, 120)}`)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f4ef"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 0 24px;font:28px Georgia,serif;letter-spacing:-1px">unified<span style="color:#5476b7">.</span></td></tr>
<tr><td style="background:#fcfbf8;border:1px solid #dedbd2;border-radius:10px;padding:32px 28px">
<p style="margin:0 0 12px;color:#6b6961;font:11px/18px Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase">${test ? "Test digest" : "Feedback digest"}</p>
<h1 style="margin:0 0 16px;font:normal 32px/1.2 Georgia,serif;letter-spacing:-1px;overflow-wrap:anywhere">${e(project.name)}</h1>
<p style="margin:0 0 28px"><span style="display:inline-block;background:#e8edf7;border:1px solid #d7e0f1;border-radius:4px;padding:5px 9px;color:#3e5c8d;font:12px/18px Arial,sans-serif">${count} new response${count === 1 ? "" : "s"}</span></p>
<p style="margin:0 0 10px;color:#77746d;font:11px/18px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">Overview</p>
<p style="margin:0 0 28px;font:15px/27px Arial,sans-serif;white-space:pre-line">${e(plain(summary.tldr))}</p>
${items ? `<p style="margin:0 0 4px;color:#77746d;font:11px/18px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">What to address</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px">${items}</table>` : ""}
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#5476b7" style="border-radius:5px"><a href="${e(links.responses)}" style="display:inline-block;padding:12px 18px;color:#fff;text-decoration:none;font:bold 13px/20px Arial,sans-serif">View responses &rarr;</a></td></tr></table>
</td></tr><tr><td style="padding:20px 2px;color:#77746d;font:12px/21px Arial,sans-serif">${test ? "This is a sample. Your scheduled digests use new feedback." : "New feedback, summarized for your team."}<br><a href="${e(links.settings)}" style="color:#68665f;text-decoration:underline">Manage digest preferences</a></td></tr>
</table></td></tr></table></body></html>`;
}
function slackDigest({ project, summary, count, test = false }) {
  const links = digestLinks(project);
  const text = (value, max = 2900) => ({ type: "plain_text", text: plain(value).slice(0, max), emoji: false });
  const blocks = [
    { type: "header", text: text(project.name, 150) },
    { type: "context", elements: [text(`${test ? "Test digest" : "Feedback digest"} · ${count} new response${count === 1 ? "" : "s"}`)] },
    { type: "divider" },
    { type: "section", text: text(summary.tldr) },
  ];
  if (summary.features.length) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: "*What to address*" } });
    // Separate blocks preserve every action without truncating the entire digest.
    for (const [index, feature] of summary.features.slice(0, 40).entries()) blocks.push({ type: "section", text: text(`${String(index + 1).padStart(2, "0")}   ${feature}`) });
  }
  blocks.push({ type: "actions", elements: [{ type: "button", text: { type: "plain_text", text: "View responses" }, url: links.responses }] });
  return { text: `Unified feedback digest · ${count} new responses`, blocks, unfurl_links: false, unfurl_media: false };
}
module.exports = { digestHtml, slackDigest, digestLinks };
