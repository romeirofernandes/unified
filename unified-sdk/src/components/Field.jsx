import React, { memo } from "react";

const Field = memo(({ field, value, onChange }) => {
  const baseInputClass =
    "w-full rounded-md border border-[var(--uf-border)] bg-[var(--uf-surface)] p-3 text-[var(--uf-text)] placeholder:text-[var(--uf-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]";

  switch (field.type) {
    case "text":
    case "email":
      return (
        <input
          id={`uf-field-${field._id}`}
          type={field.type}
          className={baseInputClass}
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
        />
      );
    case "textarea":
      return (
        <textarea
          id={`uf-field-${field._id}`}
          className={`${baseInputClass} h-24 resize-none`}
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
        />
      );
    case "mcq":
      return (
        <div
          role="radiogroup"
          aria-labelledby={`uf-label-${field._id}`}
          className="space-y-2"
        >
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center space-x-2">
              <input
                type="radio"
                name={field._id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(field._id, e.target.value)}
                required={field.required}
                className="accent-[var(--uf-accent)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    case "slider":
      return (
        <div className="space-y-2">
          <input
            id={`uf-field-${field._id}`}
            type="range"
            min={field.config?.min ?? 0}
            max={field.config?.max ?? 100}
            step={field.config?.step ?? 1}
            value={value ?? field.config?.min ?? 0}
            onChange={(e) => onChange(field._id, Number(e.target.value))}
            required={field.required}
            className="w-full accent-[var(--uf-accent)]"
          />
          <div className="flex justify-between text-sm opacity-70">
            <span>{field.config?.min ?? 0}</span>
            <span>{field.config?.max ?? 100}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
});

export default Field;
