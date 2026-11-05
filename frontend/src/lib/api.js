const API_URL = (
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

export async function apiRequest(
  path,
  { uid, body, headers, ...options } = {},
) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(20000),
    headers: {
      ...(uid ? { "firebase-uid": uid } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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
