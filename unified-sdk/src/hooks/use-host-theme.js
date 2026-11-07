import { useEffect, useState } from "react";

export function readHostTheme(anchor, systemDark = false) {
  for (let node = anchor?.parentElement; node; node = node.parentElement) {
    const value = node.getAttribute("data-theme") || node.getAttribute("data-mode") || node.getAttribute("data-bs-theme") || node.getAttribute("data-mui-color-scheme") || node.getAttribute("data-color-mode");
    if (value === "dark" || value === "light") return value;
    if (node.classList.contains("dark")) return "dark";
    if (node.classList.contains("light")) return "light";
  }
  const scheme = anchor?.parentElement ? getComputedStyle(anchor.parentElement).colorScheme.trim() : "normal";
  if (scheme === "dark" || scheme === "light") return scheme;
  return systemDark ? "dark" : "light";
}

export function useHostTheme(preference = "auto", savedTheme = "light") {
  const [anchor, setAnchor] = useState(null);
  const [detected, setDetected] = useState("light");
  useEffect(() => {
    if (!anchor || preference !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDetected(readHostTheme(anchor, media.matches));
    const observer = new MutationObserver(update);
    for (let node = anchor.parentElement; node; node = node.parentElement) {
      observer.observe(node, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-mode", "data-bs-theme", "data-mui-color-scheme", "data-color-mode"] });
    }
    media.addEventListener("change", update);
    update();
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, [anchor, preference]);
  const mode = preference === "project" ? savedTheme : preference === "light" || preference === "dark" ? preference : detected;
  return { mode, anchorRef: setAnchor };
}
