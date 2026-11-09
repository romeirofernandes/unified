import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RepositoryConnection from "@/components/pull-requests/RepositoryConnection";
import FixPipeline from "@/components/pull-requests/FixPipeline";
import PageHeader from "@/components/shared/PageHeader";
import ProjectPicker from "@/components/shared/ProjectPicker";
import FormField from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";
import { forgetResourcePrefix } from "@/lib/resource-cache";
import { runLabels, activeStatuses, watchedStatuses } from "@/lib/pull-request-status";
import { pipelineStates } from "@/lib/fix-pipeline";

const date = value => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
function EmptyPipeline() {
  const [selected, setSelected] = useState(null);
  const stage = pipelineStates(null).find(item => item.id === selected);
  return <section className="overflow-hidden rounded-xl border border-border bg-card"><h2 className="border-b border-border p-5 text-base font-semibold sm:px-6">Fix pipeline</h2><FixPipeline run={null} selectedStage={selected} onSelect={setSelected} /><Dialog open={!!stage} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="border border-border bg-card text-foreground"><DialogHeader><DialogTitle>{stage?.label}</DialogTitle><DialogDescription>{stage?.description}</DialogDescription></DialogHeader></DialogContent></Dialog></section>;
}
function StageDetail({ stage, run }) {
  return <div className="space-y-5 text-sm leading-6">
    <p className="whitespace-pre-wrap break-words">{stage.detail}</p>
    {stage.id === "scope" && <>
      {run.assessment?.plan?.length > 0 && <ol className="list-decimal space-y-2 ps-5">{run.assessment.plan.map((step, index) => <li key={index}>{step}</li>)}</ol>}
      <div><h3 className="mb-1 font-semibold">Expected result</h3><p className="whitespace-pre-wrap break-words text-muted-foreground">{run.acceptance}</p></div>
      {run.files?.length > 0 && <div><h3 className="mb-2 font-semibold">Source files</h3><ul className="space-y-2">{run.files.map(file => <li key={file.path} className="break-all font-mono text-xs">{file.path}<span className="mt-1 block text-muted-foreground">{file.sha?.slice(0, 12)}</span></li>)}</ul><p className="mt-3 break-all font-mono text-xs text-muted-foreground">{run.baseBranch} · {run.baseSha?.slice(0, 12)}</p></div>}
    </>}
    {stage.id === "patch" && run.patch?.map((edit, index) => <div key={index} className="space-y-2"><h3 className="break-all font-mono text-xs font-semibold">{edit.path}</h3><p className="text-xs text-muted-foreground">Before</p><pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs leading-5">{edit.before}</pre><p className="text-xs text-muted-foreground">After</p><pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs leading-5">{edit.after || "(Removed)"}</pre></div>)}
    {["pr", "review"].includes(stage.id) && run.prUrl && <Button asChild variant="secondary"><a href={run.prUrl} target="_blank" rel="noreferrer">Open pull request #{run.prNumber}</a></Button>}
    {stage.id === "review" && run.checks?.length > 0 && <ul className="divide-y divide-border">{run.checks.map((check, index) => <li key={index} className="flex flex-wrap justify-between gap-2 py-2"><span>{check.name}</span><span className="text-muted-foreground">{check.conclusion || check.status}</span></li>)}</ul>}
    {stage.id === "notify" && run.notification?.total > 0 && <dl className="grid grid-cols-3 gap-4"><div><dt className="text-xs text-muted-foreground">Opted in</dt><dd className="text-xl font-semibold tabular-nums">{run.notification.total}</dd></div><div><dt className="text-xs text-muted-foreground">Sent</dt><dd className="text-xl font-semibold tabular-nums">{run.notification.sent}</dd></div><div><dt className="text-xs text-muted-foreground">Pending</dt><dd className="text-xl font-semibold tabular-nums">{run.notification.pending}</dd></div></dl>}
  </div>;
}
function RunDetail({ runId, projectId, uid, refreshList }) {
  const path = `/pull-requests/${projectId}/runs/${runId}`;
  const { data: run, loading, error: loadError, reload } = useApiResource(path, uid);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const guard = useRef(false);
  const status = run?.status;
  const polling = activeStatuses.includes(status) ? 8000 : watchedStatuses.includes(status) ? 30000 : status === "shipped" && ["pending", "failed"].includes(run.notification?.status) ? 15000 : 0;
  useEffect(() => { if (!polling) return; const timer = setInterval(reload, polling); return () => clearInterval(timer); }, [polling, reload]);
  useEffect(() => { if (status) refreshList(); }, [status, refreshList]);
  async function act(action) {
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try {
      await apiRequest(`${path}/${action}`, { uid, method: "POST", body: {} });
      setConfirm(null); reload(); forgetResourcePrefix(`/workbench/${projectId}`, uid); refreshList();
    } catch (error) { setError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  if (loading) return <LoadingState />;
  if (loadError) return <div className="space-y-3"><ErrorMessage>{loadError}</ErrorMessage><Button variant="secondary" onClick={reload}>Retry</Button></div>;
  const stages = pipelineStates(run);
  const current = stages.find(stage => stage.state === "failed") || stages.find(stage => stage.state === "active") || stages[0];
  const stage = stages.find(item => item.id === selected) || current;
  return <section aria-label="Selected run" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:px-6"><div className="min-w-0"><h2 className="break-words text-base font-semibold">{run.issue.title}</h2><p role="status" className="mt-1 text-xs text-muted-foreground">{runLabels[status] || status}</p></div><div className="flex gap-2">{run.prUrl && <Button asChild variant="secondary"><a href={run.prUrl} target="_blank" rel="noreferrer">PR #{run.prNumber}</a></Button>}{run.branch && !run.active && !["shipped", "cancelled"].includes(status) && <Button variant="secondary" disabled={pending} onClick={() => act("refresh")} aria-label="Refresh GitHub status">Refresh</Button>}</div></header>
    <FixPipeline run={run} selectedStage={stage.id} onSelect={id => { setSelected(id); setDetailOpen(true); }} />
    {current.state === "failed" && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4 sm:px-6"><p className="min-w-0 flex-1 text-sm text-destructive">{current.label} needs attention.</p><Button variant="secondary" onClick={() => { setSelected(current.id); setDetailOpen(true); }}>View details</Button></div>}
    <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card p-4 sm:px-6">
      {["queued", "assessing", "eligible", "queued_fix", "generating"].includes(status) && <Button variant="destructive" disabled={pending} onClick={() => setConfirm("cancel")}>Cancel run</Button>}
      {status === "failed" && run.branch && <Button variant="secondary" loading={pending} onClick={() => act("recover")}>Recover publication</Button>}
      {status === "eligible" && <Button loading={pending} onClick={() => act("attempt")}>Start fix</Button>}
      {status === "merged" && <Button disabled={pending} onClick={() => setConfirm("shipped")}>Mark shipped</Button>}
      {!['eligible', 'merged'].includes(status) && <Button variant="secondary" onClick={() => setDetailOpen(true)}>Step details</Button>}
    </footer>
    {error && <div className="px-5 pb-4"><ErrorMessage>{error}</ErrorMessage></div>}
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent size="lg" className="max-h-[calc(100dvh-2rem)] overflow-y-auto border border-border bg-card text-foreground"><DialogHeader><DialogTitle>{stage.label}</DialogTitle><DialogDescription>{stage.state === "failed" ? "Needs attention" : stage.state === "complete" ? "Complete" : stage.state === "waiting" ? "Waiting" : "Run details"}</DialogDescription></DialogHeader><StageDetail stage={stage} run={run} /><div className="mt-6 border-t border-border pt-4"><h3 className="mb-4 text-sm font-semibold">Execution trace</h3><ol aria-label="Execution trace" className="space-y-0">{run.events?.map((event, index) => <li key={index} className="relative ms-1 border-s border-border pb-5 ps-5 last:border-transparent last:pb-0"><span aria-hidden="true" className={`absolute -start-[5px] top-1 h-2 w-2 rounded-full ${event.status === "failed" ? "bg-destructive" : "bg-muted-foreground"}`} /><time className="text-[11px] tabular-nums text-muted-foreground" dateTime={event.at}>{date(event.at)} · {new Date(event.at).toLocaleTimeString()}</time><p className={`mt-1 break-words text-xs leading-5 ${event.status === "failed" ? "text-destructive" : "text-foreground"}`}>{event.message}</p></li>)}</ol></div></DialogContent></Dialog>
    <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => act(confirm)} pending={pending} error={error} title={confirm === "shipped" ? "Has this fix reached users?" : "Cancel this run?"} description={confirm === "shipped" ? "Mark the issue Done and send shipping emails to linked reporters who opted in, if enabled for this project." : "Stop this attempt. Issues moved by this run return to To do. Published PRs remain on GitHub."} confirmLabel={confirm === "shipped" ? "Mark shipped" : "Cancel run"} confirmVariant={confirm === "shipped" ? "primary" : "destructive"} />
  </section>;
}
function ProjectPullRequests({ project, uid, params, setParams }) {
  const root = `/pull-requests/${project._id}`;
  const { data, loading, error, reload } = useApiResource(root, uid);
  const board = useApiResource(`/workbench/${project._id}`, uid);
  const reloadBoard = board.reload;
  const refreshAll = useCallback(() => { reload(); reloadBoard(); }, [reload, reloadBoard]);
  const issueId = params.get("issue") || "";
  const [acceptance, setAcceptance] = useState("");
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const guard = useRef(false);
  const selectId = useId();
  const busy = data?.runs?.some(run => run.active);
  useEffect(() => { if (!busy) return; const timer = setInterval(reload, 8000); return () => clearInterval(timer); }, [busy, reload]);
  const issues = (board.data || []).filter(issue => !issue.deleted && issue.status !== "done");
  const issue = issues.find(item => item._id === issueId);
  const runId = params.get("run") || data?.runs?.[0]?._id;
  async function assess(event) {
    event.preventDefault(); if (guard.current) return;
    guard.current = true; setPending(true); setSubmitError("");
    try {
      const run = await apiRequest(`${root}/runs`, { uid, method: "POST", body: { issueId, acceptance } });
      setParams({ project: project._id, issue: issueId, run: run._id }); reload();
    } catch (error) { setSubmitError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  if (loading) return <LoadingState />;
  if (error) return <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button variant="secondary" onClick={reload}>Retry</Button></div>;
  return <>
    <RepositoryConnection key={`${project._id}-${data.connection?.connectedAt || "new"}-${params.get("github") || ""}`} projectId={project._id} uid={uid} data={data} busy={busy} reload={reload} result={params.get("github")} />
    {data.connection && <>
      <section aria-label="New assessment" className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-base font-semibold">Start with one issue</h2>
        {board.error ? <div className="space-y-2"><ErrorMessage>{board.error}</ErrorMessage><Button variant="secondary" onClick={board.reload}>Reload issues</Button></div> : <form onSubmit={assess} className="space-y-4">
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-3"><div className="space-y-2"><p id={selectId} className="text-sm text-muted-foreground">Workbench issue</p><Select value={issueId} disabled={pending || board.loading || !issues.length || busy} onValueChange={value => { setParams(previous => { const next = new URLSearchParams(previous); next.set("issue", value); return next; }); setAcceptance(""); setSubmitError(""); }}><SelectTrigger aria-labelledby={selectId} placeholder={board.loading ? "Loading issues…" : issues.length ? "Choose an open issue" : "No open issues"} className="h-10 w-full rounded-md bg-background" /><SelectContent>{issues.map(item => <SelectItem key={item._id} value={item._id}>{item.title}</SelectItem>)}</SelectContent></Select></div>{issue?.description && <p className="break-words text-sm leading-6 text-muted-foreground">{issue.description}</p>}</div>
            <FormField as="textarea" label="Expected result" rows={3} maxLength={4000} minLength={20} required value={acceptance} disabled={pending || busy} onChange={event => setAcceptance(event.target.value)} placeholder="Describe the exact behavior this fix should produce." />
          </div>
          <ErrorMessage>{submitError}</ErrorMessage><div className="flex flex-wrap items-center justify-end gap-3">{busy && <p role="status" className="text-xs text-muted-foreground">A run is already in progress.</p>}<Button type="submit" loading={pending} disabled={!data.configured || !issue || acceptance.trim().length < 20 || busy}>Assess this issue</Button></div>
        </form>}
      </section>
      {runId ? <RunDetail key={runId} runId={runId} projectId={project._id} uid={uid} refreshList={refreshAll} /> : <EmptyPipeline />}
    </>}
    {data.runs.length > 0 && <section aria-label="Run history" className="rounded-xl border border-border bg-card px-5 py-3 sm:px-6"><Accordion className="w-full" size="compact"><AccordionItem value="history" highlight="trigger"><AccordionTrigger>Run history · {data.runs.length}</AccordionTrigger><AccordionContent><ul className="divide-y divide-border">{data.runs.map(run => <li key={run._id}><button type="button" aria-pressed={run._id === runId} onClick={() => { setParams({ project: project._id, issue: run.issueId, run: run._id }); setAcceptance(""); }} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-card px-2 py-3 text-left outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"><span className="min-w-0 break-words text-sm font-medium">{run.issue.title}</span><span className="text-xs text-muted-foreground">{runLabels[run.status]} · {date(run.createdAt)}</span></button></li>)}</ul></AccordionContent></AccordionItem></Accordion></section>}
  </>;
}
export default function PullRequests() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const projects = data || [];
  const project = projects.find(item => item._id === params.get("project")) || projects[0];
  return <><PageHeader title="Pull requests" description="Turn a small feedback issue into a draft you can review." action={project && <ProjectPicker projects={projects} value={project._id} triggerClassName="bg-card hover:bg-card" onChange={value => setParams({ project: value })} />} />{loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Retry</Button></div> : !project ? <EmptyState title="Create a project first" description="Connect a repository once your project has feedback to work on." /> : <ProjectPullRequests key={project._id} project={project} uid={user?.uid} params={params} setParams={setParams} />}</>;
}
