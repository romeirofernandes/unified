import { Link } from "react-router-dom";

import { issueColor } from "@/lib/issue-color";
export default function IssueTags({ issues = [], projectId }) {
  if (!issues.length) return null;
  return <div className="flex flex-wrap gap-2" aria-label="Linked workbench issues">{issues.map(issue => <Link key={issue._id} to={`/dashboard/workbench?project=${projectId}&issue=${issue._id}`} onClick={event => event.stopPropagation()} className={`inline-flex max-w-full items-center gap-2 rounded-md border border-border px-2.5 py-1 text-xs leading-5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${issue.status === "done" ? "text-muted-foreground" : "text-foreground"}`}>
    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: issueColor(issue._id), opacity: issue.status === "done" ? 0.4 : 1 }} />
    <span className={issue.status === "done" ? "line-through" : ""}>{issue.title}</span>
    {issue.status === "done" && <span className="sr-only">Completed</span>}
  </Link>)}</div>;
}
