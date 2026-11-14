import { cycleWorkspaceBackground } from "@/lib/workspace-background";
import { changeTheme } from "@/lib/theme-transition";
import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { FluidRoot } from "@/components/fluid-root";
import { AuthProvider } from "@/context/AuthContext";

function AppearanceShortcut() {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (
        !["d", "b"].includes(event.key.toLowerCase()) ||
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTypingTarget
      ) {
        return;
      }

      event.preventDefault();
      if (event.key.toLowerCase() === "b") {
        cycleWorkspaceBackground();
      } else {
        changeTheme(setTheme, resolvedTheme === "dark" ? "light" : "dark");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FluidRoot>
        <AppearanceShortcut />
        <AuthProvider>{children}</AuthProvider>
      </FluidRoot>
    </ThemeProvider>
  );
}
