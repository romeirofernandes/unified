import { useId, useState } from "react";
import { issues } from "./data";

export function Tags({ response, onIssue }) {
  return <div className="rp-tags">{response.issueIds.map(id => {
    const issue = issues.find(issue => issue.id === id);
    return <button key={id} onClick={() => onIssue(issue)} className={`rp-tag ${issue.status === "Done" ? "is-done" : ""}`}><span style={{ background: issue.color }} />{issue.title}{issue.status === "Done" && <span className="sr-only">Completed</span>}</button>;
  })}</div>;
}
export function Avatar({ response }) { return <span className="rp-avatar" aria-hidden="true">{response.initials}</span>; }
export function AnswerSheet({ response, onIssue }) {
  return <div className="rp-answer-sheet"><div className="rp-question">What could we improve?</div><blockquote>{response.quote}</blockquote><Tags response={response} onIssue={onIssue} /><dl className="rp-facts">{[["Your role", response.role], ["Overall experience", response.rating], ["Submitted from", response.browser], ["Email", response.email]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>;
}
export function Disclosure({ response, onIssue, style = "ledger", defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <article className={`rp-disclosure rp-${style}`} data-open={open || undefined}>
    <button className="rp-disclosure-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      {style === "compact" ? <span className="rp-number">{response.id}</span> : <Avatar response={response} />}
      <span className="rp-person"><strong>{response.name}</strong><span>{response.email}</span></span>
      <span className="rp-preview">{response.quote}</span><span className="rp-date">{response.date}</span><span className="rp-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && <div id={id} className="rp-expanded"><AnswerSheet response={response} onIssue={onIssue} /></div>}
  </article>;
}
