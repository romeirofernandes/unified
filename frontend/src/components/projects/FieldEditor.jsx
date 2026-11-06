import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/motion/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleIndicator,
} from "@/components/motion/collapsible";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import FormField from "@/components/shared/FormField";
import { fieldTypes } from "@/lib/project-fields";

export default function FieldEditor({
  field,
  index,
  open,
  onOpenChange,
  onChange,
  onRemove,
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-md border border-border bg-background"
    >
      <div className="flex items-center gap-2 pe-3">
        <CollapsibleTrigger className="min-w-0 flex-1 rounded-md px-4 py-3 hover:bg-transparent">
          <span className="grid size-7 shrink-0 place-items-center rounded border border-border bg-card font-mono text-xs text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">
              {field.label || "New question"}
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              {fieldTypes.find((type) => type.value === field.type)?.label}
              {field.required ? " · Required" : " · Optional"}
            </span>
          </span>
          <CollapsibleIndicator />
        </CollapsibleTrigger>
        {index > 0 && (
          <Button
            variant="destructive"
            size="icon-compact"
            onClick={onRemove}
            aria-label={`Delete question ${index + 1}`}
            title="Delete question"
          >
            <HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" />
          </Button>
        )}
      </div>
      <CollapsibleContent contentClassName="space-y-4 border-t border-border p-4">
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <div className="space-y-2">
            <p
              className="text-xs text-muted-foreground"
              id={`type-${field.id}`}
            >
              Answer type
            </p>
            <Select
              value={field.type}
              disabled={index === 0}
              onValueChange={(type) => onChange({ type })}
            >
              <SelectTrigger
                aria-labelledby={`type-${field.id}`}
                className="h-10 w-full rounded-md"
              />
              <SelectContent>
                {fieldTypes.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FormField
            label="Question"
            value={field.label}
            required
            maxLength={240}
            onChange={(event) => onChange({ label: event.target.value })}
            placeholder="What could we improve?"
          />
        </div>
        <Checkbox
          label="Required answer"
          checked={field.required}
          disabled={index === 0}
          onCheckedChange={(required) => onChange({ required })}
        />
        {field.type === "mcq" && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium">Answer options</p>
              <Button
                variant="secondary"
                onClick={() =>
                  onChange({
                    options: [
                      ...field.options,
                      { id: crypto.randomUUID(), label: "", value: "" },
                    ],
                  })
                }
                disabled={field.options.length >= 20}
              >
                <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />{" "}
                Add option
              </Button>
            </div>
            {field.options.map((option, optionIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {optionIndex + 1}
                </span>
                <input
                  aria-label={`Option ${optionIndex + 1}`}
                  className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  required
                  maxLength={160}
                  value={option.label}
                  placeholder="Answer option"
                  onChange={(event) =>
                    onChange({
                      options: field.options.map((item) =>
                        item.id === option.id
                          ? {
                              ...item,
                              label: event.target.value,
                              value: event.target.value,
                            }
                          : item,
                      ),
                    })
                  }
                />
                <Button
                  variant="destructive"
                  size="icon-compact"
                  aria-label={`Delete option ${optionIndex + 1}`}
                  onClick={() =>
                    onChange({
                      options: field.options.filter(
                        (item) => item.id !== option.id,
                      ),
                    })
                  }
                >
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    size={15}
                    aria-hidden="true"
                  />
                </Button>
              </div>
            ))}
          </div>
        )}
        {field.type === "slider" && (
          <div className="grid gap-3 sm:grid-cols-3">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
