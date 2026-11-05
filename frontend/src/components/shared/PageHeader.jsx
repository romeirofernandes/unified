import { typeClass } from "@/lib/type-scale";

export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className={`${typeClass("display")} break-words text-foreground`}>{title}</h1>
        {description && <p className={`${typeClass("body")} max-w-2xl text-muted-foreground`}>{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
