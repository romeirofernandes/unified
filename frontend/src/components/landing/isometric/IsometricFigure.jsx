import browser from "./browser.svg?raw";
import kanban from "./kanban.svg?raw";
import devices from "./devices.svg?raw";
import mail from "./mail.svg?raw";
import "./isometric.css";

const drawings = { browser, kanban, devices, mail };
export default function IsometricFigure({ name, playing = false, className = "" }) {
  return <span className={`isometric-figure iso-${name} ${className}`} data-playing={playing || undefined} aria-hidden="true" dangerouslySetInnerHTML={{ __html: drawings[name] }} />;
}
