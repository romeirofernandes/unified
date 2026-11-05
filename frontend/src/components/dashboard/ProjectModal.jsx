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
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
        size="xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? project
                ? "Edit project"
                : "Create a project"
              : "Choose your questions"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? project
                ? "Update your project details, then review its questions."
                : "Give your feedback a home. You can configure the questions next."
              : "Email is included. Add the questions that help you decide what to build."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
          <fieldset disabled={pending} className="min-w-0 space-y-4">
            {step === 1 ? (
              <>
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
                  placeholder="What are you collecting feedback on?"
                />
                <FormField
                  as="select"
                  label="Widget theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </FormField>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      onChange={(patch) =>
                        setFields((previous) =>
                          previous.map((item) =>
                            item.id === field.id ? { ...item, ...patch } : item,
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
                  onClick={() =>
                    setFields((previous) => [...previous, createField()])
                  }
                >
                  Add question
                </Button>
              </>
            )}
          </fieldset>
          <ErrorMessage>{error}</ErrorMessage>
          <DialogFooter>
            {onPreview && (
              <Button
                variant="secondary"
                onClick={onPreview}
                disabled={pending}
              >
                Preview & code
              </Button>
            )}
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
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
                : project
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
