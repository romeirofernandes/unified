import IsometricFigure from "@/components/landing/isometric/IsometricFigure";
import { DigestSection, Destination, FeedbackNote } from "./shared";
export default function Dispatch() {
  return <DigestSection name="dispatch">{({ playing, channel }) => <>
    <svg className="digest-dispatch-route" viewBox="0 0 640 470" aria-hidden="true"><path d="M190 210 340 125 520 230 355 330" fill="none" stroke="var(--digest-scene-line)" strokeDasharray="3 7" strokeLinecap="round" /></svg>
    <div className="dispatch-board"><IsometricFigure name="kanban" playing={playing} /></div>
    <div className="dispatch-mail"><IsometricFigure name="mail" playing={playing} /></div>
    <FeedbackNote className="dispatch-letter" />
    <span className="digest-stage-label dispatch-source">New feedback, gathered</span>
    <Destination channel={channel} />
    <div className="dispatch-state" aria-hidden="true"><span>Gather the useful parts.</span><span>Prepare your digest.</span><span>Send it where you work.</span></div>
  </>}</DigestSection>;
}
