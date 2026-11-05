import { useState } from "react";
import { generateFeedbackSummary, readSummary } from "@/lib/feedback-summary";

export function useFeedbackSummary(storageKey) {
  const [summary, setSummary] = useState(() => readSummary(storageKey));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function generate(project, responses) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await generateFeedbackSummary(project, responses);
      setSummary(result);
      try {
        localStorage.setItem(storageKey, JSON.stringify(result));
      } catch {
        setError(
          "Summary generated, but this browser couldn’t save it for next time.",
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }

  return { summary, pending, error, generate };
}
