import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { typeClass } from "@/lib/type-scale";

export default function FeedbackCard({ feedback, labels }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <time
          className={`${typeClass("caption")} text-muted-foreground`}
          dateTime={feedback.timestamp}
        >
          {new Date(feedback.timestamp).toLocaleString()}
        </time>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {Object.entries(feedback.formAnswers || {}).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <dt className={`${typeClass("caption")} text-muted-foreground`}>
                {labels.get(key) || "Removed question"}
              </dt>
              <dd
                className={`${typeClass("body")} whitespace-pre-wrap break-words text-foreground`}
              >
                {Array.isArray(value)
                  ? value.join(", ")
                  : String(value ?? "No answer")}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
