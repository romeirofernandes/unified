import { useEffect, useRef, useState } from "react";
import FileLogo from "./FileLogo";
import { patchRows } from "@/lib/patch-diff";

const KEYWORDS = new Set(["import", "from", "export", "default", "async", "function", "const", "let", "var", "await", "return", "if", "else", "for", "while", "new", "throw", "try", "catch", "null", "true", "false", "undefined"]);
const TOKEN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:import|from|export|default|async|function|const|let|var|await|return|if|else|for|while|new|throw|try|catch|null|true|false|undefined)\b|[A-Za-z_$][\w$]*(?=\s*\())/g;
function highlight(text) {
  const nodes = []; let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    nodes.push(<span key={match.index} className={/^["'`\d]/.test(token) ? "text-orange-700 dark:text-orange-300" : KEYWORDS.has(token) ? "text-[var(--fluid-accent)]" : "font-medium"}>{token}</span>);
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
// Adapted from the supplied CodeBlock, with project tokens and real replacement excerpts.
export default function CodeBlock({ filename, before, after }) {
  const [variant, setVariant] = useState("Diff");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const rows = patchRows(before, after);
  async function copy() {
    try { await navigator.clipboard.writeText(after); setCopied(true); setError(""); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1500); }
    catch { setError("Could not copy. Select the code to copy it."); }
  }
  return <div className="w-full overflow-hidden rounded-lg border border-border bg-background" aria-label={`Replacement excerpt for ${filename}`}>
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
      <FileLogo path={filename} />
      <span title={filename} className="min-w-0 flex-1 truncate font-mono">{filename}</span>
      <div className="flex gap-1" aria-label="Code view">{["Diff", "Code"].map(view => <button key={view} type="button" aria-pressed={view === variant} onClick={() => setVariant(view)} className={`rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring ${view === variant ? "bg-muted text-foreground" : "text-muted-foreground"}`}>{view}</button>)}</div>
      {variant === "Diff" ? <span className="font-mono tabular-nums"><span className="text-green-700 dark:text-green-300">+{rows.filter(row => row.type === "add").length}</span> <span className="text-destructive">−{rows.filter(row => row.type === "del").length}</span></span> : <button type="button" onClick={copy} className="rounded px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">{copied ? "Copied" : "Copy"}</button>}
    </div>
    <p className="px-3 pt-2 text-[10px] text-muted-foreground">Replacement excerpt · line numbers are relative to this edit</p>
    <div className="py-3 font-mono text-xs leading-[1.65]">
      {(variant === "Diff" ? rows : (after === "" ? [] : after.split("\n")).map((text, i) => ({cur:i+1,type:"ctx",pieces:[{text}]}))).map((row,i) => <div key={i} className={`relative grid grid-cols-[2rem_minmax(0,1fr)] ${row.type === "add" ? "bg-green-500/10" : row.type === "del" ? "bg-destructive/10" : ""}`}>
        {row.type !== "ctx" && <span aria-hidden="true" className={`absolute inset-y-0 start-0 w-[3px] ${row.type === "add" ? "bg-green-600 dark:bg-green-400" : "bg-destructive"}`} />}
        <span aria-hidden="true" className="select-none border-e border-border text-center text-[11px] tabular-nums text-muted-foreground">{row.type === "del" ? row.old : row.cur}</span>
        <code className="whitespace-pre-wrap break-words px-3 [overflow-wrap:anywhere]"><span className="sr-only">{row.type === "add" ? "Added: " : row.type === "del" ? "Removed: " : ""}</span>{row.pieces.map((piece,j) => <span key={j} className={piece.change === "add" ? "rounded-sm bg-green-500/20" : piece.change === "del" ? "rounded-sm bg-destructive/20" : ""}>{highlight(piece.text)}</span>)}</code>
      </div>)}
      {variant === "Code" && !after && <p className="px-3 text-muted-foreground">Removed</p>}
    </div>
    {error && <p role="status" className="px-3 pb-2 text-xs text-destructive">{error}</p>}
  </div>;
}
