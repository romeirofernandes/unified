import { motion as Motion } from "motion/react";
import FeedbackLauncher from "../../../shared/FeedbackLauncher";

export default function Disintegrate({ rect, reduced, launcher, onComplete }) {
  const faceClass = `uf-trigger uf-trigger-${launcher.style || "pill"}`;
  if (reduced) return <Motion.div className={`${faceClass} uf-dust-fallback`}
    style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.15 }}
    onAnimationComplete={onComplete} aria-hidden="true"><FeedbackLauncher launcher={launcher} /></Motion.div>;
  const columns = 12, rows = 4;
  return <div className="uf-dust" aria-hidden="true" data-disintegrating="">
    {Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns, row = Math.floor(index / columns);
      const width = rect.width / columns, height = rect.height / rows;
      return <Motion.div key={index} className="uf-fragment"
        style={{ left: rect.left + column * width, top: rect.top + row * height, width: width + 0.3, height: height + 0.3 }}
        initial={{ opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)" }}
        animate={{ opacity: 0, x: (column - columns / 2) * 6 + Math.sin(index * 7) * 28, y: -22 - row * 10 + Math.cos(index * 3) * 32, rotate: Math.sin(index * 5) * 65, filter: "blur(2px)" }}
        transition={{ duration: 0.48, delay: column * 0.018 + row * 0.012, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={index === columns * rows - 1 ? onComplete : undefined}>
        <div className={`${faceClass} uf-fragment-face`} style={{ width: rect.width, height: rect.height, left: -column * width, top: -row * height }}>
          <FeedbackLauncher launcher={launcher} />
        </div>
      </Motion.div>;
    })}
  </div>;
}
