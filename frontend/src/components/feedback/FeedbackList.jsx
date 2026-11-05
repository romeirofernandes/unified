import { EmptyState } from "@/components/shared/PageState";
import FeedbackCard from "./FeedbackCard";

export default function FeedbackList({ responses, fields }) {
  if (!responses.length)
    return (
      <EmptyState
        title="The conversation starts here."
        description="Add the widget to your app to collect your first response. Your customers’ answers will appear here."
      />
    );
  const labels = new Map(fields.map((field) => [field._id, field.label]));
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {responses.map((response) => (
        <FeedbackCard key={response._id} feedback={response} labels={labels} />
      ))}
    </div>
  );
}
