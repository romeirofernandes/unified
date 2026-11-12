import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import IsometricFigure from "./isometric/IsometricFigure";
import "./feedback-loop.css";

function DottedArrow({ className }) {
  return <svg className={`feedback-dotted-arrow ${className}`} viewBox="0 0 144 64" fill="none" aria-hidden="true"><path d="M5 32 C43 8 92 56 135 32" stroke="currentColor" strokeWidth="0.5" strokeDasharray="0.5 4" strokeLinecap="round" /><path d="m126 28 9 4-5 8" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const steps = [
  { id:"browser", number:"01", title:"Listen inside your product", text:"Customers leave a note where the problem happens. Their original words stay attached to the issue." },
  { id:"kanban", number:"02", title:"Give the issue a place", text:"Related responses become one workbench card. Follow it from To do to Done, with the evidence close by." },
  { id:"devices", number:"03", title:"Prepare a fix for review", text:"A focused issue can become a proposed patch and a draft pull request. You review the code before merging." },
  { id:"mail", number:"04", title:"Tell people it’s fixed", text:"After the fix reaches users, send an update to the reporters who asked to hear back." },
];
export default function FeedbackLoop() {
  const ref = useRef(null);
  const visible = useInView(ref, { amount:0.05 });
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  return <section ref={ref} id="capabilities" className="feedback-loop" aria-labelledby="feedback-loop-title">
    <div className="feedback-loop-wrap">
      <header className="feedback-loop-heading"><div><p className="landing-eyebrow">The whole feedback loop</p><h2 id="feedback-loop-title">Feedback has a<br />next step now.</h2></div><div><p>Listen to what’s getting in the way, carry the context into the fix, and let the people who reported it know what changed.</p></div></header>
      <div id="how-it-works" className="feedback-cycle">
        {steps.map(step => <article className={`feedback-cycle-step step-${step.id}`} key={step.id}>
          <button className="feedback-cycle-art" type="button" aria-label={`Play animation: ${step.title}`} aria-pressed={pinned === step.id} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(step.id); }} onPointerLeave={() => setHovered(null)} onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setHovered(step.id); }} onBlur={() => setHovered(null)} onClick={() => setPinned(pinned === step.id ? null : step.id)}>
            <IsometricFigure name={step.id} playing={visible && !reduced && (hovered === step.id || pinned === step.id)} />
            {step.id === "devices" && <span className="feedback-figure-label">Draft pull request <span aria-hidden="true">↗</span></span>}
          </button>
          <div className="feedback-cycle-copy"><p className="landing-eyebrow">{step.number}</p><h3>{step.title}</h3><p>{step.text}</p></div>
          {step.id !== "mail" && <DottedArrow className="feedback-mobile-arrow" />}
        </article>)}
        <span className="feedback-cycle-center" aria-hidden="true">Listen.<br />Build. Repeat.</span>
        {["top","right","bottom","left"].map(position => <DottedArrow key={position} className={`feedback-cycle-arrow arrow-${position}`} />)}
      </div>
    </div>
  </section>;
}
