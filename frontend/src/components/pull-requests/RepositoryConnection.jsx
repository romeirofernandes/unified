import { useId, useRef, useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ErrorMessage } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";

const messages = {
  expired: "That link expired. Refresh repositories to reconnect with GitHub.",
  error: "GitHub couldn’t finish connecting. Check app access, then refresh repositories.",
  denied: "GitHub authorization was cancelled. You can reconnect below.",
  install_required: "Allow repository access on GitHub, then refresh the repository list.",
};
export default function RepositoryConnection({ projectId, uid, data, busy, reload, result }) {
  const options = data.repositories?.length ? data.repositories : data.connection ? [{ repositoryId: data.connection.repository, repository: data.connection.repository }] : [];
  const current = options.find(item => item.repository === data.connection?.repository)?.repositoryId;
  const [selected, setSelected] = useState(current ? String(current) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const guard = useRef(false);
  const labelId = useId();
  async function mutate(action) {
    if (guard.current) return;
    guard.current = true; setPending(true); setError("");
    try {
      if (action === "authorize") {
        const response = await apiRequest(`/pull-requests/${projectId}/connect`, { uid, method: "POST", body: {} });
        window.location.assign(response.url); return;
      }
      await apiRequest(`/pull-requests/${projectId}/connection${action === "save" ? "/repository" : ""}`, { uid, method: action === "save" ? "PUT" : "DELETE", ...(action === "save" ? { body: { repositoryId: Number(selected) } } : {}) });
      setDisconnecting(false); reload();
    } catch (error) { setError(error.message); }
    finally { guard.current = false; setPending(false); }
  }
  return <section aria-label="Repository connection" className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3"><h2 className="text-base font-semibold">Repository</h2>{data.connection && <span className="text-xs text-muted-foreground">Connected · {data.connection.defaultBranch}</span>}</div>
      <div className="flex flex-wrap gap-2">
        {data.installUrl && <Button asChild variant="secondary"><a href={data.installUrl} target="_blank" rel="noreferrer">{options.length ? "Manage GitHub access" : "Install GitHub App"}</a></Button>}
        <Button variant="secondary" loading={pending} disabled={!data.configured || busy} onClick={() => mutate("authorize")}>{options.length ? "Refresh repositories" : "Connect GitHub"}</Button>
        {data.connection && <Button variant="destructive" disabled={pending || busy} onClick={() => setDisconnecting(true)}>Disconnect</Button>}
      </div>
    </div>
    {data.configured ? <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2"><p id={labelId} className="text-sm text-muted-foreground">Repository for this project</p><Select value={selected} onValueChange={setSelected} disabled={pending || busy || !options.length}><SelectTrigger aria-labelledby={labelId} className="h-10 w-full rounded-md bg-background" placeholder={options.length ? "Choose a repository" : "Connect GitHub to load repositories"} /><SelectContent>{options.map(item => <SelectItem key={item.repositoryId} value={String(item.repositoryId)}>{item.repository}</SelectItem>)}</SelectContent></Select></div>
        {selected && selected !== String(current || "") && <Button disabled={pending || busy} loading={pending} onClick={() => mutate("save")}>Use repository</Button>}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">On GitHub, choose <strong className="font-medium text-foreground">All repositories</strong> for future projects, or keep previous selections checked when adding a repository. Refresh this list after changing access.</p>
    </> : <p className="text-sm text-muted-foreground">GitHub connection is unavailable. Ask your workspace administrator to enable it.</p>}
    {messages[result] && <p role="alert" className="text-sm text-destructive">{messages[result]}</p>}
    <ErrorMessage>{error}</ErrorMessage>
    <ConfirmDialog open={disconnecting} onClose={() => setDisconnecting(false)} onConfirm={() => mutate("disconnect")} pending={pending} error={error} title="Disconnect this project?" description="This project will stop using the repository. Your other projects, GitHub app access, and existing PRs stay connected." confirmLabel="Disconnect" />
  </section>;
}
