import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { issueColor } from "@/lib/issue-color";
import CopyButton from "@/components/shared/CopyButton";
import { feedbackPrompt } from "@/lib/feedback-prompt";

export default function SummaryCard({ summary, copyAction, issues = [], projectId, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  const issuesId = useId();
  return (
    <section aria-labelledby="feedback-summary-title" className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="feedback-summary-title" className="text-base font-medium">Feedback summary</h2>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">This summary updates automatically when new responses arrive.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{compact && summary.features.length > 0 && <Button variant="ghost" size="compact" aria-expanded={expanded} aria-controls={issuesId} onClick={() => setExpanded(!expanded)}>{expanded ? "Hide issues" : `Show ${summary.features.length} ${summary.features.length === 1 ? "issue" : "issues"}`}</Button>}{copyAction || <CopyButton value={feedbackPrompt(summary)} label="prompt" showLabel />}</div>
      </div>
      <div className={`grid gap-6 p-5 sm:p-6 ${!compact || expanded ? "xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-10" : ""}`}>
        <div className="space-y-3">
          {(!compact || expanded) && <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overview</h3>}
          <p className={`${compact && !expanded ? "max-w-[95ch] leading-6" : "max-w-prose leading-7"} whitespace-pre-wrap text-sm`}>{summary.tldr}</p>
        </div>
        <div id={issuesId} hidden={!expanded} className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What to address</h3>
          <ol className="space-y-3">
            {summary.features.map((feature, index) => {
              const evidence = summary.evidence?.find(item => item.title === feature);
              const issue = issues.find(item => item._id === evidence?.issueId);
              return <li key={`${index}-${feature}`} className="flex items-baseline gap-3 text-sm leading-6">
                <span aria-hidden="true" className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                {issue && projectId ? <Link to={`/dashboard/workbench?project=${projectId}&issue=${issue._id}`} className={`inline-flex items-baseline gap-2 underline-offset-4 hover:underline ${issue.status === "done" ? "text-muted-foreground line-through" : ""}`}><span aria-hidden="true" className="inline-block size-1.5 shrink-0 self-center rounded-full" style={{ background: issueColor(issue._id) }} />{issue.title}{issue.status === "done" && <span className="sr-only">Completed</span>}</Link> : <span>{feature.replace(/\*\*/g, "")}</span>}
              </li>;
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
