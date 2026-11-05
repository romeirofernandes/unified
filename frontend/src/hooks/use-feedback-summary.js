import { useAuth } from "@/hooks/use-auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateFeedbackSummary } from "@/lib/feedback-summary";

export function useFeedbackSummary(project, responses, ready) {
  const { user } = useAuth();
  const [generated, setGenerated] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const attempted = useRef(new Set());
  const summary = generated || project?.feedbackSummary;
  const snapshot = useMemo(() => responses.map((response) => response._id).sort().join(","), [responses]);
  const current = useMemo(() => {
    if (!summary?.responseIds) return false;
    const ids = new Set(summary.responseIds);
    return responses.every((response) => ids.has(response._id));
  }, [summary, responses]);
  const generate = useCallback(async () => {
    if (running.current || current || !ready || !project || !responses.length) return;
    running.current = true;
    attempted.current.add(snapshot);
    setPending(true);
    setError("");
    try { setGenerated(await generateFeedbackSummary(project, user?.uid)); }
    catch (error) { setError(error.message); }
    finally { running.current = false; setPending(false); }
  }, [current, ready, project, responses.length, snapshot, user?.uid]);
  useEffect(() => {
    if (ready && !current && responses.length && !attempted.current.has(snapshot)) void generate();
  }, [ready, current, responses.length, snapshot, generate, pending]);
  return { summary, current, pending, error, generate };
}
