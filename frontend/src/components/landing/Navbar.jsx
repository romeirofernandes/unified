import React, { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { RiMenu4Line } from "react-icons/ri";

const Navbar = ({ onGetStarted }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 max-w-5xl mx-auto"
    >
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          border: visible ? "1px solid rgba(56, 56, 56, 0.3)" : "none",
          width: visible ? "40%" : "100%",
          y: visible ? 20 : 0,
          backgroundColor: visible ? "rgba(25, 25, 25, 0.8)" : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: visible ? "800px" : "100%",
        }}
        className="relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-lg bg-transparent px-6 py-4 md:flex"
      >
        <div className="flex w-full items-center justify-between">
          <motion.h1
            animate={{
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="text-2xl font-bold text-[#fafafa]"
          >
            Unified
          </motion.h1>

          <motion.nav
            animate={{
              opacity: 1,
            }}
            className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-6"
          >
            {["Features", "Testimonials"].map((item, idx) => (
              <motion.button
                key={idx}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-[#a1a1a1] hover:text-[#fafafa] relative px-4 py-2"
                whileHover={{ scale: 1.05 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }}
              >
                {item}
              </motion.button>
            ))}
          </motion.nav>

          <motion.button
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            onClick={onGetStarted}
            className="transform rounded-lg bg-[#737373] px-6 py-2 font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#525252]"
          >
            Get Started
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile menu button */}
      <button className="md:hidden fixed right-4 top-4 text-[#fafafa] text-2xl">
        <RiMenu4Line />
      </button>
    </motion.div>
  );
};

export default Navbar;
