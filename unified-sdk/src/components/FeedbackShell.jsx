// Adapted from beUI Feedback Widget (MIT): https://beui.dev/r/feedback-widget/raw
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion as Motion, useMotionValue, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, Cancel01Icon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import WidgetPortal from "./WidgetPortal";
import Disintegrate from "./Disintegrate";

const ease = [0.22, 1, 0.36, 1];
export default function FeedbackShell({ open, onOpen, onClose, pending, style, children, success, theme, position = "bottom-right" }) {
  const reduced = useReducedMotion();
  const themeRoot = useRef(null);
  const dragX = useMotionValue(0), dragY = useMotionValue(0);
  const root = useRef(null), trigger = useRef(null), trash = useRef(null);
  const wasOpen = useRef(false);
  const [panelVisible, setPanelVisible] = useState(open);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState("visible");
  const [rect, setRect] = useState(null);
  const panelId = useId();
  useLayoutEffect(() => {
    const node = themeRoot.current;
    if (!node) return;
    node.classList.add("uf-theme-swap");
    void getComputedStyle(node).color;
    const frame = requestAnimationFrame(() => node.classList.remove("uf-theme-swap"));
    return () => { cancelAnimationFrame(frame); node.classList.remove("uf-theme-swap"); };
  }, [theme]);
  useEffect(() => {
    if (open) setPanelVisible(true);
    if (!open) return;
    const key = (event) => { if (event.key === "Escape" && !event.defaultPrevented && !pending) onClose(); };
    const outside = (event) => { if (!pending && !event.composedPath().includes(root.current)) onClose(); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [open, pending, onClose]);
  useEffect(() => {
    if (phase !== "hidden") return;
    const timer = setTimeout(() => setPhase("dismissed"), 6000);
    return () => clearTimeout(timer);
  }, [phase]);
  function destroy() {
    if (pending || !trigger.current) return;
    setRect(trigger.current.getBoundingClientRect());
    setPhase("disintegrating");
    setDragging(false);
    dragX.set(0); dragY.set(0);
  }
  const left = position === "bottom-left";
  return <WidgetPortal>
    <div ref={themeRoot} className="unified-feedback-root" data-theme={theme} style={style}>
      <div ref={root} className={`uf-position ${left ? "uf-position-left" : ""}`}>
        {phase === "visible" && <Motion.div layout initial={false} className={open || panelVisible ? "uf-panel" : "uf-trigger-wrap"}
          style={{ transformOrigin: left ? "bottom left" : "bottom right" }}
          transition={{ layout: { duration: reduced ? 0 : 0.28, ease } }}>
          <AnimatePresence initial={false} mode="wait" onExitComplete={() => {
            if (!open) setPanelVisible(false);
            if (!open && wasOpen.current) { requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); wasOpen.current = false; }
          }}>
            {open ? <Motion.div key="panel" id={panelId} role="dialog" aria-label="Feedback form" aria-busy={pending || undefined}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 4 }}
              transition={{ duration: reduced ? 0.12 : 0.18, ease }}
              onAnimationComplete={() => {
                wasOpen.current = true;
                root.current?.querySelector('input:not(:disabled), textarea:not(:disabled), [role="slider"], [data-success-close]')?.focus({ preventScroll: true });
              }}>
              {success ? <div role="status" className="uf-success">
                <div className="uf-success-icon"><HugeiconsIcon icon={Tick02Icon} size={24} aria-hidden="true" /></div>
                <h2>Thank you!</h2><p>Your feedback has been sent.</p>
                <button data-success-close type="button" onClick={onClose} className="uf-button uf-button-primary">Done</button>
              </div> : children}
            </Motion.div> : <Motion.div key="trigger" className="uf-trigger-controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <Motion.div drag dragMomentum={false} onDragStart={() => setDragging(true)}
                onDragEnd={(_, info) => {
                  const bounds = trash.current?.getBoundingClientRect();
                  if (bounds && info.point.x >= bounds.left - 20 && info.point.x <= bounds.right + 20 && info.point.y >= bounds.top - 20 && info.point.y <= bounds.bottom + 20) destroy();
                  else {
                    setDragging(false);
                    animate(dragX, 0, { duration: reduced ? 0 : 0.2, ease });
                    animate(dragY, 0, { duration: reduced ? 0 : 0.2, ease });
                  }
                }}
                className="uf-drag-handle" style={{ touchAction: "none", x: dragX, y: dragY }}>
                <button ref={trigger} type="button" className="uf-trigger" aria-label="Open feedback form" aria-haspopup="dialog" aria-controls={panelId} aria-expanded={false} onClick={onOpen}>
                  <HugeiconsIcon icon={BubbleChatIcon} size={18} aria-hidden="true" /><span>Feedback</span>
                </button>
              </Motion.div>
              {!dragging && <button type="button" className="uf-hide" aria-label="Hide feedback widget" title="Hide feedback widget" onClick={destroy}><HugeiconsIcon icon={Cancel01Icon} size={12} aria-hidden="true" /></button>}
            </Motion.div>}
          </AnimatePresence>
        </Motion.div>}
        {phase === "hidden" && <div className="uf-undo" role="status"><span>Feedback hidden</span><button type="button" onClick={() => { setPhase("visible"); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); }}>Undo</button></div>}
      </div>
      <AnimatePresence>{dragging && <Motion.div ref={trash} className="uf-delete-zone" role="region" aria-label="Drop here to hide feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <HugeiconsIcon icon={Delete02Icon} size={20} aria-hidden="true" /><span>Drop to hide</span>
      </Motion.div>}</AnimatePresence>
      {phase === "disintegrating" && <Disintegrate rect={rect} reduced={reduced} onComplete={() => setPhase("hidden")} />}
    </div>
  </WidgetPortal>;
}
