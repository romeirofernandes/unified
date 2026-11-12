import { flushSync } from "react-dom";

let transitioning = false;
export function changeTheme(setTheme, theme) {
  if (transitioning) return;
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTheme(theme);
    return;
  }
  transitioning = true;
  const transition = document.startViewTransition(() => flushSync(() => setTheme(theme)));
  const release = () => { transitioning = false; };
  // Resizing or navigating can skip the animation after the theme has updated.
  transition.ready.catch(() => {});
  transition.finished.then(release, release);
}
