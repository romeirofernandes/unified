import { useRef } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContrastIcon } from "@hugeicons/core-free-icons";
import { tactileButtonBase, tactileSecondaryButton } from "./buttonStyles";

export default function ThemeToggle({ compact = false }) {
  const { resolvedTheme, setTheme } = useTheme();
  const transitionInProgress = useRef(false);

  function toggleTheme() {
    if (transitionInProgress.current) return;

    const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    if (typeof document.startViewTransition !== "function") {
      setTheme(nextTheme);
      return;
    }

    transitionInProgress.current = true;
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });
    const releaseToggle = () => {
      transitionInProgress.current = false;
    };

    transition.finished.then(releaseToggle, releaseToggle);
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`${tactileButtonBase} ${tactileSecondaryButton} size-10 p-0 [view-transition-name:theme-toggle] transition-[filter,transform] duration-200 hover:scale-[1.06] active:scale-[0.96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:focus-visible:ring-offset-[#211f1d] motion-reduce:transition-none ${compact ? "" : "px-0"}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <HugeiconsIcon icon={ContrastIcon} size={20} aria-hidden="true" />
      {!compact && <span className="sr-only">Change appearance</span>}
    </button>
  );
}
