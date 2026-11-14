export const siteUrl = "https://unified-chi.vercel.app";
export function pageMetadata(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const docs = path === "/docs";
  const publicPage = path === "/" || docs;
  return {
    title: "unified",
    description: docs ? "Set up the Unified React feedback SDK, configure your widget, connect custom forms, and send feedback digests to Slack or email." : "Collect customer feedback inside your React app, find common requests with AI summaries, and turn feedback into work with Unified.",
    url: siteUrl + (publicPage ? path === "/" ? "/" : path : "/"),
    robots: publicPage ? "index, follow, max-image-preview:large" : "noindex, follow",
  };
}
