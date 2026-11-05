import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProjectModal from "@/components/dashboard/ProjectModal";
import ProjectPreview from "@/components/dashboard/ProjectPreview";
import ProjectCard from "@/components/dashboard/ProjectCard";
import PageHeader from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "@/components/shared/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useApiResource } from "@/hooks/use-api-resource";
import { apiRequest } from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload, setData } = useApiResource(
    "/projects",
    user?.uid,
  );
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const projects = data || [];

  async function createProject(body) {
    const project = await apiRequest("/projects", {
      method: "POST",
      uid: user.uid,
      body,
    });
    setData((previous) => [
      ...(previous || []),
      { ...project, feedbackCount: 0 },
    ]);
  }

  async function deleteProject() {
    setPending(true);
    setDeleteError("");
    try {
      await apiRequest(`/projects/${deleting._id}`, {
        method: "DELETE",
        uid: user.uid,
      });
      setData((previous) =>
        previous.filter((project) => project._id !== deleting._id),
      );
      setDeleting(null);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Your projects"
        description="Collect feedback, follow the conversation, and make the next release clearer."
        action={
          <Button onClick={() => setCreating(true)}>Create project</Button>
        }
      />
      <ErrorMessage>{error}</ErrorMessage>
      {error && (
        <Button variant="secondary" onClick={reload}>
          Try again
        </Button>
      )}
      {loading ? (
        <LoadingState />
      ) : (
        !error &&
        (projects.length ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onPreview={setPreview}
                onDelete={(project) => {
                  setDeleteError("");
                  setDeleting(project);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Make room for your first conversation."
            description="Create a project, choose your questions, and add the feedback widget to your app."
            action="Create your first project"
            onAction={() => setCreating(true)}
          />
        ))
      )}
      {creating && (
        <ProjectModal
          isOpen
          onClose={() => setCreating(false)}
          onSubmit={createProject}
        />
      )}
      {preview && (
        <ProjectPreview
          isOpen
          onClose={() => setPreview(null)}
          project={preview}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete project?"
        description={`“${deleting?.name || ""}” and its feedback will be permanently deleted.`}
        onConfirm={deleteProject}
        pending={pending}
        error={deleteError}
        confirmLabel="Delete project"
      />
    </DashboardLayout>
  );
}
