// Opening follows beUI; closing clears the form before the surface contracts.
export const morphDuration = 0.4;
export const surfaceEase = [0.34, 1.25, 0.64, 1];
export const contentEase = [0.22, 1, 0.36, 1];

export function morphTransitions(open, reduced) {
  if (reduced) return {
    surface: { duration: 0 },
    content: { opacity: { duration: 0.18 } },
    trigger: { opacity: { duration: 0.18 } },
  };
  const content = {
    x: { duration: open ? 0.4 : 0.2, ease: contentEase },
    scale: { duration: open ? 0.4 : 0.2, ease: contentEase },
    rotate: { duration: open ? 0.4 : 0.2, ease: contentEase },
    opacity: { duration: open ? 0.22 : 0.12, ease: contentEase },
    filter: { duration: open ? 0.22 : 0.12, ease: contentEase },
  };
  return {
    surface: {
      layout: { duration: open ? 0.4 : 0.28, ease: open ? surfaceEase : contentEase },
      borderRadius: { duration: open ? 0.4 : 0.28, ease: open ? surfaceEase : contentEase },
      backgroundColor: open ? { duration: 0, delay: 0 } : { duration: 0.12, delay: 0.28, ease: contentEase },
    },
    content,
    trigger: open ? content : { opacity: { duration: 0.12, delay: 0.28, ease: contentEase } },
  };
}
