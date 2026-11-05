import { RangeSlider } from "@/components/motion/range-slider";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import { typeClass } from "@/lib/type-scale";

export default function PreviewField({ field, theme }) {
  const inputClass = `w-full rounded-lg border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#7c99d7] ${theme === "dark" ? "border-[#45433e] bg-[#262626] text-[#f4f1e9]" : "border-[#d6d3ca] bg-white text-[#24231f]"}`;
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
      {field.type === "mcq" && <RadioGroup aria-label={field.label}>{field.options?.map((option) => <RadioGroupItem key={option._id || option.value} value={option.value} label={option.label} />)}</RadioGroup>}
      {field.type === "slider" && (
        <>
          <RangeSlider
            aria-label={field.label}
            min={field.config?.min ?? 0}
            max={field.config?.max ?? 100}
            step={field.config?.step ?? 1}
            className="w-full accent-[#7c99d7]"
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
