import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { useFeedbackSummary } from "@/hooks/use-feedback-summary";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { ErrorMessage, LoadingState } from "@/components/shared/PageState";
import FeedbackList from "@/components/feedback/FeedbackList";
import SummaryCard from "@/components/feedback/SummaryCard";
import { Button } from "@/components/ui/button";

function ProjectFeedback({ projectId }) {
  const { user } = useAuth();
  const project = useApiResource(`/projects/${projectId}`, user.uid);
  const feedback = useApiResource(`/feedback/project/${projectId}`, user.uid);
  const analysis = useFeedbackSummary(
    `feedback-summary-${user.uid}-${projectId}`,
  );
  const responses = feedback.data || [];
  const error = project.error || feedback.error;
  const loading = project.loading || feedback.loading;

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">← All projects</Link>
        </Button>
        <PageHeader
          title={project.data?.name || "Customer feedback"}
          description={
            loading
              ? "Loading your customer conversations…"
              : `${responses.length} responses. Find the thread and decide what comes next.`
          }
          action={
            <Button
              onClick={() => analysis.generate(project.data, responses)}
              loading={analysis.pending}
              disabled={loading || !!error || !responses.length}
            >
              Generate summary
            </Button>
          }
        />
      </div>
      {error && (
        <div className="space-y-3">
          <ErrorMessage>{error}</ErrorMessage>
          <Button
            variant="secondary"
            onClick={() => {
              project.reload();
              feedback.reload();
            }}
          >
            Try again
          </Button>
        </div>
      )}
      <ErrorMessage>{analysis.error}</ErrorMessage>
      {loading && <LoadingState />}
      {!loading && !error && (
        <>
          {analysis.summary && <SummaryCard summary={analysis.summary} />}
          <FeedbackList
            responses={responses}
            fields={project.data?.fields || []}
          />
        </>
      )}
    </>
  );
}

export default function Feedbacks() {
  const { projectId } = useParams();
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <ProjectFeedback
        key={`${user?.uid}:${projectId}`}
        projectId={projectId}
      />
    </DashboardLayout>
  );
}
