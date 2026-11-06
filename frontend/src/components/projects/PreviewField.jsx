import { RangeSlider } from "@/components/motion/range-slider";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import { typeClass } from "@/lib/type-scale";

export default function PreviewField({ field }) {
  const inputClass =
    "w-full rounded-md border border-[var(--uf-border)] bg-[var(--uf-surface)] px-3 py-2 text-base text-[var(--uf-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]";
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className={`${typeClass("body")} mb-2`}>
        {field.label}
        {field.required && <span aria-label="required"> *</span>}
      </legend>
      {["text", "email"].includes(field.type) && (
        <input
          aria-label={field.label}
          type={field.type}
          className={inputClass}
          placeholder={field.label}
        />
      )}
      {field.type === "textarea" && (
        <textarea
          aria-label={field.label}
          className={inputClass}
          rows={3}
          placeholder={field.label}
        />
      )}
      {field.type === "mcq" && (
        <RadioGroup aria-label={field.label}>
          {field.options?.map((option) => (
            <RadioGroupItem
              key={option._id || option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </RadioGroup>
      )}
      {field.type === "slider" && (
        <>
          <RangeSlider
            aria-label={field.label}
            min={field.config?.min ?? 0}
            max={field.config?.max ?? 100}
            step={field.config?.step ?? 1}
            className="w-full [&>div>div]:bg-primary/15 [&>div:last-child]:bg-primary"
          />
          <div className={`${typeClass("caption")} flex justify-between`}>
            <span>{field.config?.min ?? 0}</span>
            <span>{field.config?.max ?? 100}</span>
          </div>
        </>
      )}
    </fieldset>
  );
}
