import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function usePreviewTheme(isOpen = true) {
  const { resolvedTheme } = useTheme();
  const [override, setOverride] = useState(null);
  useEffect(() => {
    if (!isOpen) setOverride(null);
  }, [isOpen]);
  return [override ?? (resolvedTheme === "dark" ? "dark" : "light"), setOverride];
}
