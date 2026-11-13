export default function WorkbenchLayout() {
  return <div className="grid min-h-80 gap-5 lg:grid-cols-3">{["To do", "In progress", "Done"].map(stage => <section key={stage} className="space-y-4 rounded-md border border-border bg-card p-4"><h2>{stage}</h2>{[1, 2].map(id => <article key={id} className="space-y-3 rounded-md border border-border p-4"><h3>Customer feedback issue</h3><p className="text-sm">Details of the next improvement to make.</p></article>)}</section>)}</div>;
}
