// Adapted from beUI Checkbox (MIT): https://beui.dev/r/checkbox
import { motion as Motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "../lib/ease";

export default function Checkmark({ indeterminate = false, size = 12 }) {
  const reduced = useReducedMotion();
  return <Motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(4px)" }}
    transition={reduced ? { duration: 0 } : { duration: 0.16, ease: EASE_OUT }}>
    <Motion.path d={indeterminate ? "M6 12h12" : "M5 13l4 4L19 7"}
      initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }}
      transition={reduced ? { duration: 0 } : { duration: indeterminate ? 0.2 : 0.3, ease: EASE_OUT, delay: 0.04 }} />
  </Motion.svg>;
}
