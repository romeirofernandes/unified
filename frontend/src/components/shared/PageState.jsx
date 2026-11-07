import { Button } from "@/components/ui/button";
import { typeClass } from "@/lib/type-scale";
export { LoadingState } from "./LoadingLayouts";

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
