import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InputCopy } from "@/components/ui/input-copy";
import { useAuth } from "@/hooks/use-auth";
import PreviewField from "@/components/projects/PreviewField";
import CodeBlock from "@/components/shared/CodeBlock";
import { integrationCode } from "@/lib/integration-code";
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
              className={`space-y-5 rounded-xl border p-5 ${project.theme === "dark" ? "border-[#45433e] bg-[#1d1c1a] text-[#f4f1e9]" : "border-[#d6d3ca] bg-[#f4f3ee] text-[#24231f]"}`}
            >
              {project.fields?.map((field) => (
                <PreviewField
                  key={field._id}
                  field={field}
                  theme={project.theme}
                />
              ))}
            </div>
            <p className={`${typeClass("caption")} text-muted-foreground`}>
              This preview doesn’t submit feedback.
            </p>
          </section>
          <section className="min-w-0 space-y-4">
            <h3 className={typeClass("title")}>Integration</h3>
            <CodeBlock code="npm install unified-sdk" label="Install SDK" />
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
