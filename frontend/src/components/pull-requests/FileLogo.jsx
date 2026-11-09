import { HugeiconsIcon } from "@hugeicons/react";
import { CodeIcon } from "@hugeicons/core-free-icons";

const logos = {
  jsx: ["react_light.svg", "react_dark.svg"],
  tsx: ["react_light.svg", "react_dark.svg"],
  js: ["javascript.svg"],
  ts: ["typescript.svg"],
  css: ["css_old.svg"],
  md: ["markdown-light.svg", "markdown-dark.svg"],
  mdx: ["markdown-light.svg", "markdown-dark.svg"],
};
export default function FileLogo({ path }) {
  const files = logos[path.split(".").pop()?.toLowerCase()];
  if (!files) return <HugeiconsIcon icon={CodeIcon} size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />;
  return <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
    <img src={`/logos/svgl/${files[0]}`} alt="" width="16" height="16" className={`h-4 w-4 object-contain ${files[1] ? "dark:hidden" : ""}`} />
    {files[1] && <img src={`/logos/svgl/${files[1]}`} alt="" width="16" height="16" className="hidden h-4 w-4 object-contain dark:block" />}
  </span>;
}
