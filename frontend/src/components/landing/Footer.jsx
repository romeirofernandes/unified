import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="max-w-5xl mx-auto relative mt-32 py-8">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#383838] to-transparent"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="container mx-auto px-14 max-w-5xl"
      >
        <div className="flex justify-between items-center text-[#a1a1a1] text-sm">
          <p>© {new Date().getFullYear()} Unified. All rights reserved.</p>
          <p>
            crafted by{" "}
            <a href="https://github.com/romeirofernandes" target="_blank">
              <span className="text-white">romeiro</span>
            </a>
          </p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
