import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import PageHeader from "@/components/shared/PageHeader";
import ProjectPicker from "@/components/shared/ProjectPicker";
import FormField from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";

const columns = [
  { id: "backlog", label: "Backlog", color: "bg-muted-foreground" },
  { id: "todo", label: "To do", color: "bg-blue-500" },
  { id: "in_progress", label: "In progress", color: "bg-amber-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];

function IssueEditor({ issue, pending, error, onClose, onSave }) {
  const [title, setTitle] = useState(issue.title || "");
  const [description, setDescription] = useState(issue.description || "");
  const [status, setStatus] = useState(issue.status);
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    <DialogContent showCloseButton={!pending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader><DialogTitle>{issue._id ? "Edit issue" : "Create issue"}</DialogTitle><DialogDescription>Track the work that matters to your project.</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave({ title, description, status }); }}>
        <FormField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={2000} required autoFocus disabled={pending} />
        <FormField label="Description" as="textarea" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={10000} disabled={pending} />
        <FormField label="Status" as="select" value={status} onChange={(event) => setStatus(event.target.value)} disabled={pending}>{columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</FormField>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button><Button type="submit" loading={pending} disabled={!title.trim()}>{issue._id ? "Save issue" : "Create issue"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

function ProjectBoard({ project, uid }) {
  const path = `/workbench/${project._id}`;
  const { data, loading, error: loadError, reload, setData } = useApiResource(path, uid);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const running = useRef(false);
  const issues = data || [];
  async function mutate(method, issue, body) {
    if (running.current) return;
    running.current = true; setPending(true); setError("");
    try {
      const updated = await apiRequest(`${path}${issue?._id ? `/${issue._id}` : ""}`, { uid, method, body });
      setData(updated); setEditing(null); setDeleting(null);
      setAnnouncement(method === "DELETE" ? "Issue deleted." : method === "POST" ? "Issue created." : "Issue updated.");
    } catch (error) { setError(error.message); }
    finally { running.current = false; setPending(false); }
  }
  function create(status = "backlog") { setError(""); setEditing({ status }); }
  if (loading) return <LoadingState />;
  if (loadError) return <div className="space-y-3"><ErrorMessage>{loadError}</ErrorMessage><Button onClick={reload}>Try again</Button></div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{issues.length} {issues.length === 1 ? "issue" : "issues"} · Summary issues appear in Backlog</p>
      <Button disabled={pending} onClick={() => create()}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />New issue</Button>
    </div>
    <p role="status" className="sr-only">{announcement}</p>
    {!editing && !deleting && <ErrorMessage>{error}</ErrorMessage>}
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" aria-label="Issue board">
      {columns.map((column) => {
        const cards = issues.filter((issue) => issue.status === column.id);
        return <section key={column.id} aria-label={column.label} onDragOver={(event) => { if (dragging && !pending) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(column.id); } }} onDrop={(event) => {
          event.preventDefault(); const issue = issues.find((item) => item._id === dragging);
          setDragging(null); setOver(null);
          if (issue && issue.status !== column.id) void mutate("PUT", issue, { title: issue.title, description: issue.description, status: column.id });
        }} className={`min-h-[440px] w-[82vw] max-w-[340px] shrink-0 snap-start rounded-xl border bg-muted/30 p-3 sm:w-72 xl:min-w-0 xl:max-w-none xl:flex-1 ${over === column.id ? "border-ring ring-1 ring-ring" : "border-border"}`}>
          <header className="mb-4 flex items-center gap-2 px-1">
            <span aria-hidden="true" className={`size-2 rounded-full ${column.color}`} /><h2 className="text-sm font-medium">{column.label}</h2><span className="text-xs tabular-nums text-muted-foreground">{cards.length}</span>
            <Button variant="ghost" size="icon-compact" className="ml-auto" aria-label={`Add issue to ${column.label}`} disabled={pending} onClick={() => create(column.id)}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" /></Button>
          </header>
          <div className="space-y-3">
            {cards.map((issue) => <article key={issue._id} draggable={!pending} onDragStart={(event) => { event.dataTransfer.setData("text/plain", issue._id); event.dataTransfer.effectAllowed = "move"; setDragging(issue._id); }} onDragEnd={() => { setDragging(null); setOver(null); }} className={`rounded-lg border border-border bg-background shadow-sm transition-shadow hover:shadow-md ${dragging === issue._id ? "opacity-40" : ""}`}>
              <button type="button" disabled={pending} onClick={() => { setError(""); setEditing(issue); }} className="block w-full space-y-2 rounded-t-lg p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <h3 className="break-words text-sm font-medium leading-6">{issue.title}</h3>
                {issue.description && <p className="line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{issue.description}</p>}
                <span className="block text-xs text-muted-foreground">{issue.sourceKey ? "From feedback summary" : "Created in Workbench"}</span>
              </button>
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <select aria-label={`Status for ${issue.title}`} value={issue.status} disabled={pending} onChange={(event) => mutate("PUT", issue, { title: issue.title, description: issue.description, status: event.target.value })} className="min-w-0 rounded bg-background p-1 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{columns.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
                <Button variant="ghost" size="icon-compact" aria-label={`Delete ${issue.title}`} disabled={pending} onClick={() => { setError(""); setDeleting(issue); }}><HugeiconsIcon icon={Delete01Icon} size={14} aria-hidden="true" /></Button>
              </div>
            </article>)}
            {!cards.length && <button onClick={() => create(column.id)} disabled={pending} className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>No issues yet</span><span className="text-foreground">Add an issue</span></button>}
          </div>
        </section>;
      })}
    </div>
    {editing && <IssueEditor issue={editing} pending={pending} error={error} onClose={() => setEditing(null)} onSave={(body) => mutate(editing._id ? "PUT" : "POST", editing, body)} />}
    <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete issue?" description="This issue will be removed from your board. Summary imports won’t bring it back." pending={pending} error={error} onConfirm={() => mutate("DELETE", deleting)} />
  </div>;
}

export default function Workbench() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const projects = data || [];
  const project = projects.find((item) => item._id === params.get("project")) || projects[0];
  return <>
    <PageHeader title="Workbench" description="Turn feedback into action. Track your project’s issues from backlog to done." action={project && <ProjectPicker projects={projects} value={project._id} onChange={(value) => setParams({ project: value }, { replace: true })} />} />
    {loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div> : !project ? <EmptyState title="Create a project first" description="Your project’s feedback issues will appear here once a summary is generated." /> : <ProjectBoard key={project._id} project={project} uid={user?.uid} />}
  </>;
}
