let keys;
async function verifyIdToken(token, { projectId = process.env.FIREBASE_PROJECT_ID, key } = {}) {
  if (!projectId) throw Object.assign(new Error("Firebase authentication is not configured."), { status: 503 });
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  keys ||= createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
  const { payload } = await jwtVerify(token, key || keys, {
    algorithms: ["RS256"], audience: projectId, issuer: `https://securetoken.google.com/${projectId}`,
    requiredClaims: ["sub", "exp", "iat", "auth_time"],
  });
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || payload.sub.length > 128 || !Number.isFinite(payload.auth_time) || payload.auth_time > now || payload.iat > now) throw new Error("Invalid Firebase identity.");
  return { ...payload, uid: payload.sub };
}

async function deleteIdentity(token, request = fetch) {
  if (!process.env.FIREBASE_API_KEY) throw Object.assign(new Error("Account deletion is not configured."), { status: 503 });
  const response = await request(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(20000),
  });
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  if (data?.error?.message === "USER_NOT_FOUND") return;
  throw Object.assign(new Error("Could not delete the sign-in account. Please retry."), { status: 502 });
}
module.exports = { verifyIdToken, deleteIdentity };
