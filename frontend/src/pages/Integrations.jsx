import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import { ErrorMessage, LoadingState, EmptyState } from "@/components/shared/PageState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/motion/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";
import SettingsSection from "@/components/settings/SettingsSection";

const date = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not yet";

function Channel({ channel, project, settings, uid, onSaved }) {
  const state = settings[channel] || {};
  const [enabled, setEnabled] = useState(state.enabled || false);
  const [cadence, setCadence] = useState(state.cadence || "daily");
  const [webhook, setWebhook] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const slack = channel === "slack";
  const ready = slack ? settings.slackConnected : settings.emailReady;
  const dirty = enabled !== !!state.enabled || cadence !== (state.cadence || "daily") || !!webhook;
  async function save(disconnect = false) {
    setPending(true); setError(""); setMessage("");
    try {
      const data = await apiRequest(`/integrations/${project._id}/${channel}`, { uid, method: "PUT", body: { enabled, cadence, ...(webhook ? { webhook } : {}), disconnect } });
      onSaved(data);
      setWebhook("");
      if (disconnect) setEnabled(false);
      setMessage(disconnect ? "Slack disconnected." : "Saved. Digests include new feedback from now on; empty periods are skipped.");
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  }
  async function test() {
    setPending(true); setError(""); setMessage("");
    try {
      const data = await apiRequest(`/integrations/${project._id}/${channel}/test`, { uid, method: "POST" });
      setMessage(data.message);
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  }
  return <SettingsSection id={`digest-${channel}`} title={slack ? "Slack" : "Email"} description={slack ? "Keep your team up to date in a channel, with a digest of new feedback." : "Get a digest in your account’s inbox, without checking the dashboard."}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{slack ? settings.slackConnected ? "Workspace connected" : "Connect a workspace" : settings.email}</p>
        <span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">{state.enabled ? "Active" : "Paused"}</span>
      </div>
      {slack ? <div className="space-y-2">
        <FormField label={settings.slackConnected ? "Replace incoming webhook (optional)" : "Incoming webhook URL"} type="password" autoComplete="off" placeholder="https://hooks.slack.com/services/…" value={webhook} onChange={(event) => setWebhook(event.target.value)} disabled={pending} />
        <p className="text-xs leading-5 text-muted-foreground">In your Slack app, enable Incoming Webhooks, choose “Add New Webhook to Workspace”, and select a channel. <a className="underline underline-offset-4" href="https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/" target="_blank" rel="noreferrer">Slack setup guide</a></p>
      </div> : !settings.emailReady && <p className="rounded border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Email delivery hasn’t been configured for this workspace yet. You can use Slack in the meantime.</p>}
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <FormField label="Digest frequency" as="select" value={cadence} onChange={(event) => setCadence(event.target.value)} disabled={pending}>
          <option value="hourly">Every hour</option><option value="daily">Every 24 hours</option>
        </FormField>
        <div className="pb-2"><Checkbox label="Send feedback digests" checked={enabled} onCheckedChange={setEnabled} disabled={pending || (!slack && !settings.emailReady)} /></div>
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
      {dirty && <p className="text-xs text-muted-foreground">Save your changes before sending a test.</p>}
    </div>
  </SettingsSection>;
}
function ProjectConnections({ project, uid }) {
  const { data, loading, error, reload, setData } = useApiResource(`/integrations/${project._id}`, uid);
  if (loading) return <LoadingState />;
  if (error) return <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div>;
  return <div className="space-y-10">
    <section className="border-y border-border py-5 text-sm leading-6 text-muted-foreground">
      Each digest includes the number of new responses, an AI overview, and requests to address. The first digest arrives one interval after you enable delivery. Paused periods are excluded when you resume. Tests use sample feedback.
    </section>
    <Channel channel="slack" project={project} settings={data} uid={uid} onSaved={setData} />
    <Channel channel="email" project={project} settings={data} uid={uid} onSaved={setData} />
    <section aria-labelledby="digest-preview" className="grid gap-4 border-t border-border pt-8 lg:grid-cols-[minmax(180px,0.6fr)_minmax(0,1.4fr)] lg:gap-8">
      <div className="space-y-2"><h2 id="digest-preview" className="text-xl">What you’ll receive</h2><p className="text-sm text-muted-foreground">A sample digest. Real digests use your new feedback.</p></div>
      <div className="space-y-4 rounded-md border border-border bg-card p-5 text-sm">
        <div><p className="font-medium">{project.name}</p><p className="mt-1 text-xs text-muted-foreground">3 new responses</p></div>
        <p className="leading-6">People find the setup straightforward. Two responses ask for clearer installation instructions, and one reports a mobile layout issue.</p>
        <div className="space-y-2"><p className="text-xs text-muted-foreground">What to address</p><ul className="list-disc space-y-2 ps-4"><li>Clarify the package installation steps</li><li>Check the form layout on small screens</li></ul></div>
        <Link className="inline-block underline underline-offset-4" to={`/project/${project._id}/feedbacks`}>View responses</Link>
      </div>
    </section>
  </div>;
}
export default function Integrations() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiResource("/projects", user?.uid);
  const [selected, setSelected] = useState("");
  const projects = data || [];
  const project = projects.find((item) => item._id === selected) || projects[0];
  return <>
    <PageHeader title="Integrations" description="Bring feedback summaries to your team, in Slack or your inbox." />
    {loading ? <LoadingState /> : error ? <div className="space-y-3"><ErrorMessage>{error}</ErrorMessage><Button onClick={reload}>Try again</Button></div> : !projects.length ? <EmptyState title="Create a project first" description="Once you have a project, you can connect Slack and email digests here." /> : <div className="space-y-6">
      <div className="max-w-sm"><FormField as="select" label="Project" value={project._id} onChange={(event) => setSelected(event.target.value)}>{projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</FormField></div>
      <ProjectConnections key={project._id} project={project} uid={user?.uid} />
    </div>}
  </>;
}
