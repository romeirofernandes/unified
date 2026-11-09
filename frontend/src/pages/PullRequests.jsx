import { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import ProjectPicker from "@/components/shared/ProjectPicker";
import FormField from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";
import { forgetResource } from "@/lib/resource-cache";
import { runLabels, activeStatuses, watchedStatuses, runStage } from "@/lib/pull-request-status";

const date = value => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const textLink = "text-sm font-medium underline underline-offset-4 decoration-border hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function RunFlow({ status }) {
  const stage = runStage(status);
  return <ol aria-label="Fix workflow" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
    {["Assess scope", "Prepare patch", "Draft PR", "CI & review", "Shipped"].map((label, index) => <li key={label} aria-current={index === stage ? "step" : undefined} className={`min-w-0 rounded-md border px-3 py-3 text-xs ${index === stage ? "border-foreground/30 bg-muted/50 font-medium text-foreground" : "border-border text-muted-foreground"}`}>
      <span className="mb-2 block font-mono text-[11px] tabular-nums">{String(index + 1).padStart(2, "0")}{index < stage ? " · Complete" : ""}</span>{label}
    </li>)}
  </ol>;
}

function RepositoryConnection({ projectId, uid, data, busy, reload }) {
  const [editing, setEditing] = useState(false);
  const [repository, setRepository] = useState(data.connection?.repository || "");
  const [requiredCheck, setRequiredCheck] = useState(data.connection?.requiredCheck || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const guard = useRef(false);
  async function connect(event) {
    event.preventDefault();
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try {
      const result = await apiRequest(`/pull-requests/${projectId}/connect`, { uid, method: "POST", body: { repository: repository.trim(), requiredCheck: requiredCheck.trim() } });
      window.location.assign(result.url);
    } catch (error) { setError(error.message); guard.current = false; setPending(false); }
  }
  async function disconnect() {
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try { await apiRequest(`/pull-requests/${projectId}/connection`, { uid, method: "DELETE" }); setDisconnecting(false); setEditing(false); reload(); }
    catch (error) { setError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  return <section aria-label="Repository connection" className="rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1"><h2 className="text-base font-semibold">{data.connection ? data.connection.repository : "Connect a repository"}</h2><p className="text-sm text-muted-foreground">{data.connection ? `Base: ${data.connection.defaultBranch} · Required check: ${data.connection.requiredCheck}` : "Choose where Unified can open draft pull requests."}</p></div>
      {data.connection && <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={busy || pending} onClick={() => { setRepository(data.connection.repository); setRequiredCheck(data.connection.requiredCheck); setEditing(!editing); }}>Change</Button><Button variant="ghost" disabled={busy || pending} onClick={() => setDisconnecting(true)}>Disconnect</Button></div>}
    </div>
    {!data.configured ? <p className="mt-4 text-sm text-muted-foreground">GitHub connection is not available in this workspace yet. Your workspace administrator needs to enable it.</p> : (!data.connection || editing) && <form onSubmit={connect} className="mt-5 space-y-5 border-t border-border pt-5">
      <p className="text-sm leading-6 text-muted-foreground"><a href={data.installUrl} target="_blank" rel="noreferrer" className={textLink}>Install the GitHub App</a> on your chosen repository first, then authorize the connection below. You need write access to that repository.</p>
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="Repository" placeholder="owner/repository" value={repository} onChange={event => setRepository(event.target.value)} required maxLength={140} disabled={pending || busy} /><FormField label="Required CI check" placeholder="Exact check name, e.g. tests" value={requiredCheck} onChange={event => setRequiredCheck(event.target.value)} required maxLength={120} disabled={pending || busy} /></div>
      <p className="text-xs leading-5 text-muted-foreground">The issue brief, acceptance criteria, and selected source files are sent to Groq. Files are cached encrypted for 7 days. Unified opens drafts and waits for your existing CI; you review and merge on GitHub.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex flex-wrap gap-2"><Button type="submit" loading={pending} disabled={busy}>Authorize GitHub</Button>{editing && <Button type="button" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>Cancel</Button>}</div>
    </form>}
    <ConfirmDialog open={disconnecting} onClose={() => setDisconnecting(false)} onConfirm={disconnect} pending={pending} error={error} title="Disconnect this repository?" description="Source-file caches will be removed and status syncing will stop. Existing branches and pull requests remain on GitHub." confirmLabel="Disconnect" />
  </section>;
}

function RunDetail({ runId, projectId, uid, refreshList }) {
  const path = `/pull-requests/${projectId}/runs/${runId}`;
  const { data: run, loading, error: loadError, reload } = useApiResource(path, uid);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState(false);
  const guard = useRef(false);
  const status = run?.status;
  const polling = activeStatuses.includes(status) ? 8000 : watchedStatuses.includes(status) ? 60000 : 0;
  useEffect(() => { if (!polling) return; const timer = setInterval(reload, polling); return () => clearInterval(timer); }, [polling, reload]);
  async function act(action) {
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try {
      await apiRequest(`${path}/${action}`, { uid, method: "POST", body: {} });
      setShipping(false); reload(); refreshList();
      if (action === "shipped") forgetResource(`/workbench/${projectId}`, uid);
    } catch (error) { setError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  if (loading) return <LoadingState />;
  if (loadError) return <div className="space-y-3"><ErrorMessage>{loadError}</ErrorMessage><Button variant="secondary" onClick={reload}>Retry</Button></div>;
  return <section aria-label="Selected run" className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{runLabels[status] || status}</p><time className="text-xs text-muted-foreground" dateTime={run.createdAt}>{date(run.createdAt)}</time></div><h2 className="break-words text-xl font-semibold">{run.issue.title}</h2><p role="status" className="text-sm leading-6 text-muted-foreground">{run.message}</p></div>
    <RunFlow status={status} />
    {run.assessment?.reason && <div className="space-y-3"><h3 className="text-sm font-semibold">Scope assessment</h3><p className="text-sm leading-6 text-muted-foreground">{run.assessment.reason}</p>{run.assessment.plan?.length > 0 && <ol className="list-decimal space-y-2 ps-5 text-sm leading-6">{run.assessment.plan.map((step, index) => <li key={index}>{step}</li>)}</ol>}</div>}
    <div className="flex flex-wrap gap-2">
      {status === "eligible" && <Button loading={pending} onClick={() => act("attempt")}>Attempt fix & open draft</Button>}
      {run.prUrl && <Button asChild variant="secondary"><a href={run.prUrl} target="_blank" rel="noreferrer">Open draft on GitHub</a></Button>}
      {run.branch && !run.active && !["shipped", "cancelled"].includes(status) && <Button variant="ghost" disabled={pending} onClick={() => act("refresh")}>Refresh GitHub status</Button>}
      {status === "failed" && run.branch && <Button variant="secondary" loading={pending} onClick={() => act("recover")}>Recover publication</Button>}
      {status === "merged" && <Button disabled={pending} onClick={() => setShipping(true)}>Mark shipped</Button>}
      {["queued", "assessing", "eligible", "queued_fix", "generating"].includes(status) && <Button variant="ghost" disabled={pending} onClick={() => act("cancel")}>Cancel run</Button>}
    </div>
    {status === "eligible" && <p className="text-xs leading-5 text-muted-foreground">This attempts one bounded patch. If scope validation or CI fails, the run stops for a human. No automatic merge.</p>}
    <ErrorMessage>{error}</ErrorMessage>
    {run.checks?.length > 0 && <div className="space-y-3"><h3 className="text-sm font-semibold">GitHub checks</h3><ul className="divide-y divide-border">{run.checks.map((check, index) => <li key={`${check.name}-${index}`} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm"><span className="min-w-0 break-words">{check.name}{check.name === run.requiredCheck ? " · Required" : ""}</span><span className="text-muted-foreground">{check.conclusion || check.status}</span></li>)}</ul></div>}
    <Accordion type="multiple" size="compact" className="border-t border-border pt-2">
      <AccordionItem value="brief" highlight="trigger"><AccordionTrigger>Saved brief & acceptance criteria</AccordionTrigger><AccordionContent><div className="space-y-4 py-2 text-sm leading-6 text-foreground">{run.issue.description && <p className="whitespace-pre-wrap break-words">{run.issue.description}</p>}<div><h4 className="font-medium">Acceptance criteria</h4><p className="whitespace-pre-wrap break-words">{run.acceptance}</p></div></div></AccordionContent></AccordionItem>
      <AccordionItem value="context" highlight="trigger"><AccordionTrigger>Source context · {run.files?.length || 0} files</AccordionTrigger><AccordionContent><div className="space-y-3 py-2"><p className="break-all text-xs leading-5">{run.repository} · {run.baseBranch}<br />{run.baseSha || "Commit not selected yet"}</p><ul className="space-y-3">{run.files?.map(file => <li key={file.path} className="min-w-0 space-y-1"><p className="break-all font-mono text-xs text-foreground">{file.path}</p><p className="break-all font-mono text-[11px]">{file.sha} · {file.size.toLocaleString()} bytes</p></li>)}</ul><p className="text-xs">Run {run._id} · {run.model}</p></div></AccordionContent></AccordionItem>
      {run.patch?.length > 0 && <AccordionItem value="patch" highlight="trigger"><AccordionTrigger>Proposed patch · {new Set(run.patch.map(edit => edit.path)).size} files</AccordionTrigger><AccordionContent><div className="space-y-5 py-2">{run.patch.map((edit, index) => <div key={index} className="space-y-2"><p className="break-all font-mono text-xs text-foreground">{edit.path}</p><p className="text-xs font-medium">Before</p><pre className="whitespace-pre-wrap break-words rounded-md bg-background p-3 font-mono text-xs leading-5 text-foreground">{edit.before}</pre><p className="text-xs font-medium">After</p><pre className="whitespace-pre-wrap break-words rounded-md bg-background p-3 font-mono text-xs leading-5 text-foreground">{edit.after || "(Removed)"}</pre></div>)}</div></AccordionContent></AccordionItem>}
      <AccordionItem value="events" highlight="trigger"><AccordionTrigger>Run activity</AccordionTrigger><AccordionContent><ol className="space-y-4 py-2">{run.events?.map((event, index) => <li key={index} className="space-y-1"><time className="text-[11px]" dateTime={event.at}>{date(event.at)}</time><p className="text-xs leading-5 text-foreground">{event.message}</p></li>)}</ol></AccordionContent></AccordionItem>
    </Accordion>
    <ConfirmDialog open={shipping} onClose={() => setShipping(false)} onConfirm={() => act("shipped")} pending={pending} error={error} title="Has this fix reached users?" description="This marks the linked issue done and queues updates for people who opted in. Confirm after you have released the fix." confirmLabel="Mark shipped" confirmVariant="primary" />
  </section>;
}

function ProjectPullRequests({ project, uid, params, setParams }) {
  const root = `/pull-requests/${project._id}`;
  const { data, loading, error, reload } = useApiResource(root, uid);
  const board = useApiResource(`/workbench/${project._id}`, uid);
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
    {params.get("github") === "error" && <ErrorMessage>GitHub could not connect. Install the app on the selected repository, check your write access, then authorize again.</ErrorMessage>}
    {params.get("github") === "connected" && <p role="status" className="text-sm text-muted-foreground">GitHub repository connected.</p>}
    <RepositoryConnection key={`${project._id}-${data.connection?.connectedAt || "new"}`} projectId={project._id} uid={uid} data={data} busy={busy} reload={reload} />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
      <div className="min-w-0 space-y-5">
        <section aria-label="New assessment" className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="space-y-2"><h2 className="text-base font-semibold">Start with one issue</h2><p className="text-sm leading-6 text-muted-foreground">Small UI or documentation fixes only. Broad redesigns, backend changes, auth, payments, and dependencies need a human.</p></div>
          {board.error ? <div className="space-y-2"><ErrorMessage>{board.error}</ErrorMessage><Button variant="ghost" onClick={board.reload}>Reload issues</Button></div> : <form onSubmit={assess} className="space-y-5">
            <div className="space-y-2"><label id={selectId} className="block text-sm text-muted-foreground">Workbench issue</label><Select value={issueId} disabled={pending || board.loading || !issues.length || busy} onValueChange={value => { setParams(previous => { const next = new URLSearchParams(previous); next.set("issue", value); return next; }); setAcceptance(""); setSubmitError(""); }}><SelectTrigger aria-labelledby={selectId} placeholder={board.loading ? "Loading issues…" : issues.length ? "Choose an open issue" : "No open issues"} className="h-10 w-full rounded-md bg-background" /><SelectContent>{issues.map(item => <SelectItem key={item._id} value={item._id}>{item.title}</SelectItem>)}</SelectContent></Select></div>
            {issue?.description && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{issue.description}</p>}
            <FormField as="textarea" label="What should change, and how will you verify it?" rows={5} maxLength={4000} minLength={20} required value={acceptance} disabled={pending || busy} onChange={event => setAcceptance(event.target.value)} placeholder="Name the screen, the exact current behavior, the expected result, and the existing test or check that should verify it." />
            <ErrorMessage>{submitError}</ErrorMessage>
            <Button type="submit" loading={pending} disabled={!data.connection || !data.configured || !issue || acceptance.trim().length < 20 || busy}>Assess this issue</Button>
            {busy && <p role="status" className="text-xs text-muted-foreground">One run is active for this project. You can follow it on the right.</p>}
          </form>}
          <Link to={`/dashboard/workbench?project=${project._id}`} className={textLink}>Open workbench</Link>
        </section>
        {data.runs.length > 0 && <section aria-label="Run history" className="rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="mb-3 text-base font-semibold">Recent runs</h2><ul className="divide-y divide-border">{data.runs.map(run => <li key={run._id}><button type="button" aria-pressed={run._id === runId} onClick={() => setParams({ project: project._id, issue: run.issueId, run: run._id })} className={`w-full space-y-1 rounded-md px-2 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${run._id === runId ? "bg-muted/50" : "hover:bg-muted/30"}`}><span className="block break-words text-sm font-medium">{run.issue.title}</span><span className="block text-xs text-muted-foreground">{runLabels[run.status]} · {date(run.createdAt)}</span></button></li>)}</ul></section>}
      </div>
      {runId ? <RunDetail key={runId} runId={runId} projectId={project._id} uid={uid} refreshList={reload} /> : <section className="space-y-6 p-5 sm:p-6"><div className="space-y-2"><h2 className="text-xl font-semibold">From feedback to a reviewed fix</h2><p className="max-w-lg text-sm leading-6 text-muted-foreground">Assess first. Attempt only when the repository contains enough context for a small change. Every draft keeps its source files, patch, and verification history together.</p></div><RunFlow status="queued" /><p className="text-sm leading-6 text-muted-foreground">Passing CI means the configured check succeeded. You still review the code, merge on GitHub, and mark the fix shipped after release.</p></section>}
    </div>
  </>;
}

export default function PullRequests() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const projects = data || [];
  const project = projects.find(item => item._id === params.get("project")) || projects[0];
  return <>
    <PageHeader title="Pull requests" description="Turn a small feedback issue into a draft you can review." action={project && <ProjectPicker projects={projects} value={project._id} triggerClassName="bg-card hover:bg-card" onChange={value => setParams({ project: value })} />} />
    {loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Retry</Button></div> : !project ? <EmptyState title="Create a project first" description="Connect a repository once your project has feedback to work on." /> : <ProjectPullRequests key={project._id} project={project} uid={user?.uid} params={params} setParams={setParams} />}
  </>;
}
