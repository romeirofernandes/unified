import { useState } from "react";
import { Avatar, AnswerSheet, Tags } from "./shared";
function Note({ response, onIssue }) {
  const [open, setOpen] = useState(false);
  return <article className="rp-note"><div className="rp-note-person"><Avatar response={response} /><div><strong>{response.name}</strong><p>{response.role} · {response.date}</p></div></div><div className="rp-note-paper"><blockquote>“{response.quote}”</blockquote><Tags response={response} onIssue={onIssue} /><button className="rp-text-button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide all answers" : "Read all answers"} <span aria-hidden="true">↗</span></button>{open && <AnswerSheet response={response} onIssue={onIssue} />}</div></article>;
}
export default function Conversation({ responses, onIssue }) { return <div className="rp-conversation">{responses.map(response => <Note key={response.id} response={response} onIssue={onIssue} />)}</div>; }
