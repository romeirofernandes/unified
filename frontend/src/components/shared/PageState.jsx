import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { typeClass } from "@/lib/type-scale";

export function ErrorMessage({ children }) {
  return children ? <p role="alert" className={`${typeClass("body")} rounded-lg border border-destructive/30 bg-destructive-light p-3 text-destructive`}>{children}</p> : null;
}

export function LoadingState() {
  return <div role="status" className="space-y-4 py-2"><span className="sr-only">Loading content</span><Skeleton className="h-8 w-48" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((id) => <Skeleton key={id} className="h-48 rounded-xl" />)}</div></div>;
}

export function EmptyState({ title, description, action, onAction }) {
  return <div className="rounded-xl border border-dashed border-border px-5 py-14 text-center"><h2 className={typeClass("title")}>{title}</h2><p className={`${typeClass("body")} mx-auto mt-2 max-w-md text-muted-foreground`}>{description}</p>{action && <Button className="mt-5" onClick={onAction}>{action}</Button>}</div>;
}
