import { useId, useRef, useState } from "react";
import { WheelPicker } from "./wheel-picker";
import { changeDatePart, dateParts, dateValue } from "../form-fields.mjs";

const months = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: new Date(2000, index, 1).toLocaleDateString("en", { month: "short" }),
}));
export function DateInput({
  value,
  onValueChange,
  label = "Date",
  id,
  required = false,
}) {
  const panelId = useId();
  const trigger = useRef(null);
  const [internal, setInternal] = useState("");
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const today = new Date();
  const initial = dateParts(selected) || {
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
  };
  const [draft, setDraft] = useState(initial);
  const yearStart = Math.min(1900, Number(draft.year));
  const yearEnd = Math.max(today.getFullYear() + 100, Number(draft.year));
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) =>
    String(yearStart + index),
  );
  const dayCount = new Date(
    Number(draft.year),
    Number(draft.month),
    0,
  ).getDate();
  const days = Array.from({ length: dayCount }, (_, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label: String(index + 1),
  }));
  const parts = dateParts(selected);
  function close() {
    setOpen(false);
    queueMicrotask(() => trigger.current?.focus());
  }
  function commit(next) {
    setInternal(next);
    onValueChange?.(next);
    close();
  }
  const buttonClass =
    "h-10 rounded-md border border-[var(--uf-border)] bg-[var(--uf-surface)] px-3 text-sm text-[var(--uf-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]";
  return (
    <div className="min-w-0 space-y-3">
      <button
        ref={trigger}
        type="button"
        id={id}
        aria-controls={panelId}
        aria-label={`${label}: ${selected || "Choose a date"}`}
        aria-expanded={open}
        onClick={() => {
          setDraft(initial);
          setOpen((previous) => !previous);
        }}
        className={`${buttonClass} flex w-full items-center justify-between gap-2 text-left`}
      >
        <span>
          {parts
            ? new Date(
                Number(parts.year),
                Number(parts.month) - 1,
                Number(parts.day),
              ).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Choose a date"}
        </span>
        <span aria-hidden="true" className="text-xs text-[var(--uf-muted)]">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={`Choose ${label}`}
          className="space-y-3 rounded-md border border-[var(--uf-border)] bg-[var(--uf-background)] p-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-1">
            {[
              ["month", months, "Month"],
              ["day", days, "Day"],
              ["year", years, "Year"],
            ].map(([key, options, title]) => (
              <div key={key} className="min-w-0 space-y-2">
                <p className="text-center text-xs text-[var(--uf-muted)]">
                  {title}
                </p>
                <WheelPicker
                  options={options}
                  value={draft[key]}
                  onValueChange={(next) =>
                    setDraft((previous) => changeDatePart(previous, key, next))
                  }
                  visibleCount={5}
                  itemHeight={30}
                  sound={false}
                  aria-label={`${label}: ${title}`}
                  className="w-full rounded-md border-0 bg-transparent text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {!required && selected && (
              <button
                type="button"
                className={buttonClass}
                onClick={() => commit("")}
              >
                Clear
              </button>
            )}
            <button type="button" className={buttonClass} onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="h-10 rounded-md bg-[var(--uf-accent)] px-4 text-sm font-medium text-[var(--uf-accentText)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--uf-accent)]"
              onClick={() => commit(dateValue(draft))}
            >
              Use date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
