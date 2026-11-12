import { drawings } from "./drawings";
import "./isometric.css";

export default function IsometricFigure({ name, playing = false, className = "" }) {
  return <span className={`isometric-figure iso-${name} ${className}`} data-playing={playing || undefined} aria-hidden="true" dangerouslySetInnerHTML={{ __html: drawings[name] }} />;
}
