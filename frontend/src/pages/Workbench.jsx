import { useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import WorkbenchBoard, { StatusSelect } from "@/components/workbench-board";
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

function IssueEditor({ issue, pending, error, onClose, onSave }) {
  const statusId = useId();
  const [title, setTitle] = useState(issue.title || "");
  const [description, setDescription] = useState(issue.description || "");
  const [status, setStatus] = useState(issue.status);
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    <DialogContent showCloseButton={!pending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background text-foreground">
      <DialogHeader><DialogTitle>{issue._id ? "Edit issue" : "Create issue"}</DialogTitle><DialogDescription>Track the work that matters to your project.</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave({ title, description, status }); }}>
        <FormField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={2000} required autoFocus disabled={pending} />
        <FormField label="Description" as="textarea" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={10000} disabled={pending} />
        <div className="space-y-2"><label htmlFor={statusId} className="block text-sm text-muted-foreground">Status</label><StatusSelect id={statusId} value={status} onChange={setStatus} disabled={pending} label="Status" /></div>
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
  const running = useRef(false);
  const issues = data || [];
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
  if (loading) return <LoadingState />;
  if (loadError) return <div className="space-y-3"><ErrorMessage>{loadError}</ErrorMessage><Button onClick={reload}>Try again</Button></div>;
  return <div className="flex min-h-0 flex-1 flex-col gap-5">
    <div className="flex shrink-0 justify-end"><Button disabled={pending} onClick={() => create()}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />New issue</Button></div>
    <p role="status" className="sr-only">{announcement}</p>
    {!editing && !deleting && <ErrorMessage>{error}</ErrorMessage>}
    <WorkbenchBoard issues={issues} pending={pending} onEdit={(issue) => { setError(""); setEditing(issue); }} onDelete={(issue) => { setError(""); setDeleting(issue); }} onMove={move} />
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
    <PageHeader title="Workbench" description="Turn feedback into action. Track your project’s issues through to completion." action={project && <ProjectPicker projects={projects} value={project._id} onChange={(value) => setParams({ project: value }, { replace: true })} />} />
    {loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div> : !project ? <EmptyState title="Create a project first" description="Your project’s feedback issues will appear here once a summary is generated." /> : <ProjectBoard key={project._id} project={project} uid={user?.uid} />}
  </>;
}
