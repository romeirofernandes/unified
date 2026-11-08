import { RadioGroup, RadioGroupItem } from "../../../shared/controls/radio";
import { RangeField } from "../../../shared/controls/range-field";
import { DateInput } from "../../../shared/controls/date-input";
import { answerPlaceholder } from "../../../shared/form-fields.mjs";
import { memo } from "react";

const Field = memo(({ field, value, onChange, idPrefix = "uf" }) => {
  const baseInputClass = "uf-input";

  switch (field.type) {
    case "text":
    case "email":
      return (
        <input
          id={`${idPrefix}-field-${field._id}`}
          type={field.type}
          className={baseInputClass}
          placeholder={answerPlaceholder(field.type)}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
          maxLength={12000}
        />
      );
    case "textarea":
      return (
        <textarea
          id={`${idPrefix}-field-${field._id}`}
          className={`${baseInputClass} uf-textarea`}
          placeholder={answerPlaceholder(field.type)}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
          maxLength={12000}
        />
      );
    case "mcq":
      return (
        <RadioGroup
          value={value ?? ""}
          onValueChange={(next) => onChange(field._id, next)}
          aria-labelledby={`${idPrefix}-label-${field._id}`}
        >
          {field.options?.map((option, idx) => (
            <RadioGroupItem key={option._id || idx} value={option.value} label={option.label} />
          ))}
        </RadioGroup>
      );
    case "date":
      return (
        <DateInput
          id={`${idPrefix}-field-${field._id}`}
          label={field.label}
          required={field.required}
          value={value ?? ""}
          onValueChange={(next) => onChange(field._id, next)}
        />
      );
    case "slider":
      return (
        <RangeField
          min={field.config?.min ?? 0}
          max={field.config?.max ?? 100}
          step={field.config?.step ?? 1}
          value={value}
          onValueChange={(next) => onChange(field._id, next)}
          label={field.label}
        />
      );
    default:
      return null;
  }
});

export default Field;
