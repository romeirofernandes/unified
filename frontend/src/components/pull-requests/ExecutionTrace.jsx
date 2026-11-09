import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, CodeIcon, GitPullRequestIcon, CheckmarkCircle01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { traceTools } from "@/lib/trace-tools";
import { patchRows } from "@/lib/patch-diff";
import FilePill from "./FilePill";
import CodeBlock from "./CodeBlock";

const icons = { read:Search01Icon, ai:CodeIcon, edit:CodeIcon, git:GitPullRequestIcon, check:CheckmarkCircle01Icon, mail:Mail01Icon, queue:CheckmarkCircle01Icon };
function Chevron({ open }) {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>;
}
function ToolRow({ row }) {
  const [manualOpen, setOpen] = useState(null);
  const open = manualOpen ?? row.state === "failed";
  const id = useId();
  const isFile = /\.(jsx?|tsx?|css|mdx?)$/i.test(row.target);
  return <li className="overflow-hidden rounded-xl border border-border bg-card">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="group flex w-full flex-wrap items-center gap-x-3 gap-y-2 p-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-nowrap sm:p-3.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${row.state === "failed" ? "border-destructive text-destructive" : row.state === "running" ? "border-[var(--fluid-accent)] text-[var(--fluid-accent)]" : "border-border text-muted-foreground"}`}>
        {row.state === "running" ? <Spinner /> : <HugeiconsIcon icon={icons[row.tool] || icons.check} size={16} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-medium">{row.label}</span>
      {row.durationMs !== undefined && <span className="text-[11px] tabular-nums text-muted-foreground">{(row.durationMs / 1000).toFixed(1)}s</span>}
      {row.state === "complete" && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="shrink-0 text-green-700 dark:text-green-300" aria-label="Succeeded" />}
      <Chevron open={open} />
      <span className="order-last ms-11 min-w-0 max-w-full sm:order-none sm:ms-0 sm:max-w-[48%]">{isFile ? <FilePill path={row.target} className="py-1" /> : <span className="block truncate rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground">{row.target}</span>}</span>
    </button>
    <div id={id} hidden={!open} className="border-t border-border bg-background px-4 py-3 sm:ps-[3.75rem]">
      {row.messages.map((message, index) => <p key={index} className={`break-words py-1 text-xs leading-6 ${row.state === "failed" && index === row.messages.length - 1 ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>)}
    </div>
  </li>;
}
// Tool Chips + Task Rows, driven by real saved operations rather than the gallery's timed sequence.
export default function ExecutionTrace({ events, state, run, stageId, live, embedded = false, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [preview, setPreview] = useState(stageId === "patch" ? 0 : null);
  const id = useId();
  const rows = traceTools(events,state);
  const working = state === "active";
  const active = [...rows].reverse().find(row => row.state === "running");
  const edits = stageId === "patch" ? run?.patch || [] : [];
  return <section className={embedded ? "space-y-4" : "mt-8 space-y-4 border-t border-border pt-6"} aria-label="Step activity">
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="flex w-full items-center gap-2 rounded-md py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex-1 text-sm font-semibold">Execution trace <span className="ms-1 text-xs font-normal text-muted-foreground">{rows.length} operations</span></span>
      {working && <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-success" : "bg-muted-foreground"}`} />{live ? "Live" : "Auto-refresh"}</span>}
      <Chevron open={expanded} />
    </button>
    {working && <div role="status" className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
      <Spinner className="mt-0.5 shrink-0 text-[var(--fluid-accent)]" />
      <div className="min-w-0"><p className="text-sm font-medium">{active?.label || "Processing this step"}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{active?.messages.at(-1) || events.at(-1)?.message || "Waiting for the worker to start."}</p></div>
    </div>}
    <div id={id} hidden={!expanded} className="space-y-4">
      {rows.length ? <ol aria-label="Execution trace" aria-live="polite" aria-relevant="additions" className="space-y-2.5">{rows.map(row => <ToolRow key={row.key} row={row} />)}</ol> : <p className="rounded-xl border border-dashed border-border p-5 text-xs text-muted-foreground">{state === "waiting" ? "This step has not started." : "No recorded activity for this step yet."}</p>}
      {edits.length > 0 && <div className="flex flex-wrap gap-2 border-t border-border pt-4">{edits.map((edit,index) => {
        const diff = patchRows(edit.before,edit.after);
        return <button key={index} type="button" aria-expanded={preview === index} onClick={() => setPreview(preview === index ? null : index)} className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-background p-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><FilePill path={edit.path} className="border-0 bg-muted py-1" /><span className="shrink-0 pe-1 font-mono text-[11px]"><span className="text-green-700 dark:text-green-300">+{diff.filter(row=>row.type === "add").length}</span> <span className="text-destructive">−{diff.filter(row=>row.type === "del").length}</span></span></button>;
      })}</div>}
      {preview !== null && edits[preview] && <CodeBlock filename={edits[preview].path} before={edits[preview].before} after={edits[preview].after} />}
    </div>
  </section>;
}
