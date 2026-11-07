const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyIdToken } = require("../services/firebase-identity");

test("owner identity requires a signed, current token for this Firebase project", async () => {
  const { generateKeyPair, SignJWT } = await import("jose");
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const now = Math.floor(Date.now() / 1000);
  const sign = (claims = {}) => new SignJWT({ sub: "real-owner", aud: "our-project", iss: "https://securetoken.google.com/our-project", iat: now, auth_time: now, exp: now + 3600, ...claims }).setProtectedHeader({ alg: "RS256" }).sign(privateKey);
  const options = { projectId: "our-project", key: publicKey };
  assert.equal((await verifyIdToken(await sign(), options)).uid, "real-owner");
  for (const claims of [{ aud: "other-project" }, { exp: now - 1 }, { iss: "attacker" }, { auth_time: now + 60 }, { sub: "" }]) await assert.rejects(verifyIdToken(await sign(claims), options));
  await assert.rejects(verifyIdToken("forged-owner-uid", options));
});
test("a UID header alone never grants owner access", async () => {
  const auth = require("../middleware/auth");
  const res = { status(code) { this.code = code; return this; }, json() {} };
  await auth({ headers: { "firebase-uid": "stolen-owner" } }, res, () => assert.fail("must not authorize"));
  assert.equal(res.code, 401);
});
