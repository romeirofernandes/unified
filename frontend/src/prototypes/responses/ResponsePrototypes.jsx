import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Brand from "@/components/shared/Brand";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PrototypePicker from "../PrototypePicker";
import Ledger from "./Ledger";
import Conversation from "./Conversation";
import Evidence from "./Evidence";
import Split from "./Split";
import Compact from "./Compact";
import { responses } from "./data";
import "./responses.css";

const variants = [Ledger, Conversation, Evidence, Split, Compact];
const names = ["Ledger", "Notes", "Evidence", "Inbox", "Log"];
const descriptions = ["Scan the list, then open the full response.", "Give each customer's words a little more room.", "Start with an issue and read the responses behind it.", "Keep the list in sight while you read.", "A compact record that opens only when you need it."];
export default function ResponsePrototypes() {
  const [params, setParams] = useSearchParams();
  const value = Math.min(4, Math.max(0, (Number(params.get("v")) || 1) - 1));
  const [replay, setReplay] = useState(0);
  const [query, setQuery] = useState("");
  const [oldest, setOldest] = useState(false);
  const [issue, setIssue] = useState(null);
  const visible = responses.filter(response => `${response.name} ${response.email} ${response.quote}`.toLowerCase().includes(query.toLowerCase()));
  if (oldest) visible.reverse();
  const Variant = variants[value];
  return <div className="rp-workspace">
    <aside className="rp-sidebar"><Brand /><nav><Link to="/dashboard">Projects</Link><Link className="rp-nav-active" to="/prototypes/responses">Responses</Link><Link to="/dashboard/workbench">Workbench</Link><Link to="/dashboard/pull-requests">Pull requests</Link></nav><p>Acme Studio<br /><span>Sample workspace</span></p></aside>
    <div className="rp-workspace-main"><header className="rp-topbar"><span>Workspace <span>/</span> Acme website <span>/</span> Responses</span><ThemeToggle /></header>
      <main className="rp-main"><div className="rp-heading"><div><p className="rp-eyebrow">Customer feedback</p><h1>Every response, in context.</h1><p>{descriptions[value]}</p></div><span className="rp-study">{value + 1} / 5 · Response studies</span></div>
        <div className="rp-summary-note"><span className="rp-summary-mark" aria-hidden="true">✳</span><p><strong>Two customers want to find older responses faster.</strong><br />One radio selection issue is resolved. A weekly digest is still on the list.</p><span>4 responses<br />3 issues</span></div>
        <div className="rp-toolbar"><label><span className="sr-only">Search responses</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people or answers…" /></label><span role="status">{visible.length} responses</span><button onClick={() => setOldest(!oldest)}>{oldest ? "Oldest first" : "Newest first"} <span aria-hidden="true">↓</span></button></div>
        <div key={`${value}-${replay}`} className="rp-stage"><Variant responses={visible} onIssue={setIssue} />{!visible.length && value !== 2 && value !== 3 && <p className="rp-empty">No matching responses. Try another word.</p>}</div>
      </main>
    </div>
    <PrototypePicker names={names} value={value} onChange={index => setParams({ v: index + 1 }, { replace: true })} onReplay={() => setReplay(replay + 1)} />
    <Dialog open={!!issue} onOpenChange={open => { if (!open) setIssue(null); }}><DialogContent className="bg-card text-foreground"><DialogHeader><DialogTitle>{issue?.title}</DialogTitle><DialogDescription>Workbench · {issue?.status}</DialogDescription></DialogHeader><p className="text-sm leading-7">{issue?.description}</p><p className="text-xs text-muted-foreground">{responses.filter(response => response.issueIds.includes(issue?.id)).length} original responses linked to this issue.</p></DialogContent></Dialog>
  </div>;
}
