const { createSign, randomBytes, createHash } = require("node:crypto");
const { fail, repositoryName } = require("./pr-policy");
const API = "https://api.github.com";
function configured() { return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET && process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_APP_SLUG && process.env.GITHUB_APP_CALLBACK_URL); }
const stateHash = value => createHash("sha256").update(value).digest("hex");
function authorization(existingState) {
  if (!configured()) throw fail("GitHub App connection is not configured on this server.", 503);
  const state = existingState || randomBytes(32).toString("hex");
  if (!/^[a-f0-9]{64}$/.test(state)) throw fail("Invalid authorization state.");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_APP_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.GITHUB_APP_CALLBACK_URL);
  url.searchParams.set("state", state);
  return { state, url: url.toString() };
}
async function request(path, token, { method = "GET", body, allow404 = false } = {}) {
  if (!path.startsWith("/") || path.startsWith("//")) throw fail("Invalid GitHub API path.");
  const response = await fetch(`${API}${path}`, { method, redirect: "error", signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (allow404 && response.status === 404) { await response.body?.cancel(); return null; }
  if (!response.ok) { await response.body?.cancel(); throw fail(response.status === 401 || response.status === 403 ? "GitHub access was denied. Check the app permissions and reconnect the repository." : response.status === 429 ? "GitHub is rate limited. Try again later." : "GitHub could not complete this operation. Refresh the run before retrying.", 502); }
  if (response.status === 204) return null;
  const chunks = []; let bytes = 0;
  for await (const chunk of response.body) { bytes += chunk.length; if (bytes > 2 * 1024 * 1024) throw fail("This repository response exceeds the supported size."); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const payload = [Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ iat: now - 30, exp: now + 540, iss: process.env.GITHUB_APP_ID })).toString("base64url")].join(".");
  const signer = createSign("RSA-SHA256"); signer.update(payload); signer.end();
  return `${payload}.${signer.sign(process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"), "base64url")}`;
}
async function installationToken(installationId, repositoryId) {
  if (!configured()) throw fail("GitHub App connection is not configured on this server.", 503);
  const data = await request(`/app/installations/${installationId}/access_tokens`, jwt(), { method: "POST", body: { repository_ids: [repositoryId], permissions: { contents: "write", pull_requests: "write", checks: "read", statuses: "read" } } });
  return data.token;
}
async function exchange(code, repository) {
  repositoryName(repository);
  const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", redirect: "error", signal: AbortSignal.timeout(20000), headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: process.env.GITHUB_APP_CLIENT_ID, client_secret: process.env.GITHUB_APP_CLIENT_SECRET, code, redirect_uri: process.env.GITHUB_APP_CALLBACK_URL }) });
  const auth = await response.json();
  if (!response.ok || !auth.access_token) throw fail("GitHub authorization failed. Start the connection again.");
  const userToken = auth.access_token;
  const repo = await request(`/repos/${repository}`, userToken);
  if (!repo.permissions?.push || repo.archived || repo.disabled) throw fail("Choose an active repository where you have write access.");
  // User-scoped installation lookup prevents linking an installation ID supplied by an attacker.
  for (let page = 1; page <= 5; page++) {
    const list = await request(`/user/installations?per_page=100&page=${page}`, userToken);
    for (const installation of list.installations || []) {
      if (String(installation.app_id) !== String(process.env.GITHUB_APP_ID) || installation.suspended_at) continue;
      for (let repoPage = 1; repoPage <= 10; repoPage++) {
        const repositories = await request(`/user/installations/${installation.id}/repositories?per_page=100&page=${repoPage}`, userToken);
        if (repositories.repositories?.some(item => item.id === repo.id)) {
          const token = await installationToken(installation.id, repo.id);
          const allowed = await request(`/repos/${repo.full_name}`, token);
          if (allowed.id !== repo.id) throw fail("Repository identity changed. Reconnect it.");
          return { repository: repo.full_name, repositoryId: repo.id, installationId: installation.id, defaultBranch: repo.default_branch };
        }
        if ((repositories.repositories || []).length < 100) break;
      }
    }
    if ((list.installations || []).length < 100) break;
  }
  throw Object.assign(fail("Install the Unified GitHub App on this repository first, then connect again."), { code: "GITHUB_INSTALL_REQUIRED" });
}
async function checkNames(connection) {
  const { api } = await repositoryClient(connection);
  const commit = await api(`/commits/${encodeURIComponent(connection.defaultBranch)}`);
  const [runs, statuses] = await Promise.all([api(`/commits/${commit.sha}/check-runs?per_page=100&filter=latest`), api(`/commits/${commit.sha}/status?per_page=100`)]);
  return [...new Set([...(runs.check_runs || []).map(item => item.name), ...(statuses.statuses || []).map(item => item.context)])].filter(name => typeof name === "string" && name.length <= 120 && !/[\x00-\x1f]/.test(name)).sort();
}
async function repositoryClient(connection) {
  const token = await installationToken(connection.installationId, connection.repositoryId);
  const root = `/repos/${repositoryName(connection.repository)}`;
  const api = (path, options) => request(root + path, token, options);
  const repo = await api("");
  if (repo.id !== connection.repositoryId || repo.archived || repo.disabled) throw fail("Repository identity or availability changed. Reconnect it.");
  return { api, repo };
}
module.exports = { configured, stateHash, authorization, exchange, repositoryClient, checkNames, request };
