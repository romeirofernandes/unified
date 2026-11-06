// Adapted from beUI Feedback Widget (MIT): https://beui.dev/r/feedback-widget/raw
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from "motion/react";

// The same curve and geometry run in both directions, including interrupted closes.
const ease = [0.22, 1, 0.36, 1];
export default function FeedbackShell({
  open,
  onOpen,
  onClose,
  pending,
  style,
  children,
  success,
}) {
  const reduced = useReducedMotion();
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const key = (event) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    const outside = (event) => {
      if (!pending && !root.current?.contains(event.target)) onClose();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, pending, onClose]);
  const hidden = reduced
    ? { opacity: 0 }
    : { opacity: 0, x: 32, scale: 0.97, filter: "blur(2px)" };
  return createPortal(
    <div
      ref={root}
      style={style}
      className="fixed bottom-4 right-4 z-50 text-[var(--uf-text)]"
    >
      <Motion.div
        layout
        initial={false}
        animate={{ borderRadius: open ? 8 : 28 }}
        transition={{
          layout: { duration: reduced ? 0 : 0.35, ease },
          borderRadius: { duration: reduced ? 0 : 0.35, ease },
        }}
        style={{ transformOrigin: "bottom right" }}
        className={`overflow-hidden border border-[var(--uf-border)] bg-[var(--uf-background)] shadow-xl ${open ? "w-[min(420px,calc(100vw-2rem))]" : "size-14"}`}
      >
        <AnimatePresence
          initial={false}
          mode="popLayout"
          onExitComplete={() => {
            if (!open) trigger.current?.focus();
          }}
        >
          {open ? (
            <Motion.div
              key="panel"
              id={panelId}
              role="dialog"
              aria-label="Feedback form"
              initial={hidden}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={hidden}
              transition={{ duration: reduced ? 0.12 : 0.35, ease }}
              onAnimationComplete={() =>
                root.current
                  ?.querySelector(
                    'input, textarea, [role="slider"], [role="listbox"]',
                  )
                  ?.focus()
              }
              className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
            >
              {success ? (
                <div role="status" className="p-8 text-center">
                  <h2 className="text-lg font-semibold">Thank you!</h2>
                  <p className="mt-2 text-sm text-[var(--uf-muted)]">
                    Your feedback has been sent.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 h-10 rounded-md bg-[var(--uf-accent)] px-5 text-[var(--uf-accentText)]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                children
              )}
            </Motion.div>
          ) : (
            <Motion.button
              key="trigger"
              ref={trigger}
              type="button"
              aria-label="Open feedback form"
              aria-haspopup="dialog"
              aria-expanded={open}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onOpen}
              className="flex size-14 items-center justify-center text-[var(--uf-accent)] focus-visible:outline-2 focus-visible:-outline-offset-4"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 1V11.5a9 9 0 1 1 18 0Z" />
                <path d="M7 9h10M7 13h7" />
              </svg>
            </Motion.button>
          )}
        </AnimatePresence>
      </Motion.div>
    </div>,
    document.body,
  );
}
