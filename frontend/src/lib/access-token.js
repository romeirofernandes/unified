let provider = async () => null;
export function setAccessTokenProvider(next) { provider = next; }
export async function accessToken(uid) {
  const token = await provider(uid);
  if (!token) throw Object.assign(new Error("Sign in to continue."), { status: 401 });
  return token;
}
