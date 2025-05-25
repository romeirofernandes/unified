import React from "react";
import { motion } from "framer-motion";

const CTA = ({ onGetStarted }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mx-4 sm:mx-5 lg:mx-auto lg:max-w-6xl relative mt-16 sm:mt-24 lg:mt-32 text-center"
    >
      <div className="p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-xl bg-[#191919] border border-[#383838]">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-[#fafafa] leading-tight">
          Ready to get started?
        </h2>
        <p className="text-[#a1a1a1] mb-6 sm:mb-8 max-w-xs sm:max-w-xl mx-auto text-sm sm:text-base px-2 sm:px-0">
          Join thousands of developers who are already collecting better
          feedback with Unified.
        </p>
        <motion.button
          onClick={onGetStarted}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
          className="w-full sm:w-auto transform rounded-lg bg-[#737373] px-6 sm:px-8 py-3 sm:py-3 text-[#fafafa] text-base sm:text-lg font-medium hover:bg-[#525252] transition-all duration-300"
        >
          Start Collecting Feedback
        </motion.button>
      </div>
    </motion.section>
  );
};

export default CTA;
