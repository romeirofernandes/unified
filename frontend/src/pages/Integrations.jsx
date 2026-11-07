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
  return <div className="min-w-0 space-y-2">
    <p id={id} className="text-sm text-muted-foreground">{label}</p>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-labelledby={id} className="h-10 w-full rounded-md" />
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

const date = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not yet";

function Channel({ channel, project, settings, uid, onSaved }) {
  const state = settings[channel] || {};
  const [enabled, setEnabled] = useState(state.enabled || false);
  const [cadence, setCadence] = useState(state.cadence || "daily");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const slack = channel === "slack";
  const ready = slack ? settings.slackConnected : settings.emailReady;
  const dirty = enabled !== !!state.enabled || cadence !== (state.cadence || "daily");
  async function save(disconnect = false) {
    setPending(true); setError(""); setMessage("");
    try {
      const data = await apiRequest(`/integrations/${project._id}/${channel}`, { uid, method: "PUT", body: { enabled, cadence, disconnect } });
      onSaved(data);
      if (disconnect) setEnabled(false);
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
  return <SettingsSection id={`digest-${channel}`} title={slack ? <span className="flex items-center gap-2"><img src="/logos/slack.svg" alt="" className="size-5" />Slack</span> : "Email"} description={slack ? "Keep your team up to date in a channel, with a digest of new feedback." : "Get a digest in your account’s inbox, without checking the dashboard."}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{slack ? settings.slackConnected ? `${settings.slackWorkspace || "Workspace connected"}${settings.slackChannel ? ` · ${settings.slackChannel}` : ""}` : "Connect a workspace" : settings.email}</p>
        <span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">{state.enabled ? "Active" : "Paused"}</span>
      </div>
      {slack ? <div className="space-y-2">
        <Button variant="secondary" onClick={installSlack} disabled={pending || !settings.slackInstallReady}><img src="/logos/slack.svg" alt="" className="size-4" />{settings.slackConnected ? "Change workspace or channel" : "Install in workspace"}</Button>
        {!settings.slackInstallReady && <p className="text-xs text-muted-foreground">Slack installation hasn’t been configured for this workspace yet.</p>}
      </div> : !settings.emailReady && <p className="rounded border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Email delivery hasn’t been configured for this workspace yet.</p>}
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <IntegrationSelect label="Digest frequency" value={cadence} onChange={setCadence} disabled={pending} options={[{ value: "hourly", label: "Every hour" }, { value: "daily", label: "Every 24 hours" }]} />
        <div className="pb-2"><Checkbox label="Send feedback digests" checked={enabled} onCheckedChange={setEnabled} disabled={pending || !ready} /></div>
      </div>
      <dl className="grid gap-3 border-y border-border py-4 text-xs sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Next check</dt><dd className="mt-1">{state.enabled ? date(state.nextRunAt) : "Delivery paused"}</dd></div>
        <div><dt className="text-muted-foreground">Last delivered</dt><dd className="mt-1">{date(state.lastSentAt)}{state.lastSentAt ? ` · ${state.lastCount} responses` : ""}</dd></div>
      </dl>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <ErrorMessage>{error}</ErrorMessage>
      <p role="status" className="text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save()} disabled={pending || !dirty}>Save {slack ? "Slack" : "email"}</Button>
        <Button variant="secondary" onClick={test} disabled={pending || !ready || dirty}>Send test digest</Button>
        {slack && settings.slackConnected && <Button variant="secondary" onClick={() => save(true)} disabled={pending}>Disconnect</Button>}
      </div>
    </div>
  </SettingsSection>;
}
function ProjectConnections({ project, uid }) {
  const { data, loading, error, reload, setData } = useApiResource(`/integrations/${project._id}`, uid);
  if (loading) return <LoadingState />;
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
  const selector = project && <div className="w-full min-w-52 sm:w-60"><IntegrationSelect label="Project" value={project._id} onChange={(value) => setParams({ project: value }, { replace: true })} options={projects.map((item) => ({ value: item._id, label: item.name }))} /></div>;
  return <>
    <PageHeader title="Integrations" description="Bring feedback summaries to your team, in Slack or your inbox." action={selector} />
    <ToastNotice message={toast} onClose={dismissToast} />
    {loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div> : !projects.length ? <EmptyState title="Create a project first" description="Once you have a project, you can connect Slack and email digests here." /> : <ProjectConnections key={project._id} project={project} uid={user?.uid} />}
  </>;
}
