import { useReducedMotion } from "motion/react";
import { curveLinear } from "d3-shape";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { LineChart, Line } from "@/components/charts/line-chart";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { formatNumber } from "@/lib/project-analytics";

const integerTick = (value) => Number.isInteger(value) ? formatNumber(value) : "";
function CountTooltip({ point, noun }) {
  return <div className="max-w-64 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"><p className="mb-1 break-words font-medium">{point.label}</p><p className="text-xs text-muted-foreground">{formatNumber(point.count)} {noun}</p></div>;
}
export function CountsTable({ data, noun = "Answers", percentTotal }) {
  return <details className="mt-4 border-t border-border pt-3">
    <summary className="w-fit cursor-pointer rounded text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">View chart data</summary>
    <div className="mt-3 max-h-72 overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Chart values</caption><thead><tr className="border-b border-border"><th scope="col" className="pb-2 font-medium">Answer / period</th><th scope="col" className="pb-2 text-right font-medium">{noun}</th>{percentTotal !== undefined && <th scope="col" className="pb-2 ps-3 text-right font-medium">Share</th>}</tr></thead><tbody>{data.map((row, index) => <tr key={`${index}-${row.label}`} className="border-b border-border last:border-0"><th scope="row" className="max-w-xs break-words py-2 pe-3 font-normal">{row.label}</th><td className="py-2 text-right tabular-nums">{formatNumber(row.count)}</td>{percentTotal !== undefined && <td className="py-2 ps-3 text-right tabular-nums">{percentTotal ? formatNumber(row.count / percentTotal * 100) : 0}%</td>}</tr>)}</tbody></table></div>
  </details>;
}
export function CountBars({ data, horizontal = false, label, noun = "answers" }) {
  const reduced = useReducedMotion();
  const height = horizontal ? Math.max(190, data.length * 32 + 32) : 250;
  return <div role="img" aria-label={label} className="min-w-0" style={{ height }}>
    <BarChart data={data} xDataKey="label" orientation={horizontal ? "horizontal" : "vertical"} aspectRatio="auto" className="h-full w-full" margin={{ top: 14, right: 20, bottom: horizontal ? 16 : 46, left: horizontal ? 132 : 36 }} animationDuration={reduced ? 0 : undefined}>
      <Grid horizontal={!horizontal} vertical={horizontal} numTicksRows={4} numTicksColumns={4} />
      <Bar dataKey="count" fill="var(--chart-1)" lineCap={3} showValue valueLabelOrientation="horizontal" animate={!reduced} />
      {horizontal ? <BarYAxis /> : <><BarXAxis maxLabels={{ base: 4, sm: 8, lg: 12 }} /><YAxis numTicks={4} formatValue={integerTick} /></>}
      <ChartTooltip showDatePill={false} content={({ point }) => <CountTooltip point={point} noun={noun} />} />
    </BarChart>
  </div>;
}
export function ResponseTrend({ data }) {
  const reduced = useReducedMotion();
  if (data.length === 1) return <CountBars data={data} label="Responses received in the period" noun="responses" />;
  return <div role="img" aria-label="Number of responses received over time" className="h-64 min-w-0">
    <LineChart data={data} className="h-full w-full" aspectRatio="auto" margin={{ top: 16, right: 20, bottom: 40, left: 36 }} animationDuration={reduced ? 0 : undefined}>
      <Grid horizontal numTicksRows={4} />
      <Line dataKey="count" curve={curveLinear} stroke="var(--chart-1)" fadeEdges={false} showMarkers={data.length <= 45} animate={!reduced} />
      <XAxis labels={data.map((point) => point.label)} numTicks={{ base: 3, sm: 5, lg: 7 }} /><YAxis numTicks={4} formatValue={integerTick} />
      <ChartTooltip showDatePill={false} content={({ point }) => <CountTooltip point={point} noun="responses" />} />
    </LineChart>
  </div>;
}
