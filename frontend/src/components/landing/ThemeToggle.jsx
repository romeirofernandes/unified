import { changeTheme } from "@/lib/theme-transition";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContrastIcon } from "@hugeicons/core-free-icons";
import { tactileButtonBase, tactileSecondaryButton } from "./buttonStyles";

export default function ThemeToggle({ compact = false }) {
  const { resolvedTheme, setTheme } = useTheme();
  function toggleTheme() {
    changeTheme(setTheme, resolvedTheme === "dark" ? "light" : "dark");
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`${tactileButtonBase} ${tactileSecondaryButton} size-10 p-0 transition-[filter] duration-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:focus-visible:ring-offset-[#141413] motion-reduce:transition-none ${compact ? "" : "px-0"}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <HugeiconsIcon icon={ContrastIcon} size={20} aria-hidden="true" />
      {!compact && <span className="sr-only">Change appearance</span>}
    </button>
  );
}
