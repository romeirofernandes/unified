import { formThemeStyle } from "../../../shared/form-theme.mjs";
import React, { memo } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Field from "./Field";

const FeedbackModal = memo(
  ({ isOpen, onClose, formData, theme, answers, onSubmit, onChange }) => {
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
        setCurrentStep((prev) => prev - 1);
      }
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      if (currentStep === totalSteps - 1) {
        onSubmit(e);
      } else {
        handleNext();
      }
    };

    return createPortal(
      <div
        style={formThemeStyle(formData?.appearance, theme)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] p-6 text-[var(--uf-text)]"
        >
          <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--uf-surface)] backdrop-blur-sm border border-[var(--uf-border)] shadow-sm">
              {[...Array(totalSteps)].map((_, index) => (
                <motion.div
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
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-lg font-medium mb-2">
                {currentField?.label}
                {currentField?.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <Field
                field={currentField}
                theme={theme}
                value={answers[currentField?._id]}
                onChange={onChange}
              />
            </motion.div>

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={handlePrevious}
                className={`h-10 rounded-md px-4 text-[var(--uf-muted)] outline-none hover:bg-[var(--uf-surface)] focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)] ${currentStep === 0 ? "invisible" : ""}`}
              >
                Previous
              </button>
              <button
                type="submit"
                className="h-10 rounded-md border border-[var(--uf-accent)] bg-[var(--uf-accent)] px-6 text-[var(--uf-accentText)] shadow-sm outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]"
              >
                {currentStep === totalSteps - 1 ? "Submit" : "Next"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>,
      document.body,
    );
  },
);

export default FeedbackModal;
