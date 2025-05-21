import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { RiChat3Line } from "react-icons/ri";
import FeedbackModal from "./FeedbackModal";
import Toast from "./Toast";
import DeleteZone from "./DeleteZone";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
        localStorage.setItem(`unified-feedback-${projectId}`, "submitted");
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    },
    [answers, projectId, firebaseUid]
  );

  useEffect(() => {
    const wasSubmitted = localStorage.getItem(`unified-feedback-${projectId}`);
    if (wasSubmitted) {
      setIsVisible(false);
    }
  }, [projectId]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  if (loading || error || !formData || !isVisible) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {!showToast && isVisible && (
          <FeedbackButton
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            setIsVisible={setIsVisible}
            setIsOpen={setIsOpen}
            theme={theme}
            projectId={projectId}
            x={x}
            y={y}
          />
        )}
          {showToast && (
            <Toast
              key={`feedback-toast-${projectId}`}
              onComplete={() => {
                setShowToast(false);
                setIsVisible(false);
              }}
              theme={theme}
            />
          )}
      </AnimatePresence>

      <DeleteZone isVisible={isDragging} isDragging={isDragging} />

      <AnimatePresence>
        {isOpen && (
          <FeedbackModal
            key={`feedback-modal-${projectId}`}
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

export default memo(UnifiedFeedback);

const FeedbackButton = ({
  isDragging,
  setIsDragging,
  setIsVisible,
  setIsOpen,
  theme,
  projectId,
  x,
  y,
}) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      style={{ x, y }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        if (info.point.y > window.innerHeight - 96) {
          setIsVisible(false);
          localStorage.setItem(`unified-feedback-${projectId}`, "removed");
        }
      }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.button
        whileHover={{
          scale: 1.05,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.12)",
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => !isDragging && setIsOpen(true)}
        className={`
                rounded-full 
                w-14 h-14
                flex items-center justify-center
                shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                cursor-pointer
                backdrop-blur-sm
                ${
                  theme === "dark"
                    ? "bg-[#333333] hover:bg-[#404040] border border-[#444444]"
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }
              `}
      >
        <RiChat3Line
          size={24}
          className={`${theme === "dark" ? "text-white" : "text-gray-700"}`}
        />
      </motion.button>
    </motion.div>
  );
};
