import { useState } from "react";
import { Avatar, AnswerSheet } from "./shared";
export default function Split({ responses, onIssue }) {
  const [selected, setSelected] = useState(responses[0]?.id);
  const response = responses.find(item => item.id === selected) || responses[0];
  return <div className="rp-split"><div className="rp-inbox" aria-label="Choose a response">{responses.map(item => <button key={item.id} onClick={() => setSelected(item.id)} aria-pressed={item.id === response?.id}><div><Avatar response={item} /><strong>{item.name}</strong><span>{item.date.split(",")[0]}</span></div><p>{item.quote}</p><span className="rp-small-count">{item.issueIds.length ? `${item.issueIds.length} linked ${item.issueIds.length === 1 ? "issue" : "issues"}` : "No issues reported"}</span></button>)}</div><article className="rp-reading-pane">{response ? <><header><p className="rp-eyebrow">Original response · {response.id}</p><h2>{response.name}</h2><p>{response.email} · {response.date}</p></header><AnswerSheet response={response} onIssue={onIssue} /></> : <p className="rp-empty">No matching responses.</p>}</article></div>;
}
