// Adapted from beUI (MIT): https://beui.dev/r/checkbox
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useId, type CSSProperties } from "react";
import Checkmark from "./checkmark";
import { SPRING_PRESS } from "../lib/ease";
import { cn } from "../lib/utils";


export interface CheckboxProps {
  checked: boolean;
  formTheme?: boolean;
  /** Decorative mark inside a row that owns checkbox semantics and interaction. */
  visualOnly?: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string;
  /** Supporting text under the label, announced as the description rather than the name. */
  description?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
  /** Associates an external message (e.g. a form error) with the control. */
  "aria-describedby"?: string;
}

export function Checkbox({
  checked,
  formTheme = false,
  visualOnly = false,
  onCheckedChange,
  disabled,
  indeterminate,
  label,
  description,
  className,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const reduce = useReducedMotion();
  const showMark = checked || indeterminate;
  const descriptionId = description ? `${id}-description` : undefined;
  // The wrapping <label> would fold the description into the name, so name from the label text alone.
  const labelId = description && label && !ariaLabel ? `${id}-label` : undefined;
  const describedBy =
    [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  const Wrapper = visualOnly ? "span" : "label";
  const Control = visualOnly ? motion.span : motion.button;

  return (
    <Wrapper
      htmlFor={visualOnly ? undefined : id}
      aria-hidden={visualOnly || undefined}
      style={formTheme ? { "--primary": "var(--uf-accent)", "--primary-foreground": "var(--uf-accentText)", "--background": "var(--uf-surface)", "--foreground": "var(--uf-text)", "--muted-foreground": "var(--uf-muted)", "--ring": "var(--uf-accent)" } as CSSProperties : undefined}
      className={cn(
        "inline-flex gap-3",
        description ? "items-start" : "items-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <Control
        id={id}
        type="button"
        role={visualOnly ? undefined : "checkbox"}
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={ariaLabel}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={visualOnly ? undefined : () => !disabled && onCheckedChange(!checked)}
        whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
        transition={SPRING_PRESS}
        data-state={
          checked ? "checked" : indeterminate ? "indeterminate" : "unchecked"
        }
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 outline-none transition-colors duration-200",
          "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          showMark
            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "border-[var(--muted-foreground)]/50 bg-[var(--background)] hover:border-[var(--muted-foreground)]",
        )}
      >
        <AnimatePresence initial={false}>
          {showMark ? (
            <Checkmark key={indeterminate ? "indeterminate" : "checked"} indeterminate={indeterminate} />
          ) : null}
        </AnimatePresence>
      </Control>
      {label || description ? (
        <span className={cn("flex min-w-0 flex-col gap-0.5 select-none", disabled && "opacity-60")}>
          {label ? (
            <span
              id={labelId}
              // Geist sits low in a 20px line; a 16px line lifts the text onto the control.
              className={cn("text-sm text-[var(--foreground)]", description && "leading-4")}
            >
              {label}
            </span>
          ) : null}
          {description ? (
            <span id={descriptionId} className="text-xs text-[var(--muted-foreground)]">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </Wrapper>
  );
}
