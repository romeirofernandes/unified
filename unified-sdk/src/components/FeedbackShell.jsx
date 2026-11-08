// Adapted from beUI Feedback Widget (MIT): https://beui.dev/r/feedback-widget/raw
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion as Motion, useMotionValue, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import Checkmark from "../../../shared/controls/checkmark";
import FeedbackLauncher from "../../../shared/FeedbackLauncher";
import WidgetPortal from "./WidgetPortal";
import Disintegrate from "./Disintegrate";
import { morphTransitions } from "./feedback-motion.mjs";

const spring = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };
export default function FeedbackShell({ open, onOpen, onClose, onCloseComplete, pending, style, children, success, theme, position = "bottom-right", launcher = {}, storageKey }) {
  const reduced = useReducedMotion();
  const dragX = useMotionValue(0), dragY = useMotionValue(0);
  const root = useRef(null), trigger = useRef(null), trash = useRef(null);
  const dragged = useRef(false);
  const wasOpen = useRef(open);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [phase, setPhase] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1" ? "dismissed" : "visible"; } catch { return "visible"; }
  });
  const [destructionRect, setDestructionRect] = useState(null);
  const panelId = useId();
  const left = position === "bottom-left";
  const transitions = morphTransitions(open, reduced);
  const contentOffset = left ? -40 : 40;
  function isOver(point) {
    const bounds = trash.current?.getBoundingClientRect();
    return Boolean(bounds && point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom);
  }
  useEffect(() => {
    if (!open) return;
    const key = event => { if (event.key === "Escape" && !event.defaultPrevented && !pending) onClose(); };
    const outside = event => { if (!pending && !event.composedPath().includes(root.current)) onClose(); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [open, pending, onClose]);
  useEffect(() => {
    if (open) { wasOpen.current = true; return; }
    if (!wasOpen.current) return;
    const closing = morphTransitions(false, reduced);
    // Wait for the final button color and label reveal before restoring focus or unmounting.
    const completeAfter = Math.max(closing.surface.layout?.duration ?? 0, (closing.trigger.opacity.delay ?? 0) + closing.trigger.opacity.duration);
    const timer = setTimeout(() => {
      wasOpen.current = false;
      trigger.current?.focus({ preventScroll: true });
      onCloseComplete?.();
    }, completeAfter * 1000);
    return () => clearTimeout(timer);
  }, [open, reduced, onCloseComplete]);
  if (phase === "dismissed") return null;
  return <WidgetPortal>
    <div className="unified-feedback-root" data-theme={theme} style={style}>
      {phase === "visible" && <div ref={root} className={`uf-position ${left ? "uf-position-left" : ""}`}>
        <Motion.div layout initial={false} drag={!open && !pending} dragMomentum={false}
          onDragStart={() => { dragged.current = true; setDragging(true); }}
          onDrag={(_, info) => setOverTrash(isOver(info.point))}
          onDragEnd={(_, info) => {
            if (isOver(info.point)) {
              try { localStorage.setItem(storageKey, "1"); } catch { /* Storage can be disabled. */ }
              setDestructionRect(trigger.current.getBoundingClientRect());
              setPhase("disintegrating");
            } else {
              animate(dragX, 0, reduced ? { duration: 0 } : spring);
              animate(dragY, 0, reduced ? { duration: 0 } : spring);
            }
            setDragging(false); setOverTrash(false);
          }}
          className={`uf-morph-surface ${open ? "uf-panel" : "uf-launcher-surface"}`}
          animate={{ borderRadius: open ? 20 : ["rounded", "tab"].includes(launcher.style) ? 14 : 40 }}
          transition={transitions.surface}
          style={{ backgroundColor: "transparent", transformOrigin: left ? "bottom left" : "bottom right", x: dragX, y: dragY }}>
          <Motion.div className="uf-surface-paint" aria-hidden="true" initial={false}
            animate={{ opacity: open ? 1 : 0 }} transition={transitions.paint} />
          {/* Exit-positioning rules must live inside the widget’s Shadow DOM. */}
          <AnimatePresence initial={false} mode="popLayout" root={root.current?.getRootNode()}>
            {open ? <Motion.div key="panel" id={panelId} role="dialog" aria-label="Feedback form" aria-busy={pending || undefined}
              style={{ transformOrigin: left ? "bottom left" : "bottom right", color: "var(--uf-text)" }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: contentOffset, scale: 0.97, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: morphTransitions(false, reduced).content }}
              transition={transitions.content}
              onAnimationComplete={() => {
                if (open) root.current?.querySelector('input:not(:disabled), textarea:not(:disabled), [role="radio"], [role="slider"], [data-success-close]')?.focus({ preventScroll: true });
              }}>
              <Motion.div layout="position">
                {success ? <div role="status" className="uf-success">
                <Motion.div className="uf-success-icon" initial={{ scale: reduced ? 1 : 0 }} animate={{ scale: 1 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 22, delay: 0.04 }}><Checkmark size={24} /></Motion.div>
                <h2>Thank you!</h2><p>Your feedback has been sent.</p>
                <button data-success-close type="button" onClick={onClose} className="uf-button uf-button-primary">Done</button>
                </div> : children}
              </Motion.div>
            </Motion.div> : <Motion.div key="trigger" layout="position" className="uf-drag-handle" style={{ touchAction: "none", transformOrigin: left ? "bottom left" : "bottom right" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ ...(reduced ? { opacity: 0 } : { opacity: 0, x: -contentOffset, filter: "blur(2px)" }), transition: morphTransitions(true, reduced).content }}
            transition={transitions.trigger}>
            <button ref={trigger} type="button" className={`uf-trigger uf-trigger-${launcher.style || "pill"}`} aria-label="Open feedback form" aria-haspopup="dialog" aria-controls={panelId} aria-expanded={open}
              onPointerDown={() => { dragged.current = false; }}
              onClick={() => { if (!dragged.current) { if (open) { if (!pending) onClose(); } else onOpen(); } }}>
              <Motion.span className="uf-launcher-content" initial={false}
                animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 45, scale: 0.97, transition: morphTransitions(true, reduced).content }} transition={transitions.trigger}>
                <FeedbackLauncher launcher={launcher} />
              </Motion.span>
            </button>
          </Motion.div>}
          </AnimatePresence>
        </Motion.div>
      </div>}
      <AnimatePresence>{dragging && <Motion.div key="delete" className="uf-delete-dock" initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 10 }} transition={reduced ? { duration: 0 } : spring}>
        <div ref={trash} className="uf-delete-zone" data-active={overTrash || undefined} role="region" aria-label="Drop here to remove feedback">
          <span className="uf-delete-icon"><HugeiconsIcon icon={Delete02Icon} size={20} aria-hidden="true" /></span>
          <span>{overTrash ? "Release to remove" : "Drop to remove"}</span>
        </div>
      </Motion.div>}</AnimatePresence>
      {phase === "disintegrating" && <Disintegrate rect={destructionRect} reduced={reduced} launcher={launcher} onComplete={() => setPhase("dismissed")} />}
    </div>
  </WidgetPortal>;
}
