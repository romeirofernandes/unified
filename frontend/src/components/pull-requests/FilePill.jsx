import FileLogo from "./FileLogo";

export default function FilePill({ path, className = "" }) {
  return <span title={path} className={`inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 font-mono text-xs leading-4 ${className}`}>
    <FileLogo path={path} /><span className="min-w-0 truncate">{path}</span>
  </span>;
}
