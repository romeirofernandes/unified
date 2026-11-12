import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SectionHeading({ number, title, children }) {
  return <div className="lp-section-heading"><p className="lp-eyebrow">{number}</p><h2>{title}</h2><p>{children}</p></div>;
}
const tasks = [
  { id: "search", title: "Search older responses", people: "2 responses", status: "To do", quote: "I remember someone mentioning exports, but I can’t find their message." },
  { id: "digest", title: "Send a weekly digest", people: "1 response", status: "In progress", quote: "I’d love a weekly email with the recurring issues. Daily is a little much for our team." },
  { id: "radio", title: "Show the selected radio option", people: "1 response", status: "Done", quote: "There’s no dot to tell me which one I picked." },
];
export function DemoBoard({ compact = false }) {
  const [items, setItems] = useState(tasks);
  const [selected, setSelected] = useState(null);
  return <div className={`lp-board-demo ${compact ? "is-compact" : ""}`}>
    <div className="lp-app-title"><span>Acme website <i>/</i> Workbench</span><span className="lp-sample">Sample project</span></div>
    <div className="lp-board">{["To do", "In progress", "Done"].map((status, index) => <div className="lp-lane" key={status}><h3><span style={{ background: ["#6e8bbd", "#c0965e", "#729980"][index] }} />{status}<small>{items.filter(item => item.status === status).length}</small></h3>{items.filter(item => item.status === status).map(item => <article key={item.id}><button className="lp-task" onClick={() => setSelected(item)}><span className="lp-task-id">U-{item.id === "search" ? "12" : item.id === "digest" ? "13" : "14"}</span><strong>{item.title}</strong><span className="lp-task-source">{item.people} linked</span></button><label className="lp-task-status"><span className="sr-only">Status for {item.title}</span><select value={status} onChange={event => setItems(items.map(task => task.id === item.id ? { ...task, status: event.target.value } : task))}>{["To do", "In progress", "Done"].map(option => <option key={option}>{option}</option>)}</select><span aria-hidden="true">↗</span></label></article>)}</div>)}</div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="bg-card text-foreground"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Original feedback · {selected?.people} linked</DialogDescription></DialogHeader><blockquote className="text-sm leading-7">“{selected?.quote}”</blockquote><p className="text-xs text-muted-foreground">This is sample feedback. In your workspace, this card opens the original linked responses.</p></DialogContent></Dialog>
  </div>;
}
export function DemoPatch() {
  const [prepared, setPrepared] = useState(false);
  return <div className="lp-patch-demo"><div className="lp-app-title"><span>Pull requests <i>/</i> Prepare patch</span><span className="lp-sample">Sample run</span></div><ol className="lp-run-steps"><li><span>✓</span>Assess scope <small>One existing UI label</small></li><li><span>{prepared ? "✓" : "2"}</span>Prepare patch <small>{prepared ? "Exact replacement validated" : "Ready to preview"}</small></li><li><span>{prepared ? "3" : "·"}</span>Draft pull request <small>Human review before merge</small></li></ol><div className="lp-diff"><div>src/components/Editor.tsx</div><pre><span className="lp-deleted">− &lt;button&gt;Save&lt;/button&gt;</span>{prepared && <span className="lp-added">+ &lt;button&gt;Save changes&lt;/button&gt;</span>}</pre></div><div className="lp-demo-action"><span>{prepared ? "A small change, ready for review." : "Preview the proposed replacement."}</span><Button size="compact" variant="secondary" onClick={() => setPrepared(!prepared)}>{prepared ? "Reset preview" : "Preview patch"}</Button></div></div>;
}
export function DemoDigest() {
  const [channel, setChannel] = useState("email");
  return <div className="lp-digest-demo"><div className="lp-digest-switch" aria-label="Digest preview"><button aria-pressed={channel === "email"} onClick={() => setChannel("email")}><img src="/logos/gmail.svg" alt="" />Email</button><button aria-pressed={channel === "slack"} onClick={() => setChannel("slack")}><img src="/logos/slack.svg" alt="" />Slack</button></div><article className="lp-digest-paper"><p className="lp-eyebrow">{channel === "email" ? "Inbox · feedback@unified" : "#product-feedback · Unified"}</p><h3>Acme website · feedback digest</h3><p className="lp-digest-count">4 new responses</p><p>Customers want to find older feedback faster. A weekly digest would help the team keep track of recurring issues.</p><div><span>What to address</span><p>Search responses by text or email</p><p>Add a weekly digest schedule</p></div><a href="#capabilities">View the workbench <span aria-hidden="true">↗</span></a></article></div>;
}
export function Iso({ name, className = "" }) {
  return <img className={`lp-iso ${className}`} src={`/overflow/iso-${name === "branch" ? "48" : "240"}-${name}-two-tone.svg`} alt="" loading="lazy" width={240} height={240} />;
}
