import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { RiChat3Line } from "react-icons/ri";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Field = memo(({ field, theme, value, onChange }) => {
  const baseInputClass = `w-full p-3 rounded-lg ${
    theme === "dark"
      ? "bg-[#404040] border border-[#404040] text-[#e5e5e5] placeholder-[#e5e5e5]/50"
      : "bg-white border border-gray-200 text-[#171717] placeholder-[#171717]/70"
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
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
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
          <form onSubmit={onSubmit} className="space-y-4">
            {formData?.fields.map((field) => (
              <div key={field._id} className="space-y-2">
                <label className="block">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Field
                  field={field}
                  theme={theme}
                  value={answers[field._id]}
                  onChange={onChange}
                />
              </div>
            ))}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${
                  theme === "dark" ? "hover:bg-[#404040]" : "hover:bg-gray-100"
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#f59e0b] text-black hover:bg-[#92400e] hover:text-[#fde68a] transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        </motion.div>
      </div>,
      document.body
    );
  }
);

const UnifiedFeedback = memo(({ projectId, theme = "light", firebaseUid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

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
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    },
    [answers, projectId, firebaseUid]
  );

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
                className={`px-4 py-2 rounded-lg ${
                  theme === "dark" ? "hover:bg-[#404040]" : "hover:bg-gray-100"
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#f59e0b] text-black hover:bg-[#92400e] hover:text-[#fde68a] transition-colors"
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

  if (loading || error || !formData) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 
          rounded-full 
          w-13 h-13
          flex items-center justify-center
          bg-white
          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          border-[1.5px] border-black/5
          hover:border-black/10
          active:scale-95
          transition-all
          ${theme === "dark" ? "bg-opacity-90" : ""}
        `}
        style={{
          background: "linear-gradient(135deg, #FF8C37 0%, #FF4C17 100%)",
          boxShadow:
            "0 8px 32px rgba(252, 88, 23, 0.24), inset 0 2px 4px rgba(255, 255, 255, 0.24)",
        }}
      >
        <RiChat3Line size={25} className="text-white drop-shadow-sm" />
      </motion.button>
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
