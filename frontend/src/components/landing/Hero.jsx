import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Hero = ({ onGetStarted }) => {
  const navigate = useNavigate();
  return (
    <div className="relative mx-auto my-12 flex max-w-7xl flex-col items-center justify-center">
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-[#fafafa] md:text-4xl lg:text-6xl">
          {"Collect feedback with AI-powered insights"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-[#a1a1a1]"
        >
          Add a beautiful feedback component to your website with one line of
          code. Collect, analyze, and act on user feedback - all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onGetStarted}
            className="w-60 transform rounded-lg bg-[#737373] px-6 py-2 font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#525252]"
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate("/docs")}
            className="w-60 transform rounded-lg border border-[#383838] bg-[#191919] px-6 py-2 font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#262626]"
          >
            View Documentation
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="relative z-10 mt-20 rounded-3xl border border-[#383838] bg-[#191919] p-4 shadow-md"
        >
          <div className="w-full overflow-hidden rounded-xl border border-[#383838]">
            <img
              src="/dashboard.png"
              alt="Unified Dashboard Preview"
              className="aspect-[16/9] h-auto w-auto object-cover"
              height={1000}
              width={1000}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
