import React, { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { RiMenu4Line, RiCloseLine } from "react-icons/ri";
import BuyMeCoffeeButton from "./BuyMeCoffeeButton";

const Navbar = ({ onGetStarted }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false); // Close menu after navigation
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 max-w-5xl mx-auto mb-16 md:mb-0"
    >
      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          border: visible ? "1px solid rgba(56, 56, 56, 0.3)" : "none",
          width: visible ? "40%" : "100%",
          y: visible ? 20 : 0,
          backgroundColor: visible
            ? "rgba(25, 25, 25, 0.8)"
            : "rgba(25, 25, 25, 0)",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: visible ? "800px" : "100%",
        }}
        className="relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-lg px-6 py-4 md:flex"
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

          {/* <motion.button
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
          </motion.button> */}
          <BuyMeCoffeeButton />
        </div>
      </motion.div>

      {/* Mobile navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          border: visible ? "1px solid rgba(56, 56, 56, 0.3)" : "none",
          y: visible ? 20 : 0,
          backgroundColor: visible
            ? "rgba(25, 25, 25, 0.8)"
            : "rgba(25, 25, 25, 0)",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        className="md:hidden flex items-center justify-between px-6 py-4 mt-4 mx-4 rounded-lg"
      >
        <motion.h1
          animate={{
            scale: visible ? 0.9 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="text-xl font-bold text-[#fafafa]"
        >
          Unified
        </motion.h1>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#fafafa] text-2xl p-1"
        >
          {mobileMenuOpen ? <RiCloseLine /> : <RiMenu4Line />}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4"
          >
            <div className="bg-[rgba(25,25,25,0.95)] backdrop-blur-lg border border-[rgba(56,56,56,0.3)] rounded-lg p-4 space-y-4">
              {["Features", "Testimonials"].map((item, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="block w-full text-left text-[#a1a1a1] hover:text-[#fafafa] py-2 px-3 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {item}
                </motion.button>
              ))}

              {/* <motion.button
                onClick={() => {
                  onGetStarted();
                  setMobileMenuOpen(false);
                }}
                whileTap={{ scale: 0.95 }}
                className="w-full rounded-lg bg-[#737373] px-4 py-3 font-medium text-[#fafafa] transition-all duration-300 hover:bg-[#525252] mt-4"
              >
                Get Started
              </motion.button> */}
              <div className="mt-4">
                <BuyMeCoffeeButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;
