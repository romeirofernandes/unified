import { Button } from "@/components/ui/button";
import { typeClass } from "@/lib/type-scale";
import { Skeleton as Skullet } from "skullet/react";
import "skullet/styles.css";

export function ErrorMessage({ children }) {
  return children ? (
    <p
      role="alert"
      className={`${typeClass("body")} rounded-lg border border-destructive/30 bg-destructive-light p-3 text-destructive`}
    >
      {children}
    </p>
  ) : null;
}

export function LoadingState() {
  return (
    <Skullet loading label="Loading content">
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((id) => (
          <article
            key={id}
            className="flex min-h-36 flex-col gap-2 rounded-md border border-border bg-card p-4"
          >
            <p className="text-sm font-medium">Project name</p>
            <p className="text-sm text-muted-foreground">
              Collect feedback and follow your customers’ conversations.
            </p>
            <p className="mt-auto self-end rounded-full bg-fluid-accent px-3 py-1 text-xs">
              24 responses
            </p>
          </article>
        ))}
      </div>
    </Skullet>
  );
}

export function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-5 py-14 text-center">
      <h2 className={typeClass("title")}>{title}</h2>
      <p
        className={`${typeClass("body")} mx-auto mt-2 max-w-md text-muted-foreground`}
      >
        {description}
      </p>
      {action && (
        <Button className="mt-5" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}
