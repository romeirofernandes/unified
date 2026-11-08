import AnimatedEditorBody from "@/components/projects/AnimatedEditorBody";
import { motion as Motion, useReducedMotion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/motion/tabs";
import PackageCommands from "@/components/shared/PackageCommands";
import ProjectApi from "./ProjectApi";
import { useRef, useState } from "react";
import { usePreviewTheme } from "@/hooks/use-preview-theme";
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
import { Button } from "@/components/ui/button";
import { typeClass } from "@/lib/type-scale";

function PreviewTabPanel({ value, active, children }) {
  const reduced = useReducedMotion();
  return <TabsContent value={value} className="m-0">
    <Motion.div initial={false} animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }} transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}>{children}</Motion.div>
  </TabsContent>;
}

export function ProjectPreviewContent({ project, onEdit, isOpen = true }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("preview");
  const headerRef = useRef(null);
  const [mode, setMode] = usePreviewTheme(isOpen);
  if (!project) return null;
  return (
    <>
        <FormFont appearance={project.appearance} />
        <Tabs value={tab} onValueChange={setTab} variant="underline" className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={headerRef} className="shrink-0">
          <DialogHeader className="mb-0 px-5 pb-0 pt-5 sm:px-6">
            <div className="flex items-center justify-between gap-3 pe-8"><DialogTitle>{project.name}</DialogTitle>{onEdit && <Button variant="secondary" size="compact" autoFocus onClick={onEdit}>Back to editor</Button>}</div>
            <DialogDescription>Try your questions, then copy the integration into your React app.</DialogDescription>
          <TabsList aria-label="Project preview and setup" className="mt-4 w-full gap-0 border-b border-border [&>button]:min-h-11 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-2 [&>button]:pb-3 [&>button]:pt-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="sdk">React SDK</TabsTrigger>
            <TabsTrigger value="api">Custom form</TabsTrigger>
          </TabsList>
          </DialogHeader>
          </div>
          <AnimatedEditorBody headerRef={headerRef}>
          <PreviewTabPanel value="preview" active={tab === "preview"}>
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
          </PreviewTabPanel>
          <PreviewTabPanel value="sdk" active={tab === "sdk"}>
          <section className="min-w-0 space-y-4">
            <h3 className={typeClass("title")}>Integration</h3>
            <p className="text-sm text-muted-foreground">
              This backend requires SDK 2.2.0 or newer. Update older widget installations when deploying it.
              It installs the SDK and mounts the widget for you.
            </p>
            <PackageCommands automatic projectId={project._id} />
            <p className="text-sm text-muted-foreground">
              For manual setup, install unified-sdk and add this component once.
            </p>
            <PackageCommands />
            <CodeBlock
              code={integrationCode({
                projectId: project._id,
                theme: "auto",
              })}
              label="React component"
            />
            <InputCopy
              className="rounded-md border border-border bg-muted/40 p-3"
              label="Project ID"
              value={project._id}
            />


          </section>
          </PreviewTabPanel>
          <PreviewTabPanel value="api" active={tab === "api"}><ProjectApi project={project} uid={user?.uid} /></PreviewTabPanel>
          </AnimatedEditorBody>
        </Tabs>
    </>
  );
}

export default function ProjectPreview({ isOpen, onClose, project }) {
  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-md border border-border bg-background p-0 text-foreground sm:max-w-[1060px]" size="xl">
      <ProjectPreviewContent project={project} isOpen={isOpen} />
    </DialogContent>
  </Dialog>;
}
