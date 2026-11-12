import { useAuth } from "@/hooks/use-auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateFeedbackSummary } from "@/lib/feedback-summary";

export function useFeedbackSummary(project, responses, ready) {
  const { user } = useAuth();
  const [generated, setGenerated] = useState(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState(null);
  const running = useRef(false);
  const attempted = useRef(new Set());
  const scope = `${project?._id}:${project?.feedbackGeneration || 0}`;
  const error = failure?.scope === scope ? failure.message : "";
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), [scope]);
  const summary = generated?.scope === scope ? generated.summary : project?.feedbackSummary;
  const snapshot = useMemo(() => responses.map((response) => response._id).sort().join(","), [responses]);
  const current = useMemo(() => {
    if (summary?.schemaVersion !== 2 || !summary?.responseIds || !Array.isArray(summary.evidence)) return false;
    const ids = new Set(summary.responseIds);
    return responses.every((response) => ids.has(response._id));
  }, [summary, responses]);
  const generate = useCallback(async () => {
    if (running.current || current || !ready || !project || !responses.length) return;
    running.current = true;
    attempted.current.add(snapshot);
    setPending(true);
    setFailure(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const summary = await generateFeedbackSummary(project, user?.uid, controller.signal);
      if (latestScope.current === scope) setGenerated({ scope, summary });
    }
    catch (error) { if (!controller.signal.aborted && latestScope.current === scope) setFailure({ scope, message: error.message }); }
    finally { running.current = false; setPending(false); }
  }, [current, ready, project, responses.length, snapshot, user?.uid, scope]);
  useEffect(() => {
    if (ready && !current && responses.length && !attempted.current.has(snapshot)) void generate();
  }, [ready, current, responses.length, snapshot, generate, pending]);
  return { summary, current, pending, error, generate };
}
