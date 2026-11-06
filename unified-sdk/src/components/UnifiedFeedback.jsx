import FormFont from "../../../shared/FormFont";
import { formThemeStyle } from "../../../shared/form-theme.mjs";
import React, { useState, useEffect, useCallback, memo } from "react";
import FeedbackShell from "./FeedbackShell";
import FeedbackModal from "./FeedbackModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const UnifiedFeedback = memo(({ projectId, theme, firebaseUid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const widgetTheme = theme || formData?.theme || "light";

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
          headers: {
            "Content-Type": "application/json",
            "firebase-uid": firebaseUid,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && firebaseUid) {
      fetchProject();
    }
  }, [projectId, firebaseUid]);

  const handleInputChange = useCallback((fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setSubmissionError("");
      const submittedAnswers = { ...answers };
      for (const field of formData.fields || [])
        if (
          field.type === "slider" &&
          submittedAnswers[field._id] === undefined
        )
          submittedAnswers[field._id] = field.config?.min ?? 0;
      try {
        const response = await fetch(`${API_URL}/api/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "firebase-uid": firebaseUid,
          },
          body: JSON.stringify({
            projectId,
            formAnswers: submittedAnswers,
          }),
        });
        if (!response.ok)
          throw new Error("Could not send feedback. Please try again.");
        setShowToast(true);
        localStorage.setItem(`unified-feedback-${projectId}`, "submitted");
      } catch (error) {
        setSubmissionError(
          error.message || "Could not send feedback. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [answers, projectId, firebaseUid, formData, submitting],
  );

  useEffect(() => {
    const wasSubmitted = localStorage.getItem(`unified-feedback-${projectId}`);
    if (wasSubmitted) {
      setIsVisible(false);
    }
  }, [projectId]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      setIsOpen(false);
      if (showToast) setAnswers({});
    }
  }, [submitting, showToast]);

  if (loading || error || !formData || !isVisible) return null;

  return (
    <FeedbackShell
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={handleClose}
      pending={submitting}
      success={showToast}
      style={formThemeStyle(formData.appearance, widgetTheme)}
    >
      <FormFont appearance={formData.appearance} />
      <FeedbackModal
        isOpen={isOpen}
        onClose={handleClose}
        formData={formData}
        theme={widgetTheme}
        answers={answers}
        onSubmit={handleSubmit}
        pending={submitting}
        error={submissionError}
        onChange={handleInputChange}
      />
    </FeedbackShell>
  );
});

export default UnifiedFeedback;
