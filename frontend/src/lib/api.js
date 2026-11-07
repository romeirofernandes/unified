import { accessToken } from "./access-token.js";
const API_URL = (
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

export async function apiRequest(
  path,
  { uid, token, body, rawBody, headers, ...options } = {},
) {
  const bearer = token || await accessToken(uid);
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(20000),
    headers: {
      ...(/\.ngrok-free\.app(?::\d+)?$/.test(new URL(API_URL).host) ? { "ngrok-skip-browser-warning": "true" } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
      Authorization: `Bearer ${bearer}`,
    },
    ...(rawBody !== undefined
      ? { body: rawBody }
      : body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(
      data?.message || `Request failed (${response.status}). Please try again.`,
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
