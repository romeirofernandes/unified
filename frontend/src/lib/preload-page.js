const loaders = {
  "/dashboard/workbench": () => import("@/pages/Workbench"),
  "/dashboard/pull-requests": () => import("@/pages/PullRequests"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/docs": () => import("@/pages/Docs"),
  "/dashboard/settings": () => import("@/pages/Settings"),
  "/dashboard/integrations": () => import("@/pages/Integrations"),
};
export function preloadPage(path) {
  const load = path.startsWith("/project/") ? () => import("@/pages/Feedbacks") : loaders[path];
  if (load) void load().catch(() => {});
}
