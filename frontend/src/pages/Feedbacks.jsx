import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { useFeedbackSummary } from "@/hooks/use-feedback-summary";
import PageHeader from "@/components/shared/PageHeader";
import { ErrorMessage, LoadingState } from "@/components/shared/PageState";
import FeedbackList from "@/components/feedback/FeedbackList";
import SummaryLoading from "@/components/feedback/SummaryLoading";
import SummaryCard from "@/components/feedback/SummaryCard";
import { Button } from "@/components/ui/button";

function ProjectFeedback({ projectId }) {
  const { user } = useAuth();
  const project = useApiResource(`/projects/${projectId}`, user.uid);
  const feedback = useApiResource(`/feedback/project/${projectId}`, user.uid);
  const responses = feedback.data || [];
  const analysis = useFeedbackSummary(project.data, responses, !project.loading && !feedback.loading && !project.error && !feedback.error);
  const refreshResponses = feedback.refresh;
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") refreshResponses(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refreshResponses]);
  const error = project.error || feedback.error;
  const loading = project.loading || feedback.loading;

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title={project.data?.name || "Customer feedback"}
          description={
            loading
              ? "Loading your customer conversations…"
              : `${responses.length} ${responses.length === 1 ? "response" : "responses"}. Select a response to read all answers.`
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
      {analysis.error && <div className="space-y-3"><ErrorMessage>{analysis.error}</ErrorMessage><Button variant="secondary" onClick={analysis.generate} disabled={analysis.pending}>Retry summary</Button></div>}
      {loading && <LoadingState variant="responses" />}
      {!loading && !error && (
        <>
          {analysis.summary ? <SummaryCard summary={analysis.summary} current={analysis.current} /> : responses.length > 0 && !analysis.error && <SummaryLoading />}
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
    <>
      <ProjectFeedback
        key={`${user?.uid}:${projectId}`}
        projectId={projectId}
      />
    </>
  );
}
