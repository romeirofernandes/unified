// Motion inspired by beUI Feedback Widget (MIT): https://beui.dev/r/feedback-widget/raw
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion as Motion, useMotionValue, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import FeedbackLauncher from "../../../shared/FeedbackLauncher";
import WidgetPortal from "./WidgetPortal";

const spring = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };
export default function FeedbackShell({ open, onOpen, onClose, pending, style, children, success, theme, position = "bottom-right", launcher = {}, storageKey }) {
  const reduced = useReducedMotion();
  const dragX = useMotionValue(0), dragY = useMotionValue(0);
  const root = useRef(null), trigger = useRef(null), trash = useRef(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [phase, setPhase] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1" ? "dismissed" : "visible"; } catch { return "visible"; }
  });
  const panelId = useId();
  const left = position === "bottom-left";
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
  if (phase === "dismissed") return null;
  return <WidgetPortal>
    <div className="unified-feedback-root" data-theme={theme} style={style}>
      <div ref={root} className={`uf-position ${left ? "uf-position-left" : ""}`}>
        <AnimatePresence onExitComplete={() => { if (!open) trigger.current?.focus({ preventScroll: true }); }}>
          {open && <Motion.div key="panel" className="uf-panel" id={panelId} role="dialog" aria-label="Feedback form" aria-busy={pending || undefined}
            style={{ transformOrigin: left ? "bottom left" : "bottom right" }}
            initial={{ opacity: 0, y: reduced ? 0 : 10, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 6, scale: reduced ? 1 : 0.98 }}
            transition={reduced ? { duration: 0 } : { ...spring, opacity: { duration: 0.16 } }}
            onAnimationComplete={() => {
              if (open) root.current?.querySelector('input:not(:disabled), textarea:not(:disabled), [role="slider"], [data-success-close]')?.focus({ preventScroll: true });
            }}>
            {success ? <div role="status" className="uf-success">
              <div className="uf-success-icon"><HugeiconsIcon icon={Tick02Icon} size={24} aria-hidden="true" /></div>
              <h2>Thank you!</h2><p>Your feedback has been sent.</p>
              <button data-success-close type="button" onClick={onClose} className="uf-button uf-button-primary">Done</button>
            </div> : children}
          </Motion.div>}
        </AnimatePresence>
        <Motion.div drag={!open && !pending} dragMomentum={false}
          onDragStart={() => { dragged.current = true; setDragging(true); }}
          onDrag={(_, info) => setOverTrash(isOver(info.point))}
          onDragEnd={(_, info) => {
            if (isOver(info.point)) {
              try { localStorage.setItem(storageKey, "1"); } catch { /* Storage can be disabled. */ }
              setPhase("dismissed");
            } else {
              animate(dragX, 0, reduced ? { duration: 0 } : spring);
              animate(dragY, 0, reduced ? { duration: 0 } : spring);
            }
            setDragging(false); setOverTrash(false);
          }}
          className="uf-drag-handle" style={{ touchAction: "none", x: dragX, y: dragY }}
          animate={{ scale: overTrash ? 0.9 : 1 }} transition={reduced ? { duration: 0 } : spring}>
          <button ref={trigger} type="button" className={`uf-trigger uf-trigger-${launcher.style || "pill"}`} aria-label="Open feedback form" aria-haspopup="dialog" aria-controls={panelId} aria-expanded={open}
            onPointerDown={() => { dragged.current = false; }}
            onClick={() => { if (!dragged.current) { if (open) { if (!pending) onClose(); } else onOpen(); } }}>
            <FeedbackLauncher launcher={launcher} />
          </button>
        </Motion.div>
      </div>
      <AnimatePresence>{dragging && <Motion.div key="delete" className="uf-delete-dock" initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 10 }} transition={reduced ? { duration: 0 } : spring}>
        <div ref={trash} className="uf-delete-zone" data-active={overTrash || undefined} role="region" aria-label="Drop here to remove feedback">
          <span className="uf-delete-icon"><HugeiconsIcon icon={Delete02Icon} size={20} aria-hidden="true" /></span>
          <span>{overTrash ? "Release to remove" : "Drop to remove"}</span>
        </div>
      </Motion.div>}</AnimatePresence>
    </div>
  </WidgetPortal>;
}
