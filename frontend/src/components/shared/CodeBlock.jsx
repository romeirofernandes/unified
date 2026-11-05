import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "./PageState";
import { typeClass } from "@/lib/type-scale";

export default function CodeBlock({ code, label = "Code" }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Couldn’t copy. Select the code and copy it manually.");
    }
  }
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className={`${typeClass("caption")} text-muted-foreground`}>
          {label}
        </span>
        <Button
          variant="ghost"
          size="compact"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          Copy
        </Button>
      </div>
      <pre
        className="max-w-full overflow-x-auto p-4 text-xs leading-6 sm:text-sm"
        tabIndex={0}
      >
        <code>{code}</code>
      </pre>
      <div role="status" className="px-4">
        {status === "Copied" ? (
          <p className={`${typeClass("caption")} pb-3 text-muted-foreground`}>
            Copied to clipboard
          </p>
        ) : (
          <ErrorMessage>{status}</ErrorMessage>
        )}
      </div>
    </div>
  );
}
