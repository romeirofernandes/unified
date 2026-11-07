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

test("disabled, deleted and revoked Firebase sessions fail live account verification", async () => {
  const { assertActiveIdentity } = require("../services/firebase-identity");
  const previous = process.env.FIREBASE_API_KEY;
  process.env.FIREBASE_API_KEY = "public-test-key";
  try {
    const claims = { uid: "owner", auth_time: 100 };
    for (const user of [null, { localId: "other" }, { localId: "owner", disabled: true }, { localId: "owner", validSince: "101" }]) {
      await assert.rejects(assertActiveIdentity(claims, "token", async () => ({ ok: true, json: async () => ({ users: user ? [user] : [] }) })));
    }
    await assertActiveIdentity(claims, "token", async () => ({ ok: true, json: async () => ({ users: [{ localId: "owner", validSince: "99" }] }) }));
  } finally { if (previous === undefined) delete process.env.FIREBASE_API_KEY; else process.env.FIREBASE_API_KEY = previous; }
});
test("only a signed identity can resume its own deletion tombstone", async () => {
  const { createIdentity } = require("../middleware/identity");
  const res = { status(code) { this.code = code; return this; }, json() {} };
  let allowed = 0, checked = 0;
  const dependencies = { verify: async () => ({ uid: "owner" }), active: async () => { checked++; throw new Error("deleted identity"); }, users: { exists: async filter => filter.firebaseUid === "owner" } };
  await createIdentity(dependencies)({ headers: { authorization: "Bearer signed-token" } }, res, () => allowed++);
  assert.equal(res.code, 401); assert.equal(allowed, 0);
  await createIdentity({ ...dependencies, forDeletion: true })({ headers: { authorization: "Bearer signed-token" } }, res, () => allowed++);
  assert.equal(allowed, 1); assert.equal(checked, 1);
  await createIdentity({ ...dependencies, forDeletion: true, verify: async () => { throw new Error("bad signature"); } })({ headers: { authorization: "Bearer forged-token" } }, res, () => allowed++);
  assert.equal(allowed, 1);
});
