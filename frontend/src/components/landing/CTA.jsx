import React from "react";
import { motion } from "framer-motion";

const CTA = ({ onGetStarted }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="relative mt-32 text-center"
    >
      <div className="p-12 rounded-lg bg-[#191919] border border-[#383838]">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#fafafa]">
          Ready to get started?
        </h2>
        <p className="text-[#a1a1a1] mb-8 max-w-xl mx-auto">
          Join thousands of developers who are already collecting better
          feedback with Unified.
        </p>
        <motion.button
          onClick={onGetStarted}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
          className="transform rounded-lg bg-[#737373] px-8 py-3 text-[#fafafa] text-lg font-medium hover:bg-[#525252] transition-all duration-300 hover:-translate-y-0.5"
        >
          Start Collecting Feedback
        </motion.button>
      </div>
    </motion.section>
  );
};

export default CTA;
