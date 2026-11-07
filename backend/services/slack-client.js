async function slackApi(token, method, params = {}, request = fetch) {
  const posting = method === "chat.postMessage";
  const url = new URL(`https://slack.com/api/${method}`);
  if (!posting) url.search = new URLSearchParams(params).toString();
  const response = await request(url.toString(), { method: posting ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(posting ? { "Content-Type": "application/json" } : {}) }, ...(posting ? { body: JSON.stringify(params) } : {}), signal: AbortSignal.timeout(20000), redirect: "error" });
  const data = response.ok ? await response.json() : null;
  if (!response.ok || !data?.ok) {
    const error = new Error(data?.error === "missing_scope" || data?.error === "invalid_auth" || data?.error === "token_revoked" ? "Reconnect Slack to grant channel access." : response.status === 429 ? "Slack is busy. Please try again shortly." : "Slack request failed. Check the connection and try again.");
    error.status = ["missing_scope", "invalid_auth", "token_revoked"].includes(data?.error) ? 409 : response.status === 429 ? 429 : 502;
    throw error;
  }
  return data;
}
async function listChannels(token, cursor = "", request = fetch) {
  const data = await slackApi(token, "conversations.list", { types: "public_channel,private_channel", exclude_archived: "true", limit: "200", ...(cursor ? { cursor } : {}) }, request);
  return { channels: data.channels.filter((channel) => !channel.is_archived && (!channel.is_private || channel.is_member)).map((channel) => ({ id: channel.id, name: channel.name, private: !!channel.is_private })).sort((a, b) => a.name.localeCompare(b.name)), nextCursor: data.response_metadata?.next_cursor || "" };
}
async function selectedChannel(token, id, request = fetch) {
  if (typeof id !== "string" || !/^[CG][A-Z0-9]{6,}$/.test(id)) { const error = new Error("Choose a Slack channel."); error.status = 400; throw error; }
  const { channel } = await slackApi(token, "conversations.info", { channel: id }, request);
  if (channel.is_archived || channel.is_im || channel.is_mpim || (channel.is_private && !channel.is_member)) { const error = new Error("Choose an active channel the app can post to."); error.status = 400; throw error; }
  return { id: channel.id, name: `#${channel.name}` };
}
module.exports = { slackApi, listChannels, selectedChannel };
