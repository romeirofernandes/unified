import { useState } from "react";
import { RangeSlider } from "./range-slider";
import { numberPrecision, sliderTicks } from "../form-fields.mjs";
export function RangeField({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  label = "Value",
}) {
  min = Number.isFinite(min) ? min : 0;
  max = Number.isFinite(max) && max > min ? max : min + 1;
  step =
    Number.isFinite(step) && step > 0
      ? Math.min(step, max - min)
      : Math.min(1, max - min);
  const format = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Math.max(
      numberPrecision(min),
      numberPrecision(max),
      numberPrecision(step),
    ),
  });
  const [internal, setInternal] = useState(min);
  const current = Math.max(min, Math.min(max, value ?? internal));
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--uf-muted)]">
        <span>Selected value</span>
        <output className="rounded border border-[var(--uf-border)] bg-[var(--uf-surface)] px-2 py-1 font-mono text-sm tabular-nums text-[var(--uf-text)]">
          {format.format(current)}
        </output>
      </div>
      <RangeSlider
        min={min}
        max={max}
        step={step}
        value={current}
        onValueChange={(next) => {
          setInternal(next);
          onValueChange?.(next);
        }}
        aria-label={label}
        formatValueText={(next) => format.format(next)}
      />
      <div
        aria-hidden="true"
        className="relative mx-2 h-5 text-[10px] tabular-nums text-[var(--uf-muted)]"
      >
        {sliderTicks(min, max, step).map((tick, index, ticks) => (
          <span
            key={tick}
            className="absolute top-0"
            style={{
              left: `${((tick - min) / (max - min)) * 100}%`,
              transform: `translateX(${index === 0 ? "0" : index === ticks.length - 1 ? "-100%" : "-50%"})`,
            }}
          >
            {format.format(tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
