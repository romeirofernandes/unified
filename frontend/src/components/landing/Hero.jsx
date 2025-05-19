import React from "react";
import { motion } from "framer-motion";

const Hero = ({ onGetStarted }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center pt-32"
    >
      <h2 className="text-5xl font-bold mb-6">
        Collect Feedback,
        <br />
        <span className="text-[#f59e0b]">Unified</span> and Simple
      </h2>
      <p className="text-xl mb-8 text-[#e5e5e5]/80 max-w-2xl mx-auto">
        Add a beautiful feedback component to your website with one line of
        code. Collect, analyze, and act on user feedback - all in one place.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGetStarted}
        className="rounded-lg bg-[#f59e0b] px-8 py-3 text-black text-lg font-medium hover:bg-[#92400e] hover:text-[#fde68a]"
      >
        Get Started Free
      </motion.button>
    </motion.div>
  );
};

export default Hero;
