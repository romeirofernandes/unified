import { useId, useRef, useState } from "react";
import FormField from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";
import { forgetResource } from "@/lib/resource-cache";
import { githubRepository } from "@/lib/github-repository";

function TestCheck({ projectId, uid, connection, busy, onSave }) {
  const { data, loading, error, reload } = useApiResource(`/pull-requests/${projectId}/checks`, uid);
  const [selected, setSelected] = useState(connection.requiredCheck || "");
  const [manual, setManual] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState("");
  const guard = useRef(false);
  const labelId = useId();
  const names = [...new Set([...(data?.names || []), ...(connection.requiredCheck ? [connection.requiredCheck] : [])])];
  const manualEntry = manual || (!loading && !names.length);
  const value = selected || (!manual && names.length === 1 ? names[0] : "");
  async function save(event) {
    event.preventDefault(); if (guard.current) return;
    guard.current = true; setPending(true); setSaveError("");
    try { await apiRequest(`/pull-requests/${projectId}/connection/check`, { uid, method: "PUT", body: { requiredCheck: value } }); onSave(); }
    catch (error) { setSaveError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  return <form onSubmit={save} className="space-y-4">
    <div className="space-y-1"><h3 className="text-base font-semibold">3. Choose the test check</h3><p className="text-sm leading-6 text-muted-foreground">Unified will wait for this check to pass on every draft PR. Choose the check that runs your repository’s tests.</p></div>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Looking for checks on GitHub…</p> : manualEntry ? <><p className="text-sm leading-6 text-muted-foreground">{names.length ? "Find its exact name in a pull request’s Checks tab." : "No checks were found on the default branch. If your tests only run on PRs, enter their exact check name. If you have no tests yet, add a test workflow first."}</p><FormField label="Test check name" value={selected} onChange={event => setSelected(event.target.value)} placeholder="For example: tests" maxLength={120} required disabled={pending || busy} /></> : <div className="space-y-2"><p id={labelId} className="text-sm text-muted-foreground">Test check</p><Select value={value} onValueChange={setSelected} disabled={pending || busy}><SelectTrigger aria-labelledby={labelId} className="w-full rounded-md bg-background" placeholder="Choose a check" /><SelectContent>{names.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="ghost" onClick={() => { setSelected(""); setManual(true); }}>My check isn’t listed</Button></div>}
    {error && <div className="space-y-2"><p className="text-sm text-muted-foreground">We couldn’t load the check names. You can enter one above or retry.</p><Button type="button" variant="ghost" onClick={reload}>Look for checks again</Button></div>}
    <ErrorMessage>{saveError}</ErrorMessage>
    <Button type="submit" loading={pending} disabled={loading || busy || !value.trim()}>{connection.requiredCheck ? "Save check" : "Finish setup"}</Button>
  </form>;
}

const recovery = {
  expired: "That connection link is no longer active. Your repository details are saved below — press Connect repository to get a fresh link.",
  error: "GitHub couldn’t finish the connection. Check the repository link below and press Connect repository to try again.",
  denied: "GitHub authorization was cancelled. Press Connect repository when you’re ready to continue.",
  install_required: "The app needs access to this repository. Allow access on GitHub, then return here to finish connecting.",
};

export default function RepositoryConnection({ projectId, uid, data, busy, reload, result }) {
  const [editing, setEditing] = useState(!!recovery[result]);
  const [step, setStep] = useState(["expired", "error", "denied", "installed"].includes(result) ? 2 : 1);
  const [repository, setRepository] = useState(data.setupRepository || data.connection?.repository || "");
  const [checkEditing, setCheckEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const guard = useRef(false);
  async function connect(event) {
    event.preventDefault(); if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try {
      const name = githubRepository(repository);
      const response = await apiRequest(`/pull-requests/${projectId}/connect`, { uid, method: "POST", body: { repository: name } });
      window.location.assign(response.url);
    } catch (error) { setError(error.message); guard.current = false; setPending(false); }
  }
  async function disconnect() {
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try { await apiRequest(`/pull-requests/${projectId}/connection`, { uid, method: "DELETE" }); forgetResource(`/pull-requests/${projectId}/checks`, uid); setDisconnecting(false); setEditing(false); reload(); }
    catch (error) { setError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  const connected = !!data.connection && !editing;
  return <section aria-label="Repository connection" className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-1"><h2 className="break-all text-base font-semibold">{connected ? data.connection.repository : "Connect GitHub"}</h2><p className="text-sm leading-6 text-muted-foreground">{connected ? data.connection.requiredCheck ? `Connected · ${data.connection.defaultBranch} · Test check: ${data.connection.requiredCheck}` : "Repository connected. One step left: choose the test check." : "Allow access, connect your repository, then choose a test check. We’ll guide you through each step."}</p></div>
      {connected && <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={busy || pending} onClick={() => setCheckEditing(!checkEditing)}>Test settings</Button><Button variant="ghost" disabled={busy || pending} onClick={() => { setRepository(data.connection.repository); setEditing(true); setStep(2); }}>Change repository</Button><Button variant="ghost" disabled={busy || pending} onClick={() => setDisconnecting(true)}>Disconnect</Button></div>}
    </div>
    {recovery[result] && <p role="alert" className="rounded-md border border-border bg-background p-3 text-sm leading-6">{recovery[result]}</p>}
    {result === "connected" && connected && <p role="status" className="text-sm text-muted-foreground">GitHub authorization complete.</p>}
    {!data.configured ? <p className="text-sm text-muted-foreground">GitHub connection is not available in this workspace yet. Your workspace administrator needs to enable it.</p> : !connected ? <>
      <ol aria-label="GitHub setup progress" className="grid gap-2 text-xs sm:grid-cols-3">{["Allow access", "Connect repository", "Choose test check"].map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={`rounded-md border px-3 py-2 ${step === index + 1 ? "border-foreground/30 bg-muted/50 font-medium" : "border-border text-muted-foreground"}`}>{index + 1}. {label}</li>)}</ol>
      {step === 1 ? <div className="space-y-4"><div className="space-y-1"><h3 className="text-base font-semibold">1. Allow repository access</h3><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Open GitHub, choose <strong className="font-medium text-foreground">Only select repositories</strong>, and select the repository you want Unified to fix. Save or install, then return to this tab.</p></div><div className="flex flex-wrap gap-2"><Button asChild disabled={busy}><a href={data.installUrl} target="_blank" rel="noreferrer" onClick={() => setStep(2)}>Allow access on GitHub</a></Button><Button variant="ghost" disabled={busy} onClick={() => setStep(2)}>Already installed? Continue</Button></div></div> : <form onSubmit={connect} className="space-y-4"><div className="space-y-1"><h3 className="text-base font-semibold">2. Connect your repository</h3><p className="text-sm leading-6 text-muted-foreground">Paste the repository link. The next button opens GitHub for authorization and brings you back here automatically.</p></div><FormField label="GitHub repository" placeholder="https://github.com/owner/repository" value={repository} onChange={event => setRepository(event.target.value)} maxLength={200} required disabled={pending || busy} /><ErrorMessage>{error}</ErrorMessage><div className="flex flex-wrap gap-2"><Button type="submit" loading={pending} disabled={busy || !repository.trim()}>Connect repository</Button><Button type="button" variant="ghost" disabled={pending || busy} onClick={() => setStep(1)}>Back to repository access</Button>{data.connection && <Button type="button" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>Cancel</Button>}</div></form>}
      <p className="text-xs leading-5 text-muted-foreground">Unified can read the selected repository and open draft PRs. Selected source files are sent to Groq and cached encrypted for 7 days. You review and merge changes on GitHub.</p>
    </> : (!data.connection.requiredCheck || checkEditing) && <div className="border-t border-border pt-5"><TestCheck projectId={projectId} uid={uid} connection={data.connection} busy={busy} onSave={() => { setCheckEditing(false); reload(); }} /></div>}
    <ConfirmDialog open={disconnecting} onClose={() => setDisconnecting(false)} onConfirm={disconnect} pending={pending} error={error} title="Disconnect this repository?" description="Source-file caches will be removed and status syncing will stop. Existing branches and pull requests remain on GitHub." confirmLabel="Disconnect" />
  </section>;
}
