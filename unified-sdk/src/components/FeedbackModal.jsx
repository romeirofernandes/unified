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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`
            relative w-full max-w-md rounded-2xl p-8
            ${
              theme === "dark"
                ? "bg-[#191919] text-[#fafafa] border border-[#383838]"
                : "bg-white text-[#171717] border border-gray-200"
            }
          `}
        >
          <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
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
                        ? "bg-[#737373]"
                        : theme === "dark"
                        ? "bg-[#383838]"
                        : "bg-gray-200"
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Rest of the modal content */}
          <h2 className="text-2xl font-bold mb-2 mt-4">{formData?.name}</h2>
          <p
            className={`text-sm mb-8 ${
              theme === "dark" ? "text-[#a1a1a1]" : "text-[#737373]"
            }`}
          >
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
                className={`
                  px-4 py-2 cursor-pointer rounded-lg transition-colors
                  ${
                    theme === "dark"
                      ? "text-[#a1a1a1] hover:bg-[#262626]"
                      : "text-[#737373] hover:bg-gray-100"
                  }
                  ${currentStep === 0 ? "invisible" : ""}
                `}
              >
                Previous
              </button>
              <button
                type="submit"
                className={`
                  px-6 py-2 cursor-pointer rounded-lg text-[#fafafa] transition-colors
                  ${
                    currentStep === totalSteps - 1
                      ? "bg-[#737373] hover:bg-[#525252]"
                      : "bg-[#737373] hover:bg-[#525252]"
                  }
                `}
              >
                {currentStep === totalSteps - 1 ? "Submit" : "Next"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>,
      document.body
    );
  }
);

export default FeedbackModal;
