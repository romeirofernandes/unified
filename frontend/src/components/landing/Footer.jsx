import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative border-t border-[#383838] mt-32 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="container mx-auto px-6 max-w-5xl"
      >
        <div className="flex justify-between items-center text-[#a1a1a1] text-sm">
          <p>© {new Date().getFullYear()} Unified. All rights reserved.</p>
          <p>Crafted by Romeiro Fernandes</p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
