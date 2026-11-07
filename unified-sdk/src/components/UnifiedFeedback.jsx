import FormFont from "../../../shared/FormFont";
import { formThemeStyle } from "../../../shared/form-theme.mjs";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useHostTheme } from "../hooks/use-host-theme";
import FeedbackShell from "./FeedbackShell";
import FeedbackModal from "./FeedbackModal";

// Changing identity remounts the session, including answers, timers and requests.
const UnifiedFeedback = memo(function UnifiedFeedback(props) {
  return <FeedbackSession key={JSON.stringify([props.projectId, props.apiUrl])} {...props} />;
});

function FeedbackSession({ projectId, theme, apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000", position = "bottom-right" }) {
  const [resource, setResource] = useState({ status: "loading", data: null });
  const [status, setStatus] = useState("closed");
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const request = useRef(null);
  const baseUrl = apiUrl.replace(/\/$/, "");
  const pending = status === "sending";
  const success = status === "success";
  const formData = resource.data;
  const { mode: widgetTheme, anchorRef } = useHostTheme(theme, formData?.theme);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    fetch(`${baseUrl}/api/widget/${projectId}`, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load feedback form.");
      const data = await response.json();
      if (!Array.isArray(data.fields) || !data.fields.length) throw new Error("The feedback form has no questions.");
      if (!controller.signal.aborted) setResource({ status: "ready", data });
    }).catch((error) => {
      if (!controller.signal.aborted) setResource({ status: "error", data: null, error: error.message });
    });
    return () => controller.abort();
  }, [projectId, baseUrl]);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setStatus("dismissed"), 1800);
    return () => clearTimeout(timer);
  }, [success]);

  const handleClose = useCallback(() => {
    if (request.current) return;
    setStatus((current) => current === "success" ? "dismissed" : "closed");
  }, []);
  const handleInputChange = useCallback((id, value) => {
    setAnswers((previous) => ({ ...previous, [id]: value }));
  }, []);
  const handleSubmit = async (event) => {
    event.preventDefault();
    // A ref guards same-tick double submits before React commits the sending state.
    if (request.current || status === "success") return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("sending");
    setError("");
    const formAnswers = { ...answers };
    for (const field of formData.fields) {
      if (field.type === "slider" && formAnswers[field._id] === undefined) formAnswers[field._id] = field.config?.min ?? 0;
    }
    try {
      const response = await fetch(`${baseUrl}/api/widget/${projectId}`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formAnswers }),
      });
      if (!response.ok) throw new Error("Could not send feedback. Please try again.");
      if (!controller.signal.aborted) setStatus("success");
    } catch (error) {
      if (!controller.signal.aborted) {
        setStatus("error");
        setError(error.message || "Could not send feedback. Please try again.");
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  return (
    <>
    <span ref={anchorRef} hidden aria-hidden="true" />
    {resource.status === "ready" && status !== "dismissed" && <FeedbackShell open={status !== "closed"} onOpen={() => setStatus("editing")} onClose={handleClose}
      pending={pending} success={success} position={position} theme={widgetTheme} style={formThemeStyle(formData.appearance, widgetTheme)}>
      <FormFont appearance={formData.appearance} />
      <FeedbackModal isOpen onClose={handleClose} formData={formData} theme={widgetTheme}
        answers={answers} onSubmit={handleSubmit} pending={pending} error={error} onChange={handleInputChange} />
    </FeedbackShell>}
    </>
  );
}

export default UnifiedFeedback;
