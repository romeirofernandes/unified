import { useState } from "react";
import { CountBars, CountsTable } from "./AnalyticsCharts";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/project-analytics";

const kindLabels = { numeric: "Value distribution", choice: "Answer comparison", dates: "Selected dates", email: "Email coverage", "text-categories": "Written answers", words: "Words in answers" };
function WrittenAnswers({ answers }) {
  const [limit, setLimit] = useState(5);
  const [query, setQuery] = useState("");
  const filtered = answers.filter((answer) => answer.toLowerCase().includes(query.trim().toLowerCase()));
  return <details className="mt-4 border-t border-border pt-3">
    <summary className="w-fit cursor-pointer rounded text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">Read written answers ({answers.length})</summary>
    <div className="mt-3 space-y-3"><input type="search" aria-label="Search written answers" placeholder="Search these answers…" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(5); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <ol className="divide-y divide-border">{filtered.slice(0, limit).map((answer, index) => <li key={index} className="whitespace-pre-wrap break-words py-3 text-sm leading-6">{answer}</li>)}</ol>
      {!filtered.length && <p className="text-sm text-muted-foreground">No answers match this search.</p>}
      {limit < filtered.length && <Button variant="secondary" size="compact" onClick={() => setLimit((value) => value + 10)}>Show more answers</Button>}
    </div>
  </details>;
}
export default function QuestionAnalytics({ question, index }) {
  const { field, data, kind, provided, skipped, invalid, stats, total, valid } = question;
  const horizontal = ["choice", "text-categories", "words", "email"].includes(kind);
  const wide = kind === "words" || data.length > (kind === "numeric" ? 16 : 10);
  const hasData = data.some((point) => point.count > 0);
  const denominator = kind === "email" ? total : valid;
  return <section aria-labelledby={`question-${field._id}`} className={`flex min-w-0 flex-col rounded-md border border-border bg-card ${wide ? "xl:col-span-2" : ""}`}>
    <div className="space-y-3 border-b border-border p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="font-mono">{String(index + 1).padStart(2, "0")}</span><span>{field.removed ? "Previous question · " : ""}{kindLabels[kind]}</span></div>
      <h2 id={`question-${field._id}`} className="break-words text-xl leading-7">{field.label}</h2>
      <p className="text-xs leading-5 text-muted-foreground">{formatNumber(provided)} answered · {formatNumber(skipped)} not answered{invalid ? ` · ${formatNumber(invalid)} not usable` : ""}</p>
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <p className="mb-5 max-w-prose text-sm leading-6 text-muted-foreground">{question.explanation}</p>
      {stats.length > 0 && <dl className="mb-5 flex flex-wrap gap-x-8 gap-y-4">{stats.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd></div>)}</dl>}
      {hasData ? <CountBars data={data} horizontal={horizontal} label={`${field.label}: ${kindLabels[kind].toLowerCase()}`} /> : <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-border px-5 text-center text-sm leading-6 text-muted-foreground">{provided ? "There are no usable values for this chart." : "There are no answers to this question yet."}</div>}
      {question.outsideRange && <p className="mt-3 text-xs leading-5 text-muted-foreground">Includes saved values outside the question’s current range.</p>}
      {kind === "words" && hasData && <p className="mt-3 text-xs leading-5 text-muted-foreground">The 10 most used words are shown. Basic English words are excluded.</p>}
      {field.removed && <p className="mt-3 text-xs leading-5 text-muted-foreground">The original question is no longer in the form. Its saved answers remain available.</p>}
      {hasData && <CountsTable data={data} percentTotal={kind === "words" ? undefined : denominator} />}
      {question.answers.length > 0 && <WrittenAnswers answers={question.answers} />}
    </div>
  </section>;
}
