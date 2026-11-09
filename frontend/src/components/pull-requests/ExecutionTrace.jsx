import { useId, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

// Adapted from the supplied Thinking component; progress comes from saved events, never timers.
export default function ExecutionTrace({ events, state }) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  const working = state === "active";
  return <div className="w-full border-t border-border pt-4">
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="flex w-full items-center gap-2 rounded-md py-1 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {working && <Spinner className="text-[var(--fluid-accent)]" />}
      <span className="flex-1">Execution trace <span className="text-xs font-normal text-muted-foreground">· {events.length}</span></span>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <div id={id} hidden={!expanded} className="pt-3">
      {events.length ? <ol aria-label="Execution trace" className="ms-1 border-s border-border">{events.map((event, index) => <li key={index} className="relative pb-4 ps-5 last:pb-0">
        <span aria-hidden="true" className={`absolute -start-[4px] top-1.5 h-[7px] w-[7px] rounded-full ${event.status === "failed" ? "bg-destructive" : "bg-muted-foreground"}`} />
        {event.at && <time dateTime={event.at} className="text-[11px] tabular-nums text-muted-foreground">{new Date(event.at).toLocaleTimeString()}</time>}
        <p className={`mt-0.5 whitespace-pre-wrap break-words text-xs leading-5 ${event.status === "failed" ? "text-destructive" : "text-foreground"}`}>{event.message}</p>
      </li>)}</ol> : <p className="text-xs text-muted-foreground">{state === "waiting" ? "This step has not started." : "No recorded activity for this step yet."}</p>}
    </div>
  </div>;
}
