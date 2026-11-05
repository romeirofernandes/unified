import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FormField from "@/components/shared/FormField";
import { fieldTypes } from "@/lib/project-fields";
import { typeClass } from "@/lib/type-scale";

export default function FieldEditor({ field, index, onChange, onRemove }) {
  const updateOption = (id, label) =>
    onChange({
      options: field.options.map((option) =>
        option.id === id ? { ...option, label, value: label } : option,
      ),
    });
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={typeClass("subtitle")}>Question {index + 1}</h3>
        {index > 0 && (
          <Button
            variant="ghost"
            size="compact"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
          >
            Remove
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <FormField
          as="select"
          label="Field type"
          value={field.type}
          disabled={index === 0}
          onChange={(event) => onChange({ type: event.target.value })}
        >
          {fieldTypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FormField>
        <FormField
          label="Question label"
          value={field.label}
          required
          onChange={(event) => onChange({ label: event.target.value })}
          placeholder="What could we improve?"
        />
      </div>
      <label
        className={`${typeClass("body")} flex min-h-9 w-fit items-center gap-2 text-muted-foreground`}
      >
        <input
          type="checkbox"
          className="size-4 accent-[var(--fluid-accent)]"
          checked={field.required}
          disabled={index === 0}
          onChange={(event) => onChange({ required: event.target.checked })}
        />
        Required answer
      </label>
      {field.type === "mcq" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={typeClass("body")}>Answer options</span>
            <Button
              variant="secondary"
              size="compact"
              onClick={() =>
                onChange({
                  options: [
                    ...field.options,
                    { id: crypto.randomUUID(), label: "", value: "" },
                  ],
                })
              }
            >
              Add option
            </Button>
          </div>
          {field.options.map((option, optionIndex) => (
            <div key={option.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <FormField
                  label={`Option ${optionIndex + 1}`}
                  value={option.label}
                  required
                  onChange={(event) =>
                    updateOption(option.id, event.target.value)
                  }
                />
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  onChange({
                    options: field.options.filter(
                      (item) => item.id !== option.id,
                    ),
                  })
                }
                aria-label={`Remove option ${optionIndex + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      {field.type === "slider" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["min", "max", "step"].map((key) => (
            <FormField
              key={key}
              label={{ min: "Minimum", max: "Maximum", step: "Step" }[key]}
              type="number"
              step="any"
              value={Number.isNaN(field.config[key]) ? "" : field.config[key]}
              required
              onChange={(event) =>
                onChange({
                  config: {
                    ...field.config,
                    [key]:
                      event.target.value === ""
                        ? NaN
                        : Number(event.target.value),
                  },
                })
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
