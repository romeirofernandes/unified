import WorkbenchLayout from "./loading/WorkbenchLoading";
import IntegrationLayout from "./loading/IntegrationsLoading";
import ResponseLayout from "./loading/ResponsesLoading";
import ProjectLayout from "./loading/ProjectsLoading";
import { Skeleton } from "skullet/react";
import { useLocation } from "react-router-dom";
import PageHeader from "./PageHeader";
import "skullet/styles.css";

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
  if (variant === "workbench") return <WorkbenchLayout />;
  return <ProjectLayout />;
}
export function LoadingState({ variant = "projects" }) {
  const { pathname } = useLocation();
  const fullPage = variant === "route" || variant === "auth";
  const page = fullPage ? (pathname.startsWith("/project/") ? "responses" : pathname === "/dashboard" ? "projects" : pathname.split("/")[2]) : variant;
  const metadata = routePages[page];
  if (!metadata || !["projects", "responses", "integrations", "workbench"].includes(page)) return <p role="status" className="text-sm text-muted-foreground">Loading page…</p>;
  const [title, description] = metadata;
  return <Skeleton loading id={`workspace-${page}`} label={`Loading ${title}`}><div className={`min-w-0 ${fullPage ? "space-y-7" : ""}`}>
    {fullPage && <PageHeader title={title} description={description} action={page === "projects" ? <button className="h-10 rounded-md px-4">Create project</button> : undefined} />}
    <ContentLayout variant={page} />
  </div></Skeleton>;
}
