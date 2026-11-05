import { Card } from "@/components/ui/card";
import { raisedCardSurface } from "@/components/ui/cardStyles";

export default function SettingsSection({
  id,
  title,
  description,
  children,
  destructive = false,
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="grid items-start gap-3 lg:grid-cols-[minmax(180px,0.6fr)_minmax(0,1.4fr)] lg:gap-8"
    >
      <div className="space-y-2">
        <h2 id={`${id}-title`} className="text-xl tracking-tight">
          {title}
        </h2>
        <p className="max-w-sm text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Card
        className={`${raisedCardSurface} min-w-0 p-4 ${destructive ? "border-destructive/25" : ""}`}
      >
        {children}
      </Card>
    </section>
  );
}
