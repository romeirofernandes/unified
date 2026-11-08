// beUI Feedback Widget timings, with the closing timeline reflected exactly.
export const morphDuration = 0.4;
export const surfaceEase = [0.34, 1.25, 0.64, 1];
export const contentEase = [0.22, 1, 0.36, 1];
export const reverseEase = ([x1, y1, x2, y2]) => [1 - x2, 1 - y2, 1 - x1, 1 - y1];

export function morphTransitions(open, reduced) {
  if (reduced) return {
    surface: { duration: 0 },
    content: { opacity: { duration: 0.18 } },
  };
  const easing = open ? contentEase : reverseEase(contentEase);
  return {
    surface: {
      layout: { duration: morphDuration, ease: open ? surfaceEase : reverseEase(surfaceEase) },
      borderRadius: { duration: morphDuration, ease: open ? surfaceEase : reverseEase(surfaceEase) },
    },
    content: {
      x: { duration: morphDuration, ease: easing },
      scale: { duration: morphDuration, ease: easing },
      rotate: { duration: morphDuration, ease: easing },
      opacity: { duration: 0.22, delay: open ? 0 : morphDuration - 0.22, ease: easing },
      filter: { duration: 0.22, delay: open ? 0 : morphDuration - 0.22, ease: easing },
    },
  };
}
