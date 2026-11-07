const { createHash, randomBytes } = require("node:crypto");
const { validateSlackWebhook } = require("./digest-delivery");
const configured = () => !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_REDIRECT_URI);
const stateHash = (state) => createHash("sha256").update(state).digest("hex");
function authorization() {
  const state = randomBytes(32).toString("hex");
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.search = new URLSearchParams({ client_id: process.env.SLACK_CLIENT_ID, scope: "incoming-webhook,channels:read,groups:read,chat:write,chat:write.public", redirect_uri: process.env.SLACK_REDIRECT_URI, state }).toString();
  return { state, url: url.toString() };
}
async function exchangeCode(code, request = fetch) {
  const response = await request("https://slack.com/api/oauth.v2.access", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.SLACK_CLIENT_ID, client_secret: process.env.SLACK_CLIENT_SECRET, redirect_uri: process.env.SLACK_REDIRECT_URI, code }),
    signal: AbortSignal.timeout(20000), redirect: "error",
  });
  if (!response.ok) throw new Error("Slack authorization failed.");
  const data = await response.json();
  if (!data.ok || !data.incoming_webhook?.url) throw new Error("Slack did not authorize a channel.");
  const scopes = new Set((data.scope || "").split(","));
  return { token: scopes.has("channels:read") && scopes.has("chat:write") && scopes.has("chat:write.public") ? data.access_token : null, channelId: data.incoming_webhook.channel_id || null, webhook: validateSlackWebhook(data.incoming_webhook.url), workspace: String(data.team?.name || "Slack workspace").slice(0, 200), channel: String(data.incoming_webhook.channel || "").slice(0, 200) };
}
module.exports = { configured, stateHash, authorization, exchangeCode };
