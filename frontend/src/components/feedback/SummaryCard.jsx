import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { typeClass } from "@/lib/type-scale";

export default function SummaryCard({ summary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What your customers are saying</CardTitle>
        <CardDescription>
          Generated {new Date(summary.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p
          className={`${typeClass("body")} whitespace-pre-wrap text-foreground`}
        >
          {summary.tldr}
        </p>
        {summary.features.length > 0 && (
          <div className="space-y-3">
            <h3 className={typeClass("subtitle")}>
              Ideas for your next release
            </h3>
            <ul
              className={`${typeClass("body")} list-disc space-y-2 pl-5 text-muted-foreground`}
            >
              {summary.features.map((feature) => (
                <li key={feature}>{feature.replace(/\*\*/g, "")}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
