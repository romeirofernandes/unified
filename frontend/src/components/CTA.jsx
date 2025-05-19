import React from "react";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mt-32 text-center"
    >
      <div className="p-12 rounded-2xl bg-[#262626] border border-[#404040]">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-[#e5e5e5]/70 mb-8 max-w-xl mx-auto">
          Join thousands of developers who are already collecting better
          feedback with Unified.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-[#f59e0b] px-8 py-3 text-black text-lg font-medium hover:bg-[#92400e] hover:text-[#fde68a] transition-colors"
        >
          Start Collecting Feedback
        </motion.button>
      </div>
    </motion.section>
  );
};

export default CTA;
