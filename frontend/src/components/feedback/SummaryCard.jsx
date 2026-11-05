import CopyButton from "@/components/shared/CopyButton";
import { feedbackPrompt } from "@/lib/feedback-prompt";

export default function SummaryCard({ summary, current }) {
  return (
    <section aria-labelledby="feedback-summary-title" className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="feedback-summary-title" className="text-base font-medium">Feedback summary</h2>
            <span className="rounded border border-fluid-accent/25 bg-fluid-accent/10 px-2 py-0.5 text-xs text-foreground">{current ? "Up to date" : "New responses"}</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Saved to your project · {summary.responseCount ?? summary.responseIds?.length ?? 0} responses · {new Date(summary.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
        </div>
        <CopyButton value={feedbackPrompt(summary)} label="prompt" showLabel />
      </div>
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-10">
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overview</h3>
          <p className="max-w-prose whitespace-pre-wrap text-sm leading-7">{summary.tldr}</p>
          <p className="text-xs leading-5 text-muted-foreground">{current ? "This summary updates automatically when new responses arrive." : "New responses are being added to this summary."}</p>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What to address</h3>
          <ol className="space-y-3">
            {summary.features.map((feature, index) => (
              <li key={`${index}-${feature}`} className="flex items-baseline gap-3 text-sm leading-6">
                <span aria-hidden="true" className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span>{feature.replace(/\*\*/g, "")}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
