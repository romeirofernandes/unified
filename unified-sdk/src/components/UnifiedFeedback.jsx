import React, { useState, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { createPortal } from "react-dom";
import { RiChat3Line } from "react-icons/ri";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Field = memo(({ field, theme, value, onChange }) => {
  const baseInputClass = `w-full p-3 rounded-lg transition-colors ${
    theme === "dark"
      ? "bg-[#262626] border border-[#383838] text-[#fafafa] placeholder-[#a1a1a1] focus:border-[#525252]"
      : "bg-white border border-gray-200 text-[#171717] placeholder-[#737373] focus:border-[#525252]"
  }`;

  switch (field.type) {
    case "text":
    case "email":
      return (
        <input
          type={field.type}
          className={baseInputClass}
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
        />
      );
    case "textarea":
      return (
        <textarea
          className={`${baseInputClass} h-24 resize-none`}
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
        />
      );
    case "mcq":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center space-x-2">
              <input
                type="radio"
                name={field._id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(field._id, e.target.value)}
                required={field.required}
                className="text-[#f59e0b]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    case "slider":
      return (
        <div className="space-y-2">
          <input
            type="range"
            min={field.config?.min || 0}
            max={field.config?.max || 100}
            step={field.config?.step || 1}
            value={value || field.config?.min || 0}
            onChange={(e) => onChange(field._id, Number(e.target.value))}
            required={field.required}
            className="w-full"
          />
          <div className="flex justify-between text-sm opacity-70">
            <span>{field.config?.min || 0}</span>
            <span>{field.config?.max || 100}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
});

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
                  key={index}
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

const Toast = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      onAnimationComplete={() => !isVisible && onComplete()}
      className={`
        fixed bottom-6 right-6
        bg-green-500 text-white
        px-6 py-3 rounded-lg
        shadow-lg
        flex items-center space-x-2
      `}
    >
      <span>✓</span>
      <span>Thanks for your feedback!</span>
    </motion.div>
  );
};

const DeleteZone = ({ isVisible, isDragging }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`
            fixed bottom-0 left-0 right-0
            h-24 bg-red-500/20
            backdrop-blur-sm
            flex items-center justify-center
            border-t-2 border-red-500
            ${isDragging ? "bg-red-500/40" : ""}
          `}
        >
          <p className="text-red-500 font-medium">
            Drop here to remove feedback button
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UnifiedFeedback = memo(({ projectId, theme = "light", firebaseUid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

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

  // Memoize the input handler to prevent re-renders
  const handleInputChange = useCallback((fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await fetch(`${API_URL}/api/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "firebase-uid": firebaseUid,
          },
          body: JSON.stringify({
            projectId,
            formAnswers: answers,
          }),
        });
        setIsOpen(false);
        setShowToast(true);
        // Store in localStorage to prevent reappearing
        localStorage.setItem(`unified-feedback-${projectId}`, "submitted");
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    },
    [answers, projectId, firebaseUid]
  );

  // Check if feedback was already submitted
  useEffect(() => {
    const wasSubmitted = localStorage.getItem(`unified-feedback-${projectId}`);
    if (wasSubmitted) {
      setIsVisible(false);
    }
  }, [projectId]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const Modal = () => {
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-md rounded-2xl p-6 ${
            theme === "dark"
              ? "bg-[#262626] text-[#e5e5e5]"
              : "bg-white text-[#171717]"
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">{formData?.name}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formData?.fields.map((field, index) => (
              <div key={index} className="space-y-2">
                <label className="block">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
              </div>
            ))}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`cursor-pointer px-4 py-2 rounded-lg ${
                  theme === "dark" ? "hover:bg-[#404040]" : "hover:bg-gray-100"
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-4 py-2 rounded-lg bg-[#f59e0b] text-black hover:bg-[#92400e] hover:text-[#fde68a] transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        </motion.div>
      </div>,
      document.body
    );
  };

  if (loading || error || !formData || !isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {!showToast && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            style={{ x, y }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(event, info) => {
              setIsDragging(false);
              // Check if dropped in delete zone
              if (info.point.y > window.innerHeight - 96) {
                setIsVisible(false);
                localStorage.setItem(
                  `unified-feedback-${projectId}`,
                  "removed"
                );
              }
            }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => !isDragging && setIsOpen(true)}
              className={`
                rounded-full 
                w-14 h-14
                flex items-center justify-center
                bg-white
                shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                border-[1.5px] border-black/5
                hover:border-black/10
                cursor-pointer
                ${theme === "dark" ? "bg-opacity-90" : ""}
              `}
              style={{
                background: "linear-gradient(135deg, #FF8C37 0%, #FF4C17 100%)",
                boxShadow:
                  "0 8px 32px rgba(252, 88, 23, 0.24), inset 0 2px 4px rgba(255, 255, 255, 0.24)",
              }}
            >
              <RiChat3Line size={26} className="text-white drop-shadow-sm" />
            </motion.button>
          </motion.div>
        )}

        {showToast && <Toast onComplete={() => setIsVisible(false)} />}
      </AnimatePresence>

      <DeleteZone isVisible={isDragging} isDragging={isDragging} />

      <AnimatePresence>
        {isOpen && (
          <FeedbackModal
            isOpen={isOpen}
            onClose={handleClose}
            formData={formData}
            theme={theme}
            answers={answers}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
          />
        )}
      </AnimatePresence>
    </>
  );
});

// Memoize the entire component
export default memo(UnifiedFeedback);
