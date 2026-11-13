import { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import WorkbenchBoard, { StatusSelect } from "@/components/workbench-board";
import PageHeader from "@/components/shared/PageHeader";
import ProjectPicker from "@/components/shared/ProjectPicker";
import FormField from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";

function ResponseCard({ response, number }) {
  // Lead with the fullest answer; keep the complete response available below it.
  const primary = response.answers.reduce((best, item) => {
    const length = typeof item.answer === "string" ? item.answer.length : 0;
    return length > (typeof best?.answer === "string" ? best.answer.length : -1) ? item : best;
  }, null);
  const others = response.answers.filter((item) => item !== primary);
  const answerText = (answer) => typeof answer === "string" ? answer : JSON.stringify(answer);
  return <article className="rounded-lg border border-border bg-background p-5">
    <header className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Response {number}</span>
      {response.timestamp && <time dateTime={response.timestamp}>{new Date(response.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>}
    </header>
    {primary && <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{primary.question}</p>
      <blockquote className="whitespace-pre-wrap break-words text-sm leading-7">{answerText(primary.answer)}</blockquote>
    </div>}
    {others.length > 0 && <Accordion size="compact" className="mt-4 border-t border-border pt-2">
      <AccordionItem value="other-answers" highlight="trigger">
        <AccordionTrigger>{others.length} other {others.length === 1 ? "answer" : "answers"} in this response</AccordionTrigger>
        <AccordionContent><dl className="space-y-4 pt-2">{others.map((item, index) => <div key={index} className="space-y-1"><dt className="text-xs text-muted-foreground">{item.question}</dt><dd className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{answerText(item.answer)}</dd></div>)}</dl></AccordionContent>
      </AccordionItem>
    </Accordion>}
  </article>;
}

function IssueEvidence({ projectId, issueId, uid }) {
  const { data, loading, error, reload } = useApiResource(`/workbench/${projectId}/${issueId}/evidence`, uid);
  return <section aria-label="Original feedback" className="min-w-0 space-y-5 p-5 sm:p-6">
    <div className="space-y-1"><h3 className="text-sm font-semibold">Original feedback</h3><p className="text-xs leading-5 text-muted-foreground">The responses behind this suggestion.</p></div>
    {loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading original responses…</p> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button size="sm" variant="outline" onClick={reload}>Try again</Button></div> : data.responseCount ? <>
      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background px-5 py-4">
        <div><dt className="text-xs text-muted-foreground">Identified {data.affectedUserCount === 1 ? "user" : "users"}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{data.affectedUserCount || "—"}</dd></div>
        <div className="border-s border-border ps-5"><dt className="text-xs text-muted-foreground">Linked {data.responseCount === 1 ? "response" : "responses"}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{data.responseCount}</dd></div>
      </dl>
      <div className="space-y-3">{data.responses.map((response, index) => <ResponseCard key={response._id} response={response} number={index + 1} />)}</div>
    </> : <div className="rounded-lg border border-dashed border-border px-5 py-8">
      <p className="text-sm font-medium">No linked responses yet</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">This issue may have been created manually or from an older summary. A new feedback summary can link matching suggestions.</p>
    </div>}
  </section>;
}

function IssueEditor({ issue, projectId, uid, pending, error, onClose, onSave }) {
  const statusId = useId();
  const formId = useId();
  const [title, setTitle] = useState(issue.title || "");
  const [description, setDescription] = useState(issue.description || "");
  const [status, setStatus] = useState(issue.status);
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    <DialogContent size={issue._id ? "xl" : "lg"} showCloseButton={!pending} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-background p-0 text-foreground">
      <DialogHeader className="mb-0 shrink-0 border-b border-border px-5 py-5 pe-14 sm:px-6 sm:pe-14">
        <DialogTitle>{issue._id ? "Issue details" : "Create issue"}</DialogTitle>
        <DialogDescription>{issue._id ? "Review the feedback and decide what happens next." : "Add a task to your workbench."}</DialogDescription>
      </DialogHeader>
      <div className={`min-h-0 overflow-y-auto ${issue._id ? "md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`}>
        <form id={formId} className="min-w-0 space-y-6 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onSave({ title, description, status }); }}>
          <div className="space-y-1"><h3 className="text-sm font-semibold">Issue</h3><p className="text-xs leading-5 text-muted-foreground">{issue.sourceKey ? "Suggested from your feedback summary" : "Created in Workbench"}</p></div>
          <FormField label="Title" as={Textarea} rows={2} className="h-auto min-h-20 resize-none" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={2000} required autoFocus disabled={pending} />
          <div className="space-y-2"><label htmlFor={statusId} className="block text-sm text-muted-foreground">Status</label><StatusSelect id={statusId} value={status} onChange={setStatus} disabled={pending} label="Status" /></div>
          <FormField label="Description" as={Textarea} rows={4} className="h-auto bg-card" placeholder="Add context or a plan for this issue…" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={10000} disabled={pending} />
          <ErrorMessage>{error}</ErrorMessage>
        </form>
        {issue._id && <div className="min-w-0 border-t border-border bg-muted/30 md:border-s md:border-t-0"><IssueEvidence projectId={projectId} issueId={issue._id} uid={uid} /></div>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-background px-5 py-4 sm:px-6">
        {issue._id && issue.status !== "done" && <Button asChild variant="ghost" disabled={pending}><Link to={`/dashboard/pull-requests?project=${projectId}&issue=${issue._id}`}>Assess for a PR</Link></Button>}
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} loading={pending} disabled={!title.trim()}>{issue._id ? "Save changes" : "Create issue"}</Button>
      </footer>
    </DialogContent>
  </Dialog>;
}

function ProjectBoard({ project, uid, renderHeader }) {
  const path = `/workbench/${project._id}`;
  const { data, loading, error: loadError, reload, setData } = useApiResource(path, uid);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const running = useRef(false);
  const issues = data || [];
  const [params, setParams] = useSearchParams();
  const requestedIssue = params.get("issue");
  useEffect(() => {
    if (!data || !requestedIssue) return;
    const issue = data.find(issue => issue._id === requestedIssue);
    if (issue) setEditing(issue);
    setParams(previous => { const next = new URLSearchParams(previous); next.delete("issue"); return next; }, { replace: true });
  }, [data, requestedIssue, setParams]);
  async function mutate(method, issue, body, optimistic) {
    if (running.current) return;
    running.current = true; setPending(true); setError("");
    const previous = data;
    if (optimistic) setData(optimistic);
    try {
      const updated = await apiRequest(`${path}${issue?._id ? `/${issue._id}` : ""}`, { uid, method, body });
      setData(updated); setEditing(null); setDeleting(null);
      setAnnouncement(method === "DELETE" ? "Issue deleted." : method === "POST" ? "Issue created." : "Issue updated.");
    } catch (error) { if (optimistic) setData(previous); setError(error.message); }
    finally { running.current = false; setPending(false); }
  }
  function move(issue, status, position) {
    const body = { title: issue.title, description: issue.description, status, ...(position !== undefined ? { position } : {}) };
    void mutate("PUT", issue, body, issues.map(item => item._id === issue._id ? { ...item, ...body } : item));
  }
  function create(status = "todo") { setError(""); setEditing({ status }); }
  if (loading) return <>{renderHeader()}<LoadingState variant="workbench" /></>;
  if (loadError) return <>{renderHeader()}<div className="space-y-3"><ErrorMessage>{loadError}</ErrorMessage><Button onClick={reload}>Try again</Button></div></>;
  return <>
    {renderHeader(<Button disabled={pending} onClick={() => create()}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />New issue</Button>)}
    <div className="flex min-h-0 flex-1 flex-col gap-5">
    <p role="status" className="sr-only">{announcement}</p>
    {!editing && !deleting && <ErrorMessage>{error}</ErrorMessage>}
    <WorkbenchBoard issues={issues} pending={pending} onEdit={(issue) => { setError(""); setEditing(issue); }} onDelete={(issue) => { setError(""); setDeleting(issue); }} onMove={move} />
    {editing && <IssueEditor issue={editing} projectId={project._id} uid={uid} pending={pending} error={error} onClose={() => setEditing(null)} onSave={(body) => mutate(editing._id ? "PUT" : "POST", editing, body)} />}
    <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete issue?" description="This issue will be removed from your board. Summary imports won’t bring it back." pending={pending} error={error} onConfirm={() => mutate("DELETE", deleting)} />
    </div>
  </>;
}

export default function Workbench() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const projects = data || [];
  const project = projects.find((item) => item._id === params.get("project")) || projects[0];
  const renderHeader = (action) => <PageHeader title="Workbench" description="Turn feedback into action. Track your project’s issues through to completion." action={project && <div className="flex w-full items-end gap-3 sm:w-auto">
    <ProjectPicker className="min-w-0 flex-1" projects={projects} value={project._id} triggerClassName="bg-card hover:bg-card" onChange={(value) => setParams({ project: value }, { replace: true })} />
    {action}
  </div>} />;
  if (loading) return <>{renderHeader()}<LoadingState variant="workbench" /></>;
  if (error) return <>{renderHeader()}<div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div></>;
  if (!project) return <>{renderHeader()}<EmptyState title="Create a project first" description="Your project’s feedback issues will appear here once a summary is generated." /></>;
  return <ProjectBoard key={project._id} project={project} uid={user?.uid} renderHeader={renderHeader} />;
}
