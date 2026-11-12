import IsometricFigure from "@/components/landing/isometric/IsometricFigure";
import { DigestSection, Destination, FeedbackNote } from "./shared";
export default function Signal() {
  return <DigestSection name="signal">{({ playing, channel }) => <>
    <div className="signal-ground" aria-hidden="true" />
    <div className="signal-mail"><IsometricFigure name="mail" playing={playing} /></div>
    {[0,1,2].map(index => <FeedbackNote key={index} className={`signal-note signal-note-${index}`} />)}
    <div className="signal-fragments" aria-hidden="true"><span>“Could we search older responses?”</span><span>“Please add search by email.”</span><span>“Finding old feedback takes time.”</span></div>
    <div className="signal-summary"><span className="digest-stage-label">One clear issue</span><strong>Make older feedback easier to find.</strong></div>
    <Destination channel={channel} />
  </>}</DigestSection>;
}
