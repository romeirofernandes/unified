import { useEffect } from "react";
import { motion } from "framer-motion";

const Toast = ({ onComplete, theme }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        fixed bottom-6 right-6
        backdrop-blur-sm
        px-6 py-3 rounded-lg
        shadow-lg
        flex items-center space-x-3
        border
        ${
          theme === "dark"
            ? "bg-[#333333]/90 text-white border-[#444444]"
            : "bg-white/90 text-gray-700 border-gray-200"
        }
      `}
    >
      <span className="text-emerald-500">✓</span>
      <span>Thanks for your feedback!</span>
    </motion.div>
  );
};

export default Toast;
