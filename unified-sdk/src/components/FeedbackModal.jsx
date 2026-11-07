import { formThemeStyle } from "../../../shared/form-theme.mjs";
import { memo } from "react";
import { useState } from "react";

import Stepper, { Step } from "./Stepper";
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
        <h2
          style={{ fontFamily: "var(--uf-font)" }}
          className="text-2xl font-bold mb-2 mt-4"
        >
          {formData?.name}
        </h2>
        <p className="mb-8 text-sm text-[var(--uf-muted)]">
          Step {currentStep + 1} of {totalSteps}
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Stepper
            step={currentStep + 1}
            indicator="numbers"
            disableStepIndicators
            showFooter={false}
            frame={false}
            theme={theme}
            accentColor="var(--uf-accent)"
            width="100%"
            radius={8}
          >
            {formData.fields.map((field) => (
              <Step key={field._id} title={field.label}>
                <label
                  id={`uf-label-${field._id}`}
                  htmlFor={`uf-field-${field._id}`}
                  className="mb-2 block text-lg font-medium"
                >
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <fieldset disabled={pending} className="min-w-0 border-0 p-0">
                  <Field field={field} theme={theme} value={answers[field._id]}
                    onChange={(id, value) => { setFieldError(""); onChange(id, value); }} />
                </fieldset>
              </Step>
            ))}
          </Stepper>

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
