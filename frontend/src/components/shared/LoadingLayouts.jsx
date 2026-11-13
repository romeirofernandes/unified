import { Skeleton } from "skullet/react";
import { useLocation } from "react-router-dom";
import PageHeader from "./PageHeader";
import "skullet/styles.css";

function ProjectLayout() {
  return <div className="grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((id) => <article key={id} className="relative flex min-h-36 flex-col rounded-md border border-border bg-card p-4">
    <div className="absolute end-3 top-3 flex gap-2"><button className="size-7 rounded-md">Edit</button><button className="size-7 rounded-md">Delete</button></div>
    <h2 className="pe-20 text-lg leading-7">Customer feedback</h2><p className="mt-2 max-w-xs text-sm leading-6">Feedback from the people using your product.</p><div className="mt-auto flex justify-end pt-3"><span className="rounded-full px-2.5 py-1 text-xs">12 responses</span></div>
  </article>)}</div>;
}
function ResponseLayout() {
  return <div className="space-y-7">
    <section className="rounded-md border border-border bg-card"><div className="border-b border-border px-6 py-4"><h2 className="text-base">Feedback summary</h2><p className="mt-2 text-xs">This summary updates when new responses arrive.</p></div><div className="grid gap-10 p-6 xl:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs">Overview</p><p className="mt-4 text-sm leading-7">An overview of your customer conversations, their experiences and the patterns across their feedback.</p></div><div><p className="text-xs">What to address</p>{[1, 2, 3].map((id) => <p key={id} className="mt-3 text-sm leading-6">A recurring request from your customers.</p>)}</div></div></section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row"><input className="h-10 w-full max-w-md rounded-md border border-border" placeholder="Search people or answers…" /><button className="h-10 w-36 rounded-md border border-border">Newest first</button></div>
    <div className="rounded-md border border-border bg-card"><div className="hidden grid-cols-[minmax(160px,0.9fr)_minmax(0,1.5fr)_120px] gap-5 border-b border-border px-5 py-3 text-xs lg:grid"><span>From</span><span>Response preview</span><span>Received</span></div>{[1, 2, 3, 4].map((id) => <div key={id} className="grid gap-2 border-b border-border px-5 py-5 text-sm last:border-0 lg:grid-cols-[minmax(160px,0.9fr)_minmax(0,1.5fr)_120px] lg:gap-5"><span>person@example.com</span><span>A customer’s feedback on the product.</span><span>12 Nov</span></div>)}</div>
  </div>;
}
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
