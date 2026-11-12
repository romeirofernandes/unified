import FallbackAvatar from "@/components/fallback-avatar";
import { useReducedMotion } from "motion/react";
import IssueTags from "./IssueTags";

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
export default function EvidenceResponse({ response }) {
  const { feedback, sender, answers, timestamp } = response;
  const reducedMotion = useReducedMotion();
  const primary = answers.find(answer => answer.type === "textarea" && answer.value !== "No answer")
    || answers.find(answer => answer.type === "text" && answer.value !== "No answer");
  const facts = answers.filter(answer => answer !== primary);
  const date = timestamp ? new Date(timestamp) : null;
  return <article className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6" aria-label={`Response from ${sender}`}>
    <header className="mb-6 flex min-w-0 items-center gap-3">
      <FallbackAvatar name={sender === "Anonymous response" ? String(feedback._id) : sender.trim().toLowerCase()} size={32} animated={!reducedMotion} className="shrink-0 ring-1 ring-border" />
      <h3 className="min-w-0 flex-1 break-words text-xs font-medium">{sender}</h3>
      <time dateTime={date?.toISOString()} title={date?.toLocaleString()} className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{date ? dateFormat.format(date) : "Date unavailable"}</time>
    </header>
    {primary && <div className="space-y-3"><p className="text-xs text-muted-foreground">{primary.label}</p><blockquote className="whitespace-pre-wrap break-words text-sm leading-7">{primary.value}</blockquote></div>}
    <div className={feedback.issues?.length ? "mt-4" : ""}><IssueTags issues={feedback.issues} projectId={feedback.projectId} /></div>
    {facts.length > 0 && <dl className={`grid gap-x-10 gap-y-6 sm:grid-cols-2 ${primary || feedback.issues?.length ? "mt-6 border-t border-border pt-6" : ""}`}>
      {facts.map(answer => <div key={answer.id} className="min-w-0 space-y-2"><dt className="text-xs text-muted-foreground">{answer.label}</dt><dd className="whitespace-pre-wrap break-words text-xs leading-6">{answer.value}</dd></div>)}
    </dl>}
    {!answers.length && <p className="text-sm text-muted-foreground">This response has no answers.</p>}
  </article>;
}
