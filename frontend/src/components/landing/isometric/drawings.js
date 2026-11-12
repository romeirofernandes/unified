import browser from "./browser.svg?raw";
import kanban from "./kanban.svg?raw";
import devices from "./devices.svg?raw";
import mail from "./mail.svg?raw";
export const drawings = { browser, kanban, devices, mail };
export const drawingContents = Object.fromEntries(Object.entries(drawings).map(([name, svg]) => [name, svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")]));
