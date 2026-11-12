import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/motion/select";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/PageState";
import { responseDetails } from "@/lib/feedback-presentation";
import EvidenceResponse from "./EvidenceResponse";
import { issueColor } from "@/lib/issue-color";

export default function FeedbackList({ responses, fields, issues = [] }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("newest");
  const [selectedIssue, setSelectedIssue] = useState("all");
  const items = useMemo(
    () => responses.map((response) => responseDetails(response, fields)),
    [responses, fields],
  );
  const issueOptions = useMemo(() => {
    const catalog = new Map(issues.map(issue => [String(issue._id), issue]));
    for (const response of responses) for (const issue of response.issues || []) {
      if (!catalog.has(String(issue._id))) catalog.set(String(issue._id), issue);
    }
    return [...catalog.values()].map(issue => ({ ...issue, count: responses.filter(response => response.issues?.some(tag => String(tag._id) === String(issue._id))).length })).filter(issue => issue.count > 0);
  }, [issues, responses]);
  const selected = issueOptions.some(issue => String(issue._id) === selectedIssue) ? selectedIssue : "all";
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter(item => (selected === "all" || item.feedback.issues?.some(issue => String(issue._id) === selected))
      && (!term || [item.sender, ...item.answers.map(answer => `${answer.label} ${answer.value}`)].join(" ").toLowerCase().includes(term)))
      .sort((a, b) => order === "oldest" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
  }, [items, query, order, selected]);
  if (!responses.length)
    return (
      <EmptyState
        title="No responses yet"
        description="Add the widget to your app to collect your first response. Answers will appear here."
      />
    );
  return (
    <section aria-label="Customer responses" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label htmlFor="response-search" className="sr-only">
            Search responses
          </label>
          <input
            id="response-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or answers…"
            className="h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p
            role="status"
            className="text-xs tabular-nums text-muted-foreground"
          >
            {visible.length} of {responses.length}
          </p>
          <Select value={order} onValueChange={setOrder} className="w-40">
            <SelectTrigger className="h-10 rounded-md"><span className="sr-only">Response order: </span><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Filter responses by issue">
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Follow the issue</h2>
          <div className="space-y-1">
            <button type="button" aria-pressed={selected === "all"} onClick={() => setSelectedIssue("all")} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === "all" ? "bg-muted font-medium" : "hover:bg-muted/50"}`}>All responses <span className="text-[11px] tabular-nums text-muted-foreground">{responses.length}</span></button>
            {issueOptions.map(issue => <button type="button" key={issue._id} aria-pressed={selected === String(issue._id)} onClick={() => setSelectedIssue(String(issue._id))} className={`flex w-full items-start gap-3 rounded-md px-3 py-3 text-left text-xs leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === String(issue._id) ? "bg-muted" : "hover:bg-muted/50"}`}>
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: issueColor(issue._id), opacity: issue.status === "done" ? 0.5 : 1 }} />
              <span className={`min-w-0 flex-1 break-words ${issue.status === "done" ? "text-muted-foreground line-through" : ""}`}>{issue.title}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{issue.count}</span>
              {issue.status === "done" && <span className="sr-only">Completed</span>}
            </button>)}
          </div>
          <p className="mt-5 px-3 text-xs leading-6 text-muted-foreground">{issueOptions.length ? "One response can support more than one issue." : "Issue filters appear after feedback has been analysed."}</p>
        </aside>
        <div className="min-w-0 space-y-4">
          {visible.map(response => <EvidenceResponse key={response.feedback._id} response={response} />)}
          {!visible.length && <div className="space-y-2 rounded-xl border border-dashed border-border px-5 py-12 text-center"><p className="text-sm font-medium">No matching responses</p><p className="text-sm text-muted-foreground">Try another issue, email address or word from an answer.</p></div>}
        </div>
      </div>

    </section>
  );
}
