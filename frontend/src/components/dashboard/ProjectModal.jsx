import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";
import { lazy, Suspense, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [theme, setTheme] = useState(project?.theme || "light");
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
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a project name.");
      setStep(1);
      return;
    }
    if (step === 1) {
      setError("");
      setStep(2);
      return;
    }
    const validation = validateFields(fields);
    if (validation) {
      setStep(2);
      setExpanded(fields.find((field) => validateFields([field]))?.id || null);
      setError(validation);
      return;
    }
    if (step === 2) {
      setError("");
      setStep(3);
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
          variant="segment"
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="shrink-0 border-b border-border px-5 py-5 sm:px-6">
            <DialogTitle className="pe-10">
              {project ? "Edit project" : "Create a project"}
            </DialogTitle>
            <DialogDescription className="pe-10">
              {step === 1
                ? "Set up your project, then choose what to ask."
                : step === 2
                  ? "Keep the form focused. Email is included by default."
                  : "Choose a preset or make the form your own."}
            </DialogDescription>
            <TabsList
              className="mt-3 w-full rounded-md"
              aria-label="Project editor"
            >
              {["Project details", "Questions", "Appearance"].map(
                (label, index) => (
                  <TabsTrigger
                    key={label}
                    value={String(index + 1)}
                    disabled={pending}
                    indicatorClassName="bg-fluid-accent/15"
                    className="min-h-10 flex-1 rounded-md px-3 text-xs sm:text-sm [&_[data-tabs-label]]:text-foreground"
                  >
                    {label}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </DialogHeader>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <fieldset disabled={pending} className="min-w-0 space-y-5">
                  <div hidden={step === 3}>
                    {voiceOpen ? (
                      <Suspense
                        fallback={
                          <p className="text-sm text-muted-foreground">
                            Opening voice input…
                          </p>
                        }
                      >
                        <VoiceFormBuilder
                          active={isOpen && !pending && step !== 3}
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
                              options: (field.options || []).map((option) => ({
                                ...option,
                                id: crypto.randomUUID(),
                              })),
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
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setVoiceOpen(true)}
                      >
                        Create questions with voice or text
                      </Button>
                    )}
                  </div>
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
                    <fieldset className="space-y-3">
                      <legend className="text-sm text-muted-foreground">
                        Widget mode
                      </legend>
                      <div className="grid grid-cols-2 gap-3">
                        {["light", "dark"].map((mode) => (
                          <label key={mode} className="cursor-pointer">
                            <input
                              type="radio"
                              name="widget-mode"
                              className="peer sr-only"
                              checked={theme === mode}
                              onChange={() => setTheme(mode)}
                            />
                            <span className="flex h-10 items-center justify-center rounded-md border border-border text-sm capitalize peer-checked:border-fluid-accent peer-checked:bg-fluid-accent/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                              {mode}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </TabsContent>
                  <TabsContent value="2" className="mt-0 space-y-4">
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
                    <Button
                      variant="secondary"
                      className="w-full"
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
                          onModeChange={setTheme}
                        />
                      </Suspense>
                    )}
                  </TabsContent>
                  <ErrorMessage>{error}</ErrorMessage>
                </fieldset>
                <div className="min-w-0 lg:sticky lg:top-0">
                  <ProjectFormPreview
                    name={name}
                    fields={fields}
                    theme={theme}
                    appearance={appearance}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-0 flex-wrap shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6">
              {onPreview && (
                <Button
                  variant="secondary"
                  onClick={onPreview}
                  disabled={pending}
                >
                  Preview & code
                </Button>
              )}
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep((value) => value - 1);
                    setError("");
                  }}
                  disabled={pending}
                >
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || pending}
                loading={pending}
              >
                {step === 1
                  ? "Next: questions"
                  : step === 2
                    ? "Next: appearance"
                    : project
                      ? "Save changes"
                      : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
