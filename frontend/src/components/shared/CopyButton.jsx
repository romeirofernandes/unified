import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useIcons } from "@/lib/icon-context";

export default function CopyButton({ value, label = "code", showLabel = false }) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);
  const reduce = useReducedMotion();
  const icons = useIcons();
  const Icon = status === "copied" ? icons.check : icons.copy;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setStatus("idle"); }, [value]);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="relative inline-flex shrink-0 items-center">
      <span role="status" className="sr-only">{status === "copied" ? `Copied ${label}` : status === "error" ? "Copy failed. Please try again." : ""}</span>
      <Button variant="secondary" size={showLabel ? "default" : "icon"} onClick={copy} aria-label={status === "copied" ? `Copied ${label}` : `Copy ${label}`} title={`Copy ${label}`}>
        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <AnimatePresence initial={false} mode="wait">
            <Motion.span key={status === "copied" ? "check" : "copy"} className="inline-flex size-4 shrink-0 items-center justify-center" initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.6 }} transition={{ duration: reduce ? 0 : 0.15 }}>
              <Icon size={16} aria-hidden="true" />
            </Motion.span>
          </AnimatePresence>
          {showLabel && <span>{status === "copied" ? "Copied" : `Copy ${label}`}</span>}
        </span>
      </Button>
      {status === "error" && <span className="absolute end-0 top-full mt-1 whitespace-nowrap text-xs text-destructive">Copy failed. Try again.</span>}
    </div>
  );
}
