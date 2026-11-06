import { useState } from "react";
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
  const [fields, setFields] = useState(() =>
    project?.fields?.length
      ? project.fields.map((field) => ({
          ...createField(field.type),
          ...field,
          id: field._id || crypto.randomUUID(),
          options: (field.options || []).map((option) => ({
            ...option,
            id: option._id || crypto.randomUUID(),
          })),
        }))
      : [createField("email")],
  );
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    const validation = validateFields(fields);
    if (validation) {
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-md border border-border bg-background p-0 text-foreground sm:max-w-[1060px]" size="xl" showCloseButton={!pending}>
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 pe-14 sm:px-6">
          <DialogTitle>{project ? "Edit project" : "Create a project"}</DialogTitle>
          <DialogDescription>{step === 1 ? "Set up your project, then choose what to ask." : "Keep the form focused. Email is included by default."}</DialogDescription>
          <ol className="flex gap-5 pt-3 text-xs" aria-label="Project setup steps">{["Project details", "Questions"].map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={step === index + 1 ? "font-medium text-foreground" : "text-muted-foreground"}><span className="me-2 font-mono">0{index + 1}</span>{label}</li>)}</ol>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <fieldset disabled={pending} className="min-w-0 space-y-5">
                {step === 1 ? <>
                  <FormField label="Project name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoFocus placeholder="My product" />
                  <FormField as="textarea" label="Description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1000} placeholder="What are you collecting feedback on?" />
                  <fieldset className="space-y-3"><legend className="text-sm text-muted-foreground">Widget mode</legend><div className="grid grid-cols-2 gap-3">{["light", "dark"].map((mode) => <label key={mode} className="cursor-pointer"><input type="radio" name="widget-mode" className="peer sr-only" checked={theme === mode} onChange={() => setTheme(mode)} /><span className="flex h-10 items-center justify-center rounded-md border border-border text-sm capitalize peer-checked:border-fluid-accent peer-checked:bg-fluid-accent/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{mode}</span></label>)}</div></fieldset>
                </> : <>
                  <div className="space-y-3">{fields.map((field, index) => <FieldEditor key={field.id} field={field} index={index} open={expanded === field.id} onOpenChange={(open) => setExpanded(open ? field.id : null)} onChange={(patch) => setFields((previous) => previous.map((item) => item.id === field.id ? { ...item, ...patch } : item))} onRemove={() => setFields((previous) => previous.filter((item) => item.id !== field.id))} />)}</div>
                  <Button variant="secondary" className="w-full" onClick={() => { const field = createField(); setFields((previous) => [...previous, field]); setExpanded(field.id); }}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" /> Add question</Button>
                </>}
                <ErrorMessage>{error}</ErrorMessage>
              </fieldset>
              <div className="min-w-0 lg:sticky lg:top-0"><ProjectFormPreview name={name} fields={fields} theme={theme} /></div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6">
            {onPreview && <Button variant="secondary" onClick={onPreview} disabled={pending}>Preview & code</Button>}
            {step === 2 && <Button variant="secondary" onClick={() => { setStep(1); setError(""); }} disabled={pending}>Back</Button>}
            <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || pending} loading={pending}>{step === 1 ? "Next: questions" : project ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
