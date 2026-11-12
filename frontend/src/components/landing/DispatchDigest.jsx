import { useEffect, useId, useRef, useState } from "react";
import { useInView } from "motion/react";
import { drawingContents } from "./isometric/drawings";
import "./dispatch-digest.css";

// The message and dashed connector share this exact geometry in one SVG viewport.
const deliveryPaths = {
  desktop:"M227 156 L318 103 Q326 98 334 103 L469 181 Q477 186 477 196 L477 256",
  mobile:"M155 238 C155 278 180 286 180 321 L180 388",
};
export default function DispatchDigest() {
  const section = useRef(null);
  const svg = useRef(null);
  const visible = useInView(section, { amount:0.15 });
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setMobile(media.matches); setReduced(motion.matches); };
    media.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); motion.removeEventListener("change", update); };
  }, []);
  const routeId = `delivery-${useId().replace(/:/g, "")}`;
  const playing = visible && !reduced;
  useEffect(() => {
    if (!svg.current) return;
    if (playing) svg.current.unpauseAnimations();
    else svg.current.pauseAnimations();
    if (reduced) svg.current.setCurrentTime(4);
  }, [playing, reduced]);
  return <section ref={section} id="digest-section" className="dispatch-digest" aria-labelledby="digest-title">
    <div className="dispatch-digest-wrap">
      <div className="dispatch-digest-copy"><p className="landing-eyebrow">Email + Slack</p><h2 id="digest-title">Less checking.<br />More knowing.</h2><p>Get the useful part of new feedback in the tools you already check. Choose an hourly or daily digest, then get back to building.</p></div>
      <div className="dispatch-digest-visual">
        <svg ref={svg} className="dispatch-drawing isometric-palette" viewBox={mobile ? "0 0 360 600" : "0 0 640 470"} role="img" aria-label="A feedback digest travels from the workbench to your inbox or channel" data-playing={playing}>
          <path id={routeId} className="dispatch-route" d={mobile ? deliveryPaths.mobile : deliveryPaths.desktop} fill="none" stroke="var(--dispatch-route-ink)" strokeWidth="1" strokeDasharray="5 5" strokeLinecap="round" />
          <g className="dispatch-board" transform={mobile ? "translate(16 -8) scale(1.15)" : "translate(-15 -5) scale(1.3)"} dangerouslySetInnerHTML={{ __html:drawingContents.kanban }} />
          <g className="dispatch-mail" transform={mobile ? "translate(40 320) scale(1.15)" : "translate(340 190) scale(1.1)"} dangerouslySetInnerHTML={{ __html:drawingContents.mail }} />
          <g className="dispatch-message">
            <animateMotion dur="8s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.12;0.88;1" calcMode="linear"><mpath href={`#${routeId}`} /></animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="8s" repeatCount="indefinite" />
            <g transform="translate(-24.75 -27.75) scale(0.5)" fill="none" stroke="var(--iso-ink)" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round"><path d="M17 18 78 53 78 95 17 60Z" fill="var(--iso-paper)" /><path d="m25 35 42 24m-42-13 33 19m-33-8 24 14" /><path d="m17 18 4-2 61 35-4 2" fill="var(--iso-paper-side)" /><path d="m78 53 4-2v42l-4 2" fill="var(--iso-face)" /></g>
          </g>
        </svg>
        <div className="dispatch-destinations" aria-label="Digest destinations"><span className="dispatch-destination-badge"><img src="/logos/gmail.svg" alt="" />Your inbox</span><span className="dispatch-destination-join" aria-hidden="true">&amp;</span><span className="dispatch-destination-badge"><img src="/logos/slack.svg" alt="" />Your channel</span></div>

      </div>
    </div>
  </section>;
}
