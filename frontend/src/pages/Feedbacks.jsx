import { useEffect, useRef, useState } from "react";
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
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { apiRequest } from "@/lib/api";
import { forgetResource, forgetResourcePrefix } from "@/lib/resource-cache";

function ProjectFeedback({ projectId }) {
  const { user } = useAuth();
  const project = useApiResource(`/projects/${projectId}`, user.uid);
  const feedback = useApiResource(`/feedback/project/${projectId}`, user.uid);
  const board = useApiResource(`/workbench/${projectId}`, user.uid);
  const refreshBoard = board.refresh;
  const responses = feedback.data || [];
  const [resetting, setResetting] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState("");
  const [notice, setNotice] = useState("");
  const resetGuard = useRef(false);
  const analysis = useFeedbackSummary(project.data, responses, !project.loading && !feedback.loading && !project.error && !feedback.error);
  const refreshResponses = feedback.refresh;
  const refreshProject = project.refresh;
  useEffect(() => {
    if (analysis.summary?.schemaVersion === 2) { refreshResponses(); refreshBoard(); forgetResourcePrefix(`/workbench/${projectId}`, user.uid); }
  }, [analysis.summary?.timestamp, analysis.summary?.schemaVersion, refreshResponses, refreshBoard, projectId, user.uid]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") { refreshProject(); refreshResponses(); refreshBoard(); } };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refreshResponses, refreshProject, refreshBoard]);
  const error = project.error || feedback.error;
  const loading = project.loading || feedback.loading;
  async function reset() {
    if (resetGuard.current) return;
    resetGuard.current = true; setResetPending(true); setResetError("");
    try {
      const result = await apiRequest(`/feedback/project/${projectId}/reset`, { uid: user.uid, method: "POST", body: { confirm: true } });
      feedback.setData([]);
      project.setData({ ...project.data, feedbackSummary: null, feedbackGeneration: result.feedbackGeneration });
      forgetResource("/projects", user.uid);
      forgetResourcePrefix(`/workbench/${projectId}`, user.uid);
      setResetting(false); setNotice("Responses and summary reset. Your form is ready for new feedback.");
      project.reload(); feedback.reload();
    } catch (error) { setResetError(error.message); }
    finally { resetGuard.current = false; setResetPending(false); }
  }

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
          action={<Button variant="destructive" disabled={loading || !!error || resetPending || (!responses.length && !analysis.summary)} onClick={() => { setResetError(""); setResetting(true); }}>Reset responses</Button>}
        />
      </div>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      <ConfirmDialog open={resetting} onClose={() => setResetting(false)} title="Reset all responses?" description={`Permanently delete all responses, email update opt-ins, and the AI summary for ${project.data?.name || "this project"}. Your form, workbench issues, and PR runs stay. This cannot be undone.`} confirmLabel="Reset responses" onConfirm={reset} pending={resetPending} error={resetError} />
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
          {analysis.summary ? <SummaryCard summary={analysis.summary} current={analysis.current} issues={board.data || []} projectId={projectId} /> : responses.length > 0 && !analysis.error && <SummaryLoading />}
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
