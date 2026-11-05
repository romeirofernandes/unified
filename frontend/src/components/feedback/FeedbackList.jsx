import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/PageState";
import { responseDetails } from "@/lib/feedback-presentation";
import FeedbackCard from "./FeedbackCard";

export default function FeedbackList({ responses, fields }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("newest");
  const items = useMemo(
    () => responses.map((response) => responseDetails(response, fields)),
    [responses, fields],
  );
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items
      .filter(
        (item) =>
          !term ||
          [
            item.sender,
            ...item.answers.map((answer) => `${answer.label} ${answer.value}`),
          ]
            .join(" ")
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) =>
        order === "oldest"
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp,
      );
  }, [items, query, order]);
  if (!responses.length)
    return (
      <EmptyState
        title="No responses yet"
        description="Add the widget to your app to collect your first response. Answers will appear here."
      />
    );
  return (
    <section aria-label="Customer responses" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label htmlFor="response-search" className="sr-only">
            Search responses
          </label>
          <input
            id="response-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or answers…"
            className="h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p
            role="status"
            className="text-xs tabular-nums text-muted-foreground"
          >
            {visible.length} of {responses.length}
          </p>
          <label htmlFor="response-order" className="sr-only">
            Response order
          </label>
          <select
            id="response-order"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(160px,0.9fr)_minmax(0,1.5fr)_120px_16px] gap-5 border-b border-border px-5 py-3 text-xs text-muted-foreground lg:grid"
        >
          <span>From</span>
          <span>Response preview</span>
          <span>Received</span>
          <span />
        </div>
        {visible.map((response) => (
          <FeedbackCard key={response.feedback._id} response={response} />
        ))}
        {!visible.length && (
          <div className="space-y-2 px-5 py-10 text-center">
            <p className="text-sm font-medium">No matching responses</p>
            <p className="text-sm text-muted-foreground">
              Try another email address or a word from an answer.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
