import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

export function DigestSection({ name, children }) {
  const ref = useRef(null);
  const visible = useInView(ref, { amount:0.15 });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [channel, setChannel] = useState("email");
  return <section ref={ref} id="digest-section" className={`digest-study digest-${name}`} aria-labelledby="digest-study-title">
    <div className="digest-study-wrap"><div className="digest-study-copy"><p className="landing-eyebrow">Email + Slack</p><h2 id="digest-study-title">Less checking.<br />More knowing.</h2><p>Get the useful part of new feedback in the tools you already check. Choose an hourly or daily digest, then get back to building.</p><div className="digest-destinations" aria-label="Digest destination"><button type="button" aria-pressed={channel === "email"} onClick={() => setChannel("email")}><img src="/logos/gmail.svg" alt="" />Email</button><button type="button" aria-pressed={channel === "slack"} onClick={() => setChannel("slack")}><img src="/logos/slack.svg" alt="" />Slack</button></div><p className="digest-destination-note" role="status">{channel === "email" ? "A digest in your account’s inbox." : "A digest in your team’s channel."}</p></div><div className="digest-study-visual"><div className="digest-scene" data-playing={visible && !paused && !reduced ? "true" : "false"} data-channel={channel} aria-label={`${name} animated digest illustration`} role="img">{children({ playing:visible && !paused && !reduced, channel })}</div><div className="digest-animation-controls"><span>{reduced ? "Reduced motion · still preview" : "A repeating illustration · sample feedback"}</span><button type="button" disabled={reduced} onClick={() => setPaused(!paused)}>{paused || reduced ? "Play animation" : "Pause animation"}</button></div></div></div>
  </section>;
}
export function FeedbackNote({ className = "" }) {
  return <svg className={`digest-feedback-note ${className}`} viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M17 18 78 53 78 95 17 60Z" fill="var(--digest-note-face)" stroke="var(--digest-scene-line)" strokeWidth="1.1" strokeLinejoin="round"/><path d="m25 35 42 24m-42-13 33 19m-33-8 24 14" stroke="var(--digest-scene-line)" strokeWidth="1.4" strokeLinecap="round"/><path d="m17 18 4-2 61 35-4 2" fill="var(--digest-note-top)" stroke="var(--digest-scene-line)" strokeWidth=".7"/><path d="m78 53 4-2v42l-4 2" fill="var(--digest-note-side)" stroke="var(--digest-scene-line)" strokeWidth=".7"/></svg>;
}
export function Destination({ channel }) {
  return <span className="digest-scene-destination"><img src={channel === "email" ? "/logos/gmail.svg" : "/logos/slack.svg"} alt="" />{channel === "email" ? "Your inbox" : "#product-feedback"}</span>;
}
