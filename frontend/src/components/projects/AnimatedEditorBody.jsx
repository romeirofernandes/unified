import { useLayoutEffect, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";

// Animate height directly. Layout projection would stretch the form's text.
export default function AnimatedEditorBody({ headerRef, children }) {
  const content = useRef(null);
  const [height, setHeight] = useState(null);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    let frame;
    const measure = () => {
      const available = Math.max(
        0,
        window.innerHeight - 34 - (headerRef.current?.offsetHeight || 0),
      );
      const next = Math.min(content.current?.offsetHeight || 0, available);
      setHeight((previous) => (previous === next ? previous : next));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    if (content.current) observer.observe(content.current);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [headerRef]);
  return (
    <Motion.div
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{
        "--editor-height": height ? `${Math.max(0, height - 48)}px` : "70dvh",
      }}
      className="min-h-0 overflow-y-auto overscroll-contain"
    >
      <div ref={content} className="p-5 sm:p-6">
        {children}
      </div>
    </Motion.div>
  );
}
