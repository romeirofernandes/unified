import { formThemeStyle } from "../../../shared/form-theme.mjs";
import React, { memo } from "react";
import { useState } from "react";

import { motion as Motion, useReducedMotion } from "motion/react";
import Field from "./Field";

const FeedbackModal = memo(
  ({
    isOpen,
    onClose,
    formData,
    theme,
    answers,
    onSubmit,
    onChange,
    pending = false,
    error,
  }) => {
    const reduced = useReducedMotion();
    const [fieldError, setFieldError] = useState("");
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const totalSteps = formData?.fields?.length || 0;
    const currentField = formData?.fields[currentStep];

    const handleNext = () => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    };

    const handlePrevious = () => {
      if (currentStep > 0) {
        setFieldError("");
        setCurrentStep((prev) => prev - 1);
      }
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      if (pending) return;
      if (
        currentField?.type === "date" &&
        currentField.required &&
        !answers[currentField._id]
      ) {
        setFieldError("Choose a date to continue.");
        document.getElementById(`uf-field-${currentField._id}`)?.focus();
        return;
      }
      setFieldError("");
      if (currentStep === totalSteps - 1) {
        onSubmit(e);
      } else {
        handleNext();
      }
    };

    return (
      <div
        style={formThemeStyle(formData?.appearance, theme)}
        className="p-5 [&_h2]:font-[inherit] text-[var(--uf-text)]"
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close feedback"
            className="flex size-8 items-center justify-center rounded-md hover:bg-[var(--uf-surface)] focus-visible:outline-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mb-5 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--uf-surface)] backdrop-blur-sm border border-[var(--uf-border)] shadow-sm">
            {[...Array(totalSteps)].map((_, index) => (
              <Motion.div
                key={`step-${index}-${currentField?._id}`}
                initial={false}
                animate={{
                  scale: currentStep >= index ? 1 : 0.85,
                  opacity: currentStep >= index ? 1 : 0.5,
                }}
                className={`
                    w-2 h-2 rounded-full transition-colors
                    ${
                      currentStep >= index
                        ? "bg-[var(--uf-accent)]"
                        : "bg-[var(--uf-border)]"
                    }
                  `}
              />
            ))}
          </div>
        </div>

        {/* Rest of the modal content */}
        <h2 className="text-2xl font-bold mb-2 mt-4">{formData?.name}</h2>
        <p className="mb-8 text-sm text-[var(--uf-muted)]">
          Step {currentStep + 1} of {totalSteps}
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Motion.div
            key={currentStep}
            initial={{ opacity: 0, x: reduced ? 0 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <label
              id={`uf-label-${currentField?._id}`}
              htmlFor={`uf-field-${currentField?._id}`}
              className="mb-2 block text-lg font-medium"
            >
              {currentField?.label}
              {currentField?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <Field
              field={currentField}
              theme={theme}
              value={answers[currentField?._id]}
              onChange={(id, value) => {
                setFieldError("");
                onChange(id, value);
              }}
            />
          </Motion.div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          {fieldError && (
            <p role="alert" className="text-sm text-red-500">
              {fieldError}
            </p>
          )}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={pending}
              className={`h-10 rounded-md px-4 text-[var(--uf-muted)] outline-none hover:bg-[var(--uf-surface)] focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)] ${currentStep === 0 ? "invisible" : ""}`}
            >
              Previous
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-md border border-[var(--uf-accent)] bg-[var(--uf-accent)] px-6 text-[var(--uf-accentText)] shadow-sm outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]"
            >
              {pending
                ? "Sending…"
                : currentStep === totalSteps - 1
                  ? "Submit"
                  : "Next"}
            </button>
          </div>
        </form>
      </div>
    );
  },
);

export default FeedbackModal;
