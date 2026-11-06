import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { previewThemeStyle } from "../../../../shared/form-theme.mjs";
import { InputCopy } from "@/components/ui/input-copy";
import { useAuth } from "@/hooks/use-auth";
import PreviewField from "@/components/projects/PreviewField";
import CodeBlock from "@/components/shared/CodeBlock";
import { integrationCode, setupCommand } from "@/lib/integration-code";
import { typeClass } from "@/lib/type-scale";

export default function ProjectPreview({ isOpen, onClose, project }) {
  const { user } = useAuth();
  if (!project) return null;
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
        size="xl"
      >
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            Try your questions, then copy the integration into your React app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <section className="min-w-0 space-y-4">
            <h3 className={typeClass("title")}>Widget preview</h3>
            <div
              style={previewThemeStyle(project.appearance, project.theme)}
              className="space-y-5 rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] p-5 text-[var(--uf-text)]"
            >
              {project.fields?.map((field) => (
                <PreviewField
                  key={field._id}
                  field={field}
                  theme={project.theme}
                />
              ))}
              <button
                type="button"
                disabled
                className="h-10 w-full rounded-md bg-[var(--uf-accent)] px-4 text-sm font-medium text-[var(--uf-accentText)]"
              >
                Submit feedback
              </button>
            </div>
            <p className={`${typeClass("caption")} text-muted-foreground`}>
              This preview doesn’t submit feedback.
            </p>
          </section>
          <section className="min-w-0 space-y-4">
            <h3 className={typeClass("title")}>Integration</h3>
            <p className="text-sm text-muted-foreground">Automatic setup is available with SDK 2.2.0 after its npm release. It installs the SDK and mounts the widget for you.</p>
            <CodeBlock code={setupCommand({ projectId: project._id, uid: user?.uid })} label="Automatic setup · SDK 2.2.0" />
            <p className="text-sm text-muted-foreground">For manual setup, install unified-sdk and add this component once.</p>
            <CodeBlock
              code={integrationCode({
                projectId: project._id,
                uid: user?.uid,
                theme: project.theme,
              })}
              label="React component"
            />
            <InputCopy label="Project ID" value={project._id} />
            <InputCopy label="Firebase UID" value={user?.uid || ""} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
