import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleIndicator } from "@/components/motion/collapsible";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function FeedbackCard({ response }) {
  const { feedback, sender, preview, answers, timestamp } = response;
  const date = timestamp ? new Date(timestamp) : null;
  return (
    <Collapsible className="group min-w-0 ">
      <CollapsibleTrigger className="rounded-none hover:bg-transparent focus-visible:bg-transparent w-full text-left grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_16px] items-center gap-3 px-4 py-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 lg:grid-cols-[minmax(160px,0.9fr)_minmax(0,1.5fr)_120px_16px] lg:gap-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 space-y-1">
          <span className="block truncate text-sm font-medium" title={sender}>
            {sender}
          </span>
          <span className="block text-xs text-muted-foreground lg:hidden">
            {date ? dateFormat.format(date) : "Date unavailable"}
          </span>
          <span className="block truncate text-sm text-muted-foreground lg:hidden">
            {preview}
          </span>
        </span>
        <span className="hidden truncate text-sm text-muted-foreground lg:block">
          {preview}
        </span>
        <time
          className="hidden text-xs tabular-nums text-muted-foreground lg:block"
          dateTime={date?.toISOString()}
          title={date?.toLocaleString()}
        >
          {date ? dateFormat.format(date) : "Date unavailable"}
        </time>
        <CollapsibleIndicator className="text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent contentClassName="px-4 pb-5 pt-1 sm:px-5">
        <div className="rounded-md border border-border bg-background p-4 sm:p-5">
          <p className="mb-5 text-xs text-muted-foreground">
            {date ? `Received ${date.toLocaleString()}` : "Response details"}
          </p>
          {answers.length ? (
            <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`min-w-0 space-y-1.5 ${answer.type === "textarea" ? "sm:col-span-2" : ""}`}
                >
                  <dt className="text-xs leading-5 text-muted-foreground">
                    {answer.label}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words text-sm leading-6">
                    {answer.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              This response has no answers.
            </p>
          )}
          <span className="sr-only">Response {feedback._id}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
