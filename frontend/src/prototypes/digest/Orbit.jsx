import IsometricFigure from "@/components/landing/isometric/IsometricFigure";
import { DigestSection, Destination, FeedbackNote } from "./shared";
export default function Orbit() {
  return <DigestSection name="orbit">{({ playing, channel }) => <>
    <svg className="digest-orbit-track" viewBox="0 0 640 470" aria-hidden="true"><ellipse cx="320" cy="245" rx="255" ry="135" fill="none" stroke="var(--digest-scene-line)" strokeDasharray="2 8" /><path d="m553 207 10 8 3-12" fill="none" stroke="var(--digest-scene-line)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <div className="orbit-board"><IsometricFigure name="kanban" playing={playing} /></div>
    <div className="orbit-mail"><IsometricFigure name="mail" playing={playing} /></div>
    <FeedbackNote className="orbit-note" />
    <div className="orbit-clock"><span className="orbit-clock-dot" /><span>On your schedule</span><strong>Hourly or daily.</strong></div>
    <Destination channel={channel} />
    <span className="digest-stage-label orbit-feedback-label">Feedback keeps coming.</span>
  </>}</DigestSection>;
}
