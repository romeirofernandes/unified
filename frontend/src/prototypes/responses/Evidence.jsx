import { useState } from "react";
import { issues } from "./data";
import { Avatar, AnswerSheet } from "./shared";
export default function Evidence({ responses, onIssue }) {
  const [selected, setSelected] = useState("all");
  const visible = responses.filter(response => selected === "all" || response.issueIds.includes(selected));
  return <div className="rp-evidence"><aside><p className="rp-eyebrow">Follow the issue</p><button aria-pressed={selected === "all"} onClick={() => setSelected("all")}>All responses <span>{responses.length}</span></button>{issues.map(issue => <button key={issue.id} aria-pressed={selected === issue.id} onClick={() => setSelected(issue.id)}><i style={{ background: issue.color }} /><span className={issue.status === "Done" ? "line-through opacity-60" : ""}>{issue.title}</span><small>{responses.filter(response => response.issueIds.includes(issue.id)).length}</small></button>)}<p className="rp-help">One response can support more than one issue.</p></aside><div className="rp-evidence-responses">{visible.map(response => <article key={response.id}><header><Avatar response={response} /><strong>{response.name}</strong><span>{response.date}</span></header><AnswerSheet response={response} onIssue={onIssue} /></article>)}{!visible.length && <p className="rp-empty">No responses match this issue.</p>}</div></div>;
}
