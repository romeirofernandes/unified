import { apiRequest } from "./api.js";
import { forgetResource } from "./resource-cache.js";

export function parseSummary(text) {
  if (typeof text !== "string")
    throw new Error("The summary response was empty. Please try again.");
  const tldr = text.split("TLDR:")[1]?.split("KEY FEATURES")[0]?.trim();
  const features = text
    .split("KEY FEATURES TO IMPROVE/ADD:")[1]
    ?.split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[•*-]\s/.test(line))
    .map((line) => line.replace(/^[•*-]\s*/, ""));
  if (!tldr || !features)
    throw new Error(
      "The summary response wasn’t in the expected format. Please try again.",
    );
  return { timestamp: new Date().toISOString(), tldr, features };
}

export function readSummary(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return typeof data?.tldr === "string" &&
      Array.isArray(data.features) &&
      data.features.every((item) => typeof item === "string")
      ? data
      : null;
  } catch {
    return null;
  }
}

export async function generateFeedbackSummary(project, uid, signal) {
  const summary = await apiRequest(`/feedback/project/${encodeURIComponent(project._id)}/summary`, {
    method: "POST",
    uid,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(9 * 60 * 1000)]) : AbortSignal.timeout(9 * 60 * 1000),
  });
  forgetResource(`/workbench/${project._id}`, uid);
  return summary;
}
