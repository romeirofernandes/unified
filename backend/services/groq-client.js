let nextKey = 0;

async function groqRequest(path, { headers = {}, body, signal }) {
  const keys = [
    ...new Set(
      (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
        .split(/[\s,]+/)
        .filter(Boolean),
    ),
  ];
  if (!keys.length) {
    const error = new Error(
      "AI generation is not configured for this environment.",
    );
    error.status = 503;
    throw error;
  }
  const start = nextKey++ % keys.length;
  const timeout = AbortSignal.timeout(45000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const response = await fetch(`https://api.groq.com/openai/v1/${path}`, {
      method: "POST",
      signal: requestSignal,
      headers: {
        ...headers,
        Authorization: `Bearer ${keys[(start + attempt) % keys.length]}`,
      },
      body,
    });
    if (
      [401, 429, 500, 502, 503, 504].includes(response.status) &&
      attempt + 1 < keys.length
    ) {
      await response.body?.cancel();
      continue;
    }
    if (!response.ok) {
      if (response.status === 400) {
        const details = await response.json().catch(() => null);
        if (details?.error?.code === "json_validate_failed") {
          const error = new Error("Groq could not produce the required structured response. Try the assessment again.");
          error.status = 502;
          error.code = "json_validate_failed";
          throw error;
        }
      }
      const guidance = {
        400: "Groq rejected the AI request. Check the model and request limits.",
        401: "Groq rejected the API key. Update the backend AI credentials.",
        403: "Groq denied access to this model. Check the account permissions.",
        413: "The repository context exceeded Groq’s request limit. Narrow the issue to a smaller component.",
        429: "Groq’s rate limit was reached. Wait a minute before assessing again.",
      };
      const requestId = response.headers.get("x-request-id");
      const reference = requestId && /^[a-zA-Z0-9_-]{1,100}$/.test(requestId) ? ` Request: ${requestId}.` : "";
      if (!response.bodyUsed) await response.body?.cancel();
      const error = new Error(`${guidance[response.status] || "Groq is temporarily unavailable. Try again shortly."} (HTTP ${response.status}).${reference}`);
      error.status = 502;
      throw error;
    }
    return response.json();
  }
}

async function groqJson({ messages, maxTokens = 4096, signal, schema, onRetry, model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b" }) {
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await groqRequest("chat/completions", {
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          ...(schema ? { temperature: 0, ...(model === "qwen/qwen3.8-27b" ? { reasoning_effort: "none" } : {}) } : {}),
          max_completion_tokens: maxTokens,
          response_format: schema ? { type: "json_schema", json_schema: { name: "response", strict: true, schema } } : { type: "json_object" },
          messages,
        }),
      });
      break;
    } catch (error) {
      if (!schema || attempt || error.code !== "json_validate_failed") throw error;
      await onRetry?.("Groq returned malformed structured output. Retrying this AI request once.");
    }
  }
  try {
    return JSON.parse(result.choices?.[0]?.message?.content);
  } catch {
    throw new Error("The AI response was invalid. Please try again.");
  }
}
module.exports = { groqJson, groqRequest };
