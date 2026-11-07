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
        <div
          role="radiogroup"
          aria-labelledby={`${idPrefix}-label-${field._id}`}
          className="uf-choices"
        >
          {field.options?.map((option, idx) => (
            <label key={idx} className="uf-choice" data-selected={value === option.value || undefined}>
              <input
                type="radio"
                name={`${idPrefix}-${field._id}`}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(field._id, e.target.value)}
                required={field.required}
          maxLength={12000}
                className="uf-radio"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    case "date":
      return (
        <DateInput
          id={`${idPrefix}-field-${field._id}`}
          label={field.label}
          required={field.required}
          maxLength={12000}
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
