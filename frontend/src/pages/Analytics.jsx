import { useEffect, useId, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import ProjectPicker from "@/components/shared/ProjectPicker";
import { ErrorMessage, EmptyState, LoadingState } from "@/components/shared/PageState";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { filteredResponses, projectAnalytics, formatNumber } from "@/lib/project-analytics";
import QuestionAnalytics from "@/components/analytics/QuestionAnalytics";
import { ResponseTrend, CountsTable } from "@/components/analytics/AnalyticsCharts";

const ranges = [{ value: "all", label: "All time" }, { value: "30d", label: "Last 30 days" }, { value: "7d", label: "Last 7 days" }];
function ProjectAnalytics({ project, uid, range }) {
  const resource = useApiResource(`/feedback/project/${project._id}`, uid);
  const refresh = resource.refresh;
  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") refresh(); };
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, [refresh]);
  const responses = useMemo(() => filteredResponses(resource.data || [], range), [resource.data, range]);
  const analytics = useMemo(() => projectAnalytics(project, responses), [project, responses]);
  if (resource.loading) return <LoadingState variant="analytics" />;
  if (resource.error && !resource.data) return <div className="space-y-3"><ErrorMessage>{resource.error}</ErrorMessage><Button variant="secondary" onClick={resource.reload}>Try again</Button></div>;
  const recorded = analytics.questions.reduce((sum, question) => sum + question.provided, 0);
  return <div className="analytics-charts space-y-7">
    <ErrorMessage>{resource.error}</ErrorMessage>
    <dl className="grid divide-y divide-border rounded-md border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[["Responses", analytics.total], ["Current questions", analytics.currentQuestions], ["Recorded answers", recorded]].map(([label, value]) => <div key={label} className="px-5 py-5 sm:px-6"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 text-3xl font-medium tracking-tight tabular-nums">{formatNumber(value)}</dd></div>)}</dl>
    <section aria-labelledby="response-volume-title" className="min-w-0 rounded-md border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="space-y-2"><h2 id="response-volume-title" className="text-xl">Responses over time</h2><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{analytics.activity.data.length === 1 ? "The bar shows the number of responses received in this period." : "Each point shows the number of responses received in that period. Compare the values to see when more people sent feedback."}</p></div><span className="text-xs text-muted-foreground">By {analytics.activity.unit} · UTC</span></div>
      {analytics.activity.data.length ? <><ResponseTrend data={analytics.activity.data} /><CountsTable data={analytics.activity.data} noun="Responses" /></> : <div className="grid min-h-44 place-items-center rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{analytics.total ? "These responses do not have valid receipt dates." : "No responses were received in this period."}</div>}
      {analytics.undated > 0 && <p className="mt-3 text-xs text-muted-foreground">{analytics.undated} responses without valid receipt dates are not in this chart.</p>}
    </section>
    <div className="space-y-2"><h2 className="text-2xl">Question results</h2><p className="text-sm leading-6 text-muted-foreground">Each question uses its own answer count. Missing answers can include responses received before a question was added.{analytics.previousQuestions ? ` Saved answers from ${analytics.previousQuestions} previous questions appear below.` : ""}</p></div>
    <div className="grid items-start gap-6 xl:grid-cols-2">{analytics.questions.map((question, index) => <QuestionAnalytics key={question.field._id} question={question} index={index} />)}</div>
    {!analytics.questions.length && <EmptyState title="There are no questions to analyze" description="Add questions to the project, then collect responses." />}
  </div>;
}
export default function Analytics() {
  const { user } = useAuth();
  const projects = useApiResource("/projects", user?.uid);
  const [params, setParams] = useSearchParams();
  const rangeId = useId();
  const list = projects.data || [];
  const project = list.find((item) => item._id === params.get("project")) || list[0];
  const range = ranges.some((item) => item.value === params.get("range")) ? params.get("range") : "all";
  function updateParam(key, value) { const next = new URLSearchParams(params); next.set(key, value); setParams(next, { replace: true }); }
  return <>
    <PageHeader title="Analytics" description="See the patterns in your feedback, one question at a time." action={project && <ProjectPicker projects={list} value={project._id} onChange={(value) => updateParam("project", value)} />} />
    {projects.loading ? <LoadingState variant="analytics" /> : projects.error ? <div className="space-y-3"><ErrorMessage>{projects.error}</ErrorMessage><Button variant="secondary" onClick={projects.reload}>Try again</Button></div> : !project ? <EmptyState title="Create a project first" description="Charts will appear here when your project receives feedback." /> : <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><p className="text-sm leading-6 text-muted-foreground">The period filter uses the dates when responses arrived. All chart dates use UTC.</p><div className="flex w-full shrink-0 flex-col gap-2 sm:w-44"><p id={rangeId} className="text-xs text-muted-foreground">Response period</p><Select value={range} onValueChange={(value) => updateParam("range", value)}><SelectTrigger aria-labelledby={rangeId} className="h-10 w-full rounded-md" /><SelectContent>{ranges.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div>
      <ProjectAnalytics key={project._id} project={project} uid={user?.uid} range={range} />
    </>}
  </>;
}
