import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useIcons } from "@/lib/icon-context";

export default function CopyButton({ value, label = "code" }) {
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
    <div className="flex items-center gap-2">
      <span role="status" className="text-xs text-muted-foreground">
        {status === "copied" ? "Copied" : status === "error" ? "Select and copy manually" : ""}
      </span>
      <Button variant="secondary" size="icon" onClick={copy} aria-label={status === "copied" ? `Copied ${label}` : `Copy ${label}`} title={`Copy ${label}`}>
        <AnimatePresence initial={false} mode="wait">
          <Motion.span key={status === "copied" ? "check" : "copy"} className="flex items-center justify-center" initial={{ opacity: 0, scale: reduce ? 1 : 0.6, rotate: reduce ? 0 : -35 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.6 }} transition={{ duration: reduce ? 0 : 0.15 }}>
            <Icon size={16} aria-hidden="true" />
          </Motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
}
