import { projectDraftKey } from "@/lib/project-draft";
import { useTheme } from "next-themes";
import AnimatedEditorBody from "@/components/projects/AnimatedEditorBody";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";
import { lazy, Suspense, useId, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/PageState";
import FormField from "@/components/shared/FormField";
import ProjectFormPreview from "@/components/projects/ProjectFormPreview";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import FieldEditor from "@/components/projects/FieldEditor";
import {
  createField,
  validateFields,
  serializeFields,
} from "@/lib/project-fields";

const FormAppearance = lazy(
  () => import("@/components/projects/FormAppearance"),
);
const VoiceFormBuilder = lazy(
  () => import("@/components/projects/VoiceFormBuilder"),
);

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  onPreview,
}) {
  const { resolvedTheme } = useTheme();
  const formId = useId();
  const headerRef = useRef(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [theme, setTheme] = useState(() =>
    resolvedTheme === "dark" ? "dark" : "light",
  );
  const [appearance, setAppearance] = useState(
    project?.appearance || { preset: "unified", colors: {} },
  );
  const [fields, setFields] = useState(() =>
    project?.fields?.length
      ? project.fields.map((field) => ({
          ...createField(field.type),
          ...field,
          id: field._id || crypto.randomUUID(),
          config: { min: 0, max: 100, step: 1, ...field.config },
          options: (field.options || []).map((option) => ({
            ...option,
            id: option._id || crypto.randomUUID(),
          })),
        }))
      : [createField("email")],
  );
  const draftKey = projectDraftKey({
    name,
    description,
    theme,
    appearance,
    fields,
  });
  const [initialDraftKey] = useState(() => draftKey);
  const hasChanges = !project || draftKey !== initialDraftKey;
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || !hasChanges) return;
    if (!name.trim()) {
      setError("Add a project name.");
      setStep(1);
      return;
    }
    const validation = validateFields(fields);
    if (validation) {
      setStep(2);
      setExpanded(fields.find((field) => validateFields([field]))?.id || null);
      setError(validation);
      return;
    }
    setPending(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        theme,
        appearance,
        fields: serializeFields(fields),
      });
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-md border border-border bg-background p-0 text-foreground sm:max-w-[1060px]"
        size="xl"
        showCloseButton={!pending}
      >
        <Tabs
          value={String(step)}
          onValueChange={(value) => {
            if (!pending) {
              setStep(Number(value));
              setError("");
            }
          }}
          variant="underline"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div ref={headerRef} className="shrink-0">
            <DialogHeader className="mb-0 px-5 pb-0 pt-5 sm:px-6">
              <div className="flex flex-col gap-4 pe-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <DialogTitle>
                    {project ? "Edit project" : "Create a project"}
                  </DialogTitle>
                  <DialogDescription>
                    Set up your project, questions, and appearance.
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {onPreview && (
                    <Button
                      variant="secondary"
                      onClick={onPreview}
                      disabled={pending}
                    >
                      Preview
                    </Button>
                  )}
                  <Button
                    type="submit"
                    form={formId}
                    disabled={!name.trim() || pending || !hasChanges}
                    loading={pending}
                  >
                    {project ? "Save changes" : "Create project"}
                  </Button>
                </div>
              </div>
              <TabsList
                className="mt-4 w-full gap-0 border-b border-border"
                aria-label="Project editor"
              >
                {["Project details", "Questions", "Appearance"].map(
                  (label, index) => (
                    <TabsTrigger
                      key={label}
                      value={String(index + 1)}
                      disabled={pending}
                      indicatorClassName="h-0.5 bg-fluid-accent"
                      className="min-h-11 min-w-0 flex-1 justify-center px-2 pb-3 pt-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:text-sm"
                    >
                      {label}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </DialogHeader>
          </div>
          <form
            id={formId}
            noValidate
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <AnimatedEditorBody headerRef={headerRef}>
              <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <fieldset disabled={pending} className="min-w-0 space-y-5">
                  <TabsContent value="1" className="mt-0 space-y-5">
                    <FormField
                      label="Project name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      maxLength={120}
                      autoFocus
                      placeholder="My product"
                    />
                    <FormField
                      as="textarea"
                      label="Description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="What are you collecting feedback on?"
                    />
                  </TabsContent>
                  <TabsContent value="2" className="mt-0 space-y-4">
                    <div className="mb-4">
                      {
                        <Suspense
                          fallback={
                            <p className="text-sm text-muted-foreground">
                              Opening voice input…
                            </p>
                          }
                        >
                          <VoiceFormBuilder
                            active={isOpen && !pending && step === 2}
                            onApply={(draft) => {
                              if (fields.length + draft.fields.length > 50) {
                                setError(
                                  "A form can contain up to 50 questions.",
                                );
                                return;
                              }
                              const added = draft.fields.map((field) => ({
                                ...createField(field.type),
                                ...field,
                                options: (field.options || []).map(
                                  (option) => ({
                                    ...option,
                                    id: crypto.randomUUID(),
                                  }),
                                ),
                              }));
                              setFields((previous) => [...previous, ...added]);
                              if (!name.trim()) setName(draft.name);
                              if (!description.trim())
                                setDescription(draft.description);
                              setExpanded(added[0]?.id || null);
                              setStep(2);
                            }}
                          />
                        </Suspense>
                      }
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <FieldEditor
                          key={field.id}
                          field={field}
                          index={index}
                          open={expanded === field.id}
                          onOpenChange={(open) =>
                            setExpanded(open ? field.id : null)
                          }
                          onChange={(patch) =>
                            setFields((previous) =>
                              previous.map((item) =>
                                item.id === field.id
                                  ? { ...item, ...patch }
                                  : item,
                              ),
                            )
                          }
                          onRemove={() =>
                            setFields((previous) =>
                              previous.filter((item) => item.id !== field.id),
                            )
                          }
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        disabled={fields.length >= 50}
                        onClick={() => {
                          const field = createField();
                          setFields((previous) => [...previous, field]);
                          setExpanded(field.id);
                        }}
                      >
                        <HugeiconsIcon
                          icon={Add01Icon}
                          size={16}
                          aria-hidden="true"
                        />{" "}
                        Add question
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="3" className="mt-0">
                    {step === 3 && (
                      <Suspense
                        fallback={
                          <p className="text-sm text-muted-foreground">
                            Opening theme controls…
                          </p>
                        }
                      >
                        <FormAppearance
                          appearance={appearance}
                          onChange={setAppearance}
                          mode={theme}
                        />
                      </Suspense>
                    )}
                  </TabsContent>
                  <ErrorMessage>{error}</ErrorMessage>
                </fieldset>
                <div className="min-w-0 lg:sticky lg:top-0 lg:max-h-[var(--editor-height)] lg:overflow-y-auto lg:overscroll-contain">
                  <ProjectFormPreview
                    name={name}
                    fields={fields}
                    theme={theme}
                    appearance={appearance}
                    onThemeChange={setTheme}
                    disabled={pending}
                  />
                </div>
              </div>
            </AnimatedEditorBody>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
