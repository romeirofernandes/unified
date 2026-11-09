const test = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, verify } = require("node:crypto");
const github = require("../services/pr-github");
const originalFetch = global.fetch;
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const settings = { GITHUB_APP_ID: "123", GITHUB_APP_SLUG: "unified-test", GITHUB_APP_CLIENT_ID: "client", GITHUB_APP_CLIENT_SECRET: "test-only", GITHUB_APP_CALLBACK_URL: "http://localhost/github/callback", GITHUB_APP_PRIVATE_KEY: keys.privateKey.export({ type: "pkcs8", format: "pem" }) };
const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
test.before(() => Object.assign(process.env, settings));
test.after(() => { global.fetch = originalFetch; for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
test("installation tokens are short-lived JWT-authenticated and scoped to one repository", async () => {
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    if (url.endsWith("/access_tokens")) {
      const token = options.headers.Authorization.slice(7); const [header, payload, signature] = token.split(".");
      assert.equal(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), keys.publicKey, Buffer.from(signature, "base64url")), true);
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
      assert.equal(claims.iss, "123"); assert.ok(claims.exp - claims.iat <= 600);
      assert.deepEqual(JSON.parse(options.body).repository_ids, [44]);
      assert.deepEqual(JSON.parse(options.body).permissions, { contents: "write", pull_requests: "write", checks: "read", statuses: "read" });
      return Response.json({ token: "installation-test-token" });
    }
    assert.equal(options.headers.Authorization, "Bearer installation-test-token");
    return Response.json({ id: 44, archived: false });
  };
  await github.repositoryClient({ repository: "owner/repo", repositoryId: 44, installationId: 9 });
  assert.equal(calls, 2);
});
test("OAuth requires user write access and an installation of our own app on that repo", async () => {
  const requested = [];
  global.fetch = async (url, options) => {
    requested.push(url);
    if (url === "https://github.com/login/oauth/access_token") return Response.json({ access_token: "user-test-token" });
    if (url === "https://api.github.com/repos/owner/repo") return Response.json({ id: 44, full_name: "owner/repo", default_branch: "main", permissions: { push: true } });
    if (url.includes("/user/installations?")) return Response.json({ installations: [{ id: 9, app_id: 999 }, { id: 10, app_id: 123 }] });
    if (url.includes("/user/installations/10/repositories?")) return Response.json({ repositories: [{ id: 44 }] });
    if (url.endsWith("/access_tokens")) { assert.match(url, /installations\/10\//); return Response.json({ token: "installation-test-token" }); }
    throw new Error(`Unexpected ${url} ${options.method}`);
  };
  const result = await github.exchange("code", "owner/repo");
  assert.equal(result.installationId, 10); assert.equal(result.repositoryId, 44);
  assert.ok(!requested.some(url => url.includes("/user/installations/9/")));
  global.fetch = async url => url.includes("access_token") ? Response.json({ access_token: "user-test-token" }) : Response.json({ id: 44, permissions: { push: false } });
  await assert.rejects(() => github.exchange("code", "owner/repo"), /write access/);
});
test("provider errors never expose response credentials or accept API URL overrides", async () => {
  global.fetch = async () => Response.json({ message: "secret-provider-response" }, { status: 403 });
  await assert.rejects(() => github.request("/repos/owner/repo", "token"), error => error.status === 502 && !error.message.includes("secret-provider-response"));
  await assert.rejects(() => github.request("//attacker.invalid/path", "token"), /Invalid GitHub/);
  const auth = github.authorization();
  assert.match(auth.state, /^[a-f0-9]{64}$/); assert.equal(new URL(auth.url).origin, "https://github.com");
});
