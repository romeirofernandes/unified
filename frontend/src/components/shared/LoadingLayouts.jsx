import ResponseLayout from "./loading/ResponsesLoading";
import ProjectLayout from "./loading/ProjectsLoading";
import { Skeleton } from "skullet/react";
import { useLocation } from "react-router-dom";
import PageHeader from "./PageHeader";
import "skullet/styles.css";

function IntegrationLayout() {
  return <div className="space-y-10">{["Slack", "Email"].map((name) => <section key={name} className="grid items-start gap-3 lg:grid-cols-[minmax(180px,0.6fr)_minmax(0,1.4fr)] lg:gap-8"><div className="space-y-2"><h2 className="text-xl">{name}</h2><p className="max-w-sm text-sm leading-5">Get feedback summaries where your team works.</p></div><div className="space-y-5 rounded-md border border-border bg-card p-4"><p className="text-sm">Your connected destination</p>{name === "Slack" && <button className="h-10 rounded-md border border-border px-4">Change workspace</button>}<div className="grid items-end gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm">Digest frequency</p><button className="h-10 w-full rounded-md border border-border">Every 24 hours</button></div><p className="flex h-10 items-center text-sm">Send feedback digests</p></div><div className="grid grid-cols-2 gap-3 border-y border-border py-4 text-xs"><div><p>Next check</p><p className="mt-2">Tomorrow, 9:00 am</p></div><div><p>Last delivered</p><p className="mt-2">Yesterday, 9:00 am</p></div></div><div className="flex gap-2"><button className="h-10 rounded-md border border-border px-4">Save {name}</button><button className="h-10 rounded-md border border-border px-4">Send test digest</button></div></div></section>)}</div>;
}
const routePages = {
  projects: ["Your projects", "Collect feedback, follow the conversation, and make the next release clearer."],
  responses: ["Responses", "Read customer feedback and follow the conversation."],
  integrations: ["Integrations", "Send feedback summaries to the places your team already works."],
  workbench: ["Workbench", "Turn feedback into action. Track your project’s issues through to completion."],
  "pull-requests": ["Pull requests", "Turn a small feedback issue into a draft you can review."],
  settings: ["Settings", "Manage your account and workspace preferences."],
  docs: ["Documentation", "Set up the SDK"],
};
function ContentLayout({ variant }) {
  if (variant === "responses") return <ResponseLayout />;
  if (variant === "integrations") return <IntegrationLayout />;
  return <ProjectLayout />;
}
export function LoadingState({ variant = "projects" }) {
  const { pathname } = useLocation();
  const fullPage = variant === "route" || variant === "auth";
  const page = fullPage ? (pathname.startsWith("/project/") ? "responses" : pathname === "/dashboard" ? "projects" : pathname.split("/")[2]) : variant;
  const metadata = routePages[page];
  if (!metadata || !["projects", "responses", "integrations"].includes(page)) return <p role="status" className="text-sm text-muted-foreground">Loading page…</p>;
  const [title, description] = metadata;
  return <Skeleton loading id={`workspace-${page}`} label={`Loading ${title}`}><div className={`min-w-0 ${fullPage ? "space-y-7" : ""}`}>
    {fullPage && <PageHeader title={title} description={description} action={page === "projects" ? <button className="h-10 rounded-md px-4">Create project</button> : undefined} />}
    <ContentLayout variant={page} />
  </div></Skeleton>;
}
