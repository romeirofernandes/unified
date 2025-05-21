import React, { memo } from "react";

const Field = memo(({ field, theme, value, onChange }) => {
  const baseInputClass = `w-full p-3 rounded-lg transition-colors ${
    theme === "dark"
      ? "bg-[#262626] border border-[#383838] text-[#fafafa] placeholder-[#a1a1a1] focus:border-[#525252]"
      : "bg-white border border-gray-200 text-[#171717] placeholder-[#737373] focus:border-[#525252]"
  }`;

  switch (field.type) {
    case "text":
    case "email":
      return (
        <input
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
          className={`${baseInputClass} h-24 resize-none`}
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(field._id, e.target.value)}
          required={field.required}
        />
      );
    case "mcq":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center space-x-2">
              <input
                type="radio"
                name={field._id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(field._id, e.target.value)}
                required={field.required}
                className="text-[#e5e5e5]"
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
            type="range"
            min={field.config?.min || 0}
            max={field.config?.max || 100}
            step={field.config?.step || 1}
            value={value || field.config?.min || 0}
            onChange={(e) => onChange(field._id, Number(e.target.value))}
            required={field.required}
            className="w-full"
          />
          <div className="flex justify-between text-sm opacity-70">
            <span>{field.config?.min || 0}</span>
            <span>{field.config?.max || 100}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
});

export default Field;