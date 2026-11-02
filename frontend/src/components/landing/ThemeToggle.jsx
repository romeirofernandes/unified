import { useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContrastIcon } from "@hugeicons/core-free-icons";

const MotionDiv = motion.div;

export default function ThemeToggle({ compact = false }) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [reveal, setReveal] = useState(null);

  function toggleTheme(event) {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    if (reduceMotion) {
      setTheme(nextTheme);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    setReveal({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      current: resolvedTheme === "dark" ? "dark" : "light",
      next: nextTheme,
      phase: "cover",
    });
  }

  function advanceReveal() {
    if (reveal?.phase === "cover") {
      setTheme(reveal.next);
      setReveal({ ...reveal, phase: "reveal" });
      return;
    }
    setReveal(null);
  }

  const overlayTheme = reveal?.phase === "cover" ? reveal.current : reveal?.next;

  return (
    <>
      <button
        type="button"
        className={`grid min-h-11 min-w-11 place-items-center rounded-[14px] border border-[#d2cfc7] bg-white/65 text-[#34322e] shadow-[0_1px_1px_rgb(28_27_25_/_5%)] transition-[background-color,color,border-color] duration-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496699] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:border-[#4a4842] dark:bg-white/5 dark:text-[#f4f1e9] dark:hover:bg-white/10 dark:focus-visible:ring-offset-[#211f1d] motion-reduce:transition-none ${compact ? "" : "px-3"}`}
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
      >
        <HugeiconsIcon icon={ContrastIcon} size={20} aria-hidden="true" />
        {!compact && <span className="sr-only">Change appearance</span>}
      </button>
      <AnimatePresence>
        {reveal && (
          <MotionDiv
            key={`${reveal.current}-${reveal.next}`}
            aria-hidden="true"
            className={`pointer-events-none fixed inset-0 z-[100] ${overlayTheme === "dark" ? "bg-[#211f1d]" : "bg-[#f4f3ee]"}`}
            initial={{
              clipPath: `circle(${reveal.phase === "cover" ? "0px" : "150vmax"} at ${reveal.x}px ${reveal.y}px)`,
              filter: "blur(18px)",
            }}
            animate={{
              clipPath: `circle(${reveal.phase === "cover" ? "150vmax" : "0px"} at ${reveal.x}px ${reveal.y}px)`,
              filter: reveal.phase === "cover" ? "blur(0px)" : "blur(18px)",
            }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={advanceReveal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
