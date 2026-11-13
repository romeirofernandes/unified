import { SkeletonBox } from "skullet/react";

export default function ProjectLayout() {
  return <div className="grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((id) => <article key={id} className="relative flex min-h-36 min-w-0 flex-col rounded-md border border-border bg-card p-4">
    <div className="absolute end-3 top-3 flex gap-2"><SkeletonBox width={28} height={28} radius={6} /><SkeletonBox width={28} height={28} radius={6} /></div>
    <h2 className="pe-20 text-lg leading-7">Customer feedback</h2><p className="mt-2 max-w-xs text-sm leading-6">Feedback from the people using your product.</p><div className="mt-auto flex justify-end pt-3"><span className="rounded-full px-2.5 py-1 text-xs">12 responses</span></div>
  </article>)}</div>;
}
