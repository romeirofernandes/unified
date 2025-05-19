import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";

const UnifiedFeedback = ({ projectId, theme = "light" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/projects/${projectId}`
        );
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          formAnswers: answers,
        }),
      });
      setIsOpen(false);
      // Show success toast
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (!formData) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          className={`fixed bottom-4 right-4 rounded-full p-4 ${
            theme === "dark"
              ? "bg-[#f59e0b] text-black"
              : "bg-[#f59e0b] text-black"
          }`}
        >
          Feedback
        </motion.button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl p-6 ${
            theme === "dark"
              ? "bg-[#262626] text-[#e5e5e5]"
              : "bg-white text-[#171717]"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields will be rendered here */}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default UnifiedFeedback;
