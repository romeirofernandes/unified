import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/motion/tabs";
import PackageCommands from "@/components/shared/PackageCommands";
import ProjectApi from "./ProjectApi";
import { useState } from "react";
import { useTheme } from "next-themes";
import PreviewModeToggle from "@/components/projects/PreviewModeToggle";
import FormFont from "../../../../shared/FormFont";
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
import { integrationCode } from "@/lib/integration-code";
import { typeClass } from "@/lib/type-scale";

export default function ProjectPreview({ isOpen, onClose, project }) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState(() =>
    resolvedTheme === "dark" ? "dark" : "light",
  );
  if (!project) return null;
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-md border border-border bg-background text-foreground sm:max-w-[1060px]"
        size="xl"
      >
        <FormFont appearance={project.appearance} />
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            Try your questions, then copy the integration into your React app.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="preview" variant="underline" className="min-w-0">
          <TabsList aria-label="Project preview and setup">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="sdk">React SDK</TabsTrigger>
            <TabsTrigger value="api">Custom form</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="pt-5">
          <section className="mx-auto w-full max-w-2xl min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={typeClass("title")}>Widget preview</h3>
              <PreviewModeToggle value={mode} onChange={setMode} />
            </div>
            <div
              style={previewThemeStyle(project.appearance, mode)}
              className="space-y-5 rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] [&_h3]:font-[inherit] p-5 text-[var(--uf-text)]"
            >
              <h3 style={{ fontFamily: "var(--uf-font)" }} className="text-xl">
                {project.name}
              </h3>
              {project.fields?.map((field) => (
                <PreviewField key={field._id} field={field} theme={mode} />
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
          </TabsContent>
          <TabsContent value="sdk" className="pt-5">
          <section className="min-w-0 space-y-4">
            <h3 className={typeClass("title")}>Integration</h3>
            <p className="text-sm text-muted-foreground">
              The published SDK 2.1.2 supports manual setup below. Automatic setup requires the upcoming 2.2.0 release.
              It installs the SDK and mounts the widget for you.
            </p>
            <PackageCommands automatic projectId={project._id} uid={user?.uid} />
            <p className="text-sm text-muted-foreground">
              For manual setup, install unified-sdk and add this component once.
            </p>
            <PackageCommands />
            <CodeBlock
              code={integrationCode({
                projectId: project._id,
                uid: user?.uid,
                theme: project.theme,
              })}
              label="React component"
            />
            <InputCopy
              className="rounded-md border border-border bg-muted/40 p-3"
              label="Project ID"
              value={project._id}
            />
            <InputCopy
              className="rounded-md border border-border bg-muted/40 p-3"
              label="Firebase UID"
              value={user?.uid || ""}
            />

          </section>
          </TabsContent>
          <TabsContent value="api" className="pt-5"><ProjectApi project={project} uid={user?.uid} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
