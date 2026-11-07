import ProjectPicker from "@/components/shared/ProjectPicker";
import { AlertDialog } from "@animate-ui/react/primitives/base-ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import ToastNotice from "@/components/shared/ToastNotice";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/motion/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";
import SettingsSection from "@/components/settings/SettingsSection";

function IntegrationSelect({ label, value, onChange, options, disabled = false }) {
  const id = useId();
  return <div className="flex min-w-0 flex-col gap-2">
    <p id={id} className="text-sm text-muted-foreground">{label}</p>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-labelledby={id} className="h-10 w-full rounded-md" />
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

function SlackChannelSelect({ project, uid, value, onChange, currentName, disabled }) {
  const { data, error, loading, reload } = useApiResource(`/integrations/${project._id}/slack/channels`, uid);
  const [extra, setExtra] = useState([]);
  const [next, setNext] = useState(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState("");
  const entries = [...(data?.channels || []), ...extra];
  const channels = [...new Map(entries.map((item) => [item.id, item])).values()];
  const options = channels.map((item) => ({ value: item.id, label: `#${item.name}${item.private ? " · Private" : ""}` }));
  if (value && !options.some((item) => item.value === value)) options.unshift({ value, label: currentName || "Current channel" });
  async function loadMore() {
    setLoadingMore(true); setPageError("");
    try {
      const page = await apiRequest(`/integrations/${project._id}/slack/channels?cursor=${encodeURIComponent(next ?? data.nextCursor)}`, { uid });
      setExtra((previous) => [...previous, ...page.channels]);
      setNext(page.nextCursor);
    } catch (error) { setPageError(error.message); }
    finally { setLoadingMore(false); }
  }
  return <div className="space-y-2">
    <IntegrationSelect label="Channel" value={value} onChange={onChange} options={options} disabled={disabled || loading || !!error} />
    {loading && <p className="text-xs text-muted-foreground">Loading channels…</p>}
    <ErrorMessage>{error || pageError}</ErrorMessage>
    {error ? <Button variant="secondary" onClick={reload}>Try again</Button> : (next ?? data?.nextCursor) && <Button variant="ghost" disabled={loadingMore} onClick={loadMore}>Load more channels</Button>}
  </div>;
}

const date = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not yet";

function Channel({ channel, project, settings, uid, onSaved }) {
  const state = settings[channel] || {};
  const [enabled, setEnabled] = useState(state.enabled || false);
  const [cadence, setCadence] = useState(state.cadence || "daily");
  const [destination, setDestination] = useState(settings.slackChannelId || "");
  const [pending, setPending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dismissMessage = useCallback(() => setMessage(""), []);
  const slack = channel === "slack";
  const ready = slack ? settings.slackConnected : settings.emailReady;
  const dirty = enabled !== !!state.enabled || cadence !== (state.cadence || "daily") || (slack && destination !== (settings.slackChannelId || ""));
  async function save(disconnect = false) {
    setPending(true); setError(""); setMessage("");
    try {
      const data = await apiRequest(`/integrations/${project._id}/${channel}`, { uid, method: "PUT", body: { enabled, cadence, disconnect, ...(slack && destination ? { channelId: destination } : {}) } });
      onSaved(data);
      if (disconnect) { setEnabled(false); setDestination(""); setDisconnecting(false); }
      setMessage(disconnect ? "Slack disconnected." : "Saved. Digests include new feedback from now on; empty periods are skipped.");
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  }
  async function installSlack() {
    setPending(true); setError(""); setMessage("");
    try {
      const { url } = await apiRequest(`/integrations/${project._id}/slack/install`, { uid, method: "POST" });
      window.location.assign(url);
    } catch (error) { setError(error.message); setPending(false); }
  }
  async function test() {
    setPending(true); setError(""); setMessage("");
    try {
      const data = await apiRequest(`/integrations/${project._id}/${channel}/test`, { uid, method: "POST" });
      setMessage(data.message);
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  }
  return <SettingsSection id={`digest-${channel}`} title={slack ? <span className="flex items-center gap-2"><img src="/logos/slack.svg" alt="" className="size-5" />Slack</span> : <span className="flex items-center gap-2"><img src="/logos/gmail.svg" alt="" className="size-5" />Email</span>} description={slack ? "Keep your team up to date in a channel, with a digest of new feedback." : "Get a digest in your account’s inbox, without checking the dashboard."}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{slack ? settings.slackConnected ? `${settings.slackWorkspace || "Workspace connected"}${settings.slackChannel ? ` · ${settings.slackChannel}` : ""}` : "Connect a workspace" : settings.emailAddress}</p>
        {slack && settings.slackConnected && <Button variant="destructive" size="icon-compact" aria-label="Disconnect Slack" title="Disconnect Slack" onClick={() => { setError(""); setDisconnecting(true); }} disabled={pending}><HugeiconsIcon icon={Delete01Icon} size={16} aria-hidden="true" /></Button>}
      </div>
      {slack ? <div className="space-y-2">
        <Button variant="secondary" onClick={installSlack} disabled={pending || !settings.slackInstallReady}><span className="inline-flex items-center gap-2"><img src="/logos/slack.svg" alt="" className="size-4" />{settings.slackConnected ? settings.slackCanChooseChannel ? "Change workspace" : "Reconnect Slack" : "Install in workspace"}</span></Button>
        {!settings.slackInstallReady && <p className="text-xs text-muted-foreground">Slack installation hasn’t been configured for this workspace yet.</p>}
      </div> : !settings.emailReady && <p className="rounded border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Email delivery hasn’t been configured for this workspace yet.</p>}
      {slack && settings.slackConnected && (settings.slackCanChooseChannel
        ? <SlackChannelSelect project={project} uid={uid} value={destination} onChange={setDestination} currentName={settings.slackChannel} disabled={pending} />
        : <p className="text-xs text-muted-foreground">Reconnect Slack to choose channels here.</p>)}
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <IntegrationSelect label="Digest frequency" value={cadence} onChange={setCadence} disabled={pending} options={[{ value: "hourly", label: "Every hour" }, { value: "daily", label: "Every 24 hours" }]} />
        <div className="flex h-10 items-center"><Checkbox label="Send feedback digests" checked={enabled} onCheckedChange={setEnabled} disabled={pending || !ready} /></div>
      </div>
      <dl className="grid gap-3 border-y border-border py-4 text-xs sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Next check</dt><dd className="mt-1">{state.enabled ? date(state.nextRunAt) : "Delivery paused"}</dd></div>
        <div><dt className="text-muted-foreground">Last delivered</dt><dd className="mt-1">{date(state.lastSentAt)}{state.lastSentAt ? ` · ${state.lastCount} responses` : ""}</dd></div>
      </dl>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <ErrorMessage>{error}</ErrorMessage>
      <AlertDialog.Root open={disconnecting} onOpenChange={(open) => { if (!pending) setDisconnecting(open); }}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop forceRender onClick={() => { if (!pending) setDisconnecting(false); }} className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-md border border-border bg-background p-6 text-foreground shadow-xl">
            <AlertDialog.Title className="text-xl">Disconnect Slack?</AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">Slack digests for this project will stop. You can reconnect the workspace anytime.</AlertDialog.Description>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="flex justify-end gap-2"><Button variant="secondary" disabled={pending} onClick={() => setDisconnecting(false)}>Cancel</Button><Button variant="destructive" loading={pending} onClick={() => save(true)}>Disconnect Slack</Button></div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <ToastNotice message={message} onClose={dismissMessage} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save()} disabled={pending || !dirty}>Save {slack ? "Slack" : "email"}</Button>
        <Button variant="secondary" onClick={test} disabled={pending || !ready || dirty}>Send test digest</Button>
      </div>
    </div>
  </SettingsSection>;
}
function ProjectConnections({ project, uid }) {
  const { data, loading, error, reload, setData } = useApiResource(`/integrations/${project._id}`, uid);
  if (loading) return <LoadingState variant="integrations" />;
  if (error) return <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div>;
  return <div className="space-y-10">
    <Channel channel="slack" project={project} settings={data} uid={uid} onSaved={setData} />
    <Channel channel="email" project={project} settings={data} uid={uid} onSaved={setData} />
  </div>;
}
export default function Integrations() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const [toast, setToast] = useState(() => ({ connected: "Slack connected. Choose your schedule and enable digests.", cancelled: "Slack installation cancelled.", error: "Slack installation failed. Please try again." })[params.get("slack")] || "");
  const dismissToast = useCallback(() => setToast(""), []);
  useEffect(() => {
    if (!params.has("slack")) return;
    const next = new URLSearchParams(params);
    next.delete("slack");
    setParams(next, { replace: true });
  }, [params, setParams]);
  const projects = data || [];
  const project = projects.find((item) => item._id === params.get("project")) || projects[0];
  const selector = project && <ProjectPicker projects={projects} value={project._id} onChange={(value) => setParams({ project: value }, { replace: true })} />;
  return <>
    <PageHeader title="Integrations" description="Bring feedback summaries to your team, in Slack or your inbox." action={selector} />
    <ToastNotice message={toast} onClose={dismissToast} />
    {loading ? <LoadingState variant="integrations" /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div> : !projects.length ? <EmptyState title="Create a project first" description="Once you have a project, you can connect Slack and email digests here." /> : <ProjectConnections key={project._id} project={project} uid={user?.uid} />}
  </>;
}
