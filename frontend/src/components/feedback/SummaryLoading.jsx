import { Skeleton } from "skullet/react";
import "skullet/styles.css";

export default function SummaryLoading({ updating }) {
  return (
    <section aria-busy="true" aria-label="Generating feedback summary" className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <span aria-hidden="true" className="size-2 rounded-full bg-fluid-accent motion-safe:animate-pulse" />
        <p role="status" className="text-sm font-medium">{updating ? "Updating your feedback summary…" : "Summarizing your feedback…"}</p>
      </div>
      <Skeleton loading label="Reading responses and identifying issues">
        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-10">
          <div className="space-y-4"><p className="text-xs">Overview</p><p className="text-sm leading-7">A clear overview of your customers’ feedback, with the main patterns and requests collected in one place.</p></div>
          <div className="space-y-4"><p className="text-xs">What to address</p>{[1, 2, 3].map((index) => <p key={index} className="text-sm leading-6">A reported issue and the change your users need.</p>)}</div>
        </div>
      </Skeleton>
    </section>
  );
}
