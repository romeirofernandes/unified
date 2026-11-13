export default function PullRequestLayout({ detail = false }) {
  if (detail) return <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg">Fix pipeline</h2><p className="text-sm">Review the progress of this fix.</p><div className="grid gap-4 sm:grid-cols-3">{["Assess", "Implement", "Review"].map(stage => <div key={stage} className="space-y-3 rounded-md border border-border p-4"><h3>{stage}</h3><p className="text-sm">Run progress and details</p></div>)}</div></section>;
  return <div className="space-y-7">
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-base font-semibold">Repository connection</h2><p className="text-sm">Connected repository and branch</p><button className="h-10 rounded-md border border-border px-4">Connect GitHub</button></section>
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-base font-semibold">Start with one issue</h2><div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]"><div className="space-y-2"><p className="text-sm">Workbench issue</p><div className="h-10 rounded-md border border-border" /></div><div className="space-y-2"><p className="text-sm">Expected result</p><div className="h-24 rounded-md border border-border" /></div></div><div className="flex justify-end"><button className="h-10 rounded-md px-4">Assess this issue</button></div></section>
    <PullRequestLayout detail />
  </div>;
}
