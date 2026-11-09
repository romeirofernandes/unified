"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/omit";
import { tactileButtonBase, tactilePrimaryButton, tactileSecondaryButton } from "@/components/landing/buttonStyles";
import { useSizeVariant } from "@/lib/size-context";

const buttonVariants = cva(
  [
    // whitespace-nowrap: a label never breaks onto 2 lines. It also makes
    // the label the button's narrowest width, so a tight row moves the
    // button (or overflows) instead of squeezing it.
    "group relative isolate inline-flex items-center justify-center outline-none cursor-pointer select-none whitespace-nowrap",
    tactileButtonBase,
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
  ],
  {
    variants: {
      variant: {
        primary: tactilePrimaryButton,
        secondary: tactileSecondaryButton,
        tertiary: "text-foreground",
        ghost: "text-muted-foreground hover:text-foreground",
        destructive: "bg-linear-to-b from-[#bf4b46] to-[#a83f3b] border-[#963b38] text-white shadow-black/20",
        "destructive-ghost": "text-destructive hover:text-destructive",
      },
      // The two-step size ladder shared by every control — see /docs/sizes.
      // default = 36px control height, compact = 28px for dense surfaces.
      size: {
        default: "h-10 px-4 text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] gap-2",
        compact: "h-10 px-4 text-[13px] leading-5 gap-2",
        icon: "h-10 w-10 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-compact": "h-7 w-7 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    // An icon sits 4px closer to its edge than text does: 12px default and
    // 8px compact, against the 16px / 12px base padding.
    compoundVariants: [
      { size: "compact", iconLeft: true, className: "pl-2" },
      { size: "default", iconLeft: true, className: "pl-3" },
      { size: "compact", iconRight: true, className: "pr-2" },
      { size: "default", iconRight: true, className: "pr-3" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonSizeCanonical = "default" | "compact" | "icon" | "icon-compact";

/** Public size values: the canonical two-size scale plus the pre-sizes-system
 *  aliases, kept so existing call sites keep compiling. Aliases resolve onto
 *  the canonical ladder (sm → compact; md/lg → default). */
type ButtonSize =
  | ButtonSizeCanonical
  | "sm"
  | "md"
  | "lg"
  | "icon-sm"
  | "icon-lg";

const legacySizeAliases: Partial<Record<ButtonSize, ButtonSizeCanonical>> = {
  sm: "compact",
  md: "default",
  lg: "default",
  "icon-sm": "icon-compact",
  "icon-lg": "icon",
};

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "size"> {
  /** Omitted, the button follows the surrounding SizeProvider (default 36px,
   *  compact 28px). Legacy sm/md/lg values still resolve. */
  size?: ButtonSize;
  /** When true, the given single React-element child becomes the rendered element (slot-style). */
  asChild?: boolean;
  /** Base UI's spelling of `asChild`: the element to render as, with the
   *  button's children as its label. Accepted so code written either way
   *  works, including the shadcn CLI's asChild-to-render rewrite in Base UI
   *  projects. */
  render?: ReactElement;
  /** Accepted for Base UI parity and ignored: the button already knows
   *  whether it renders a native button. */
  nativeButton?: boolean;
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  /** Force the visual pressed/held state. Useful when the button drives an
   *  external open piece of UI (a popover, dropdown, etc.) so it reads as
   *  engaged while the menu is showing. */
  active?: boolean;
}

/* Press effect: the surface layer sits 1px inside the button and a
   same-color box-shadow spread fills it back out to the full bounds.
   Pressing collapses the spread, shrinking the surface by exactly 1px per
   side at any width — a scale would warp (2% of a 400px button is 8px
   sideways but under 1px vertically). Primary's fills are opaque
   color-mix()es. Secondary's are see-through (--tint), so it takes on the
   surface or tinted banner under it; its fill and spread ring still never
   double up, since an outer shadow renders only outside the surface box. */
const bgVariants: Record<string, string> = {
  primary:
    "bg-[image:var(--button-primary-gradient)] shadow-[0_0_0_1px_var(--button-primary-border)] group-hover:brightness-110 group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-primary-border)]",
  secondary:
    "bg-[image:var(--button-secondary-gradient)] shadow-[0_0_0_1px_var(--button-secondary-border)] group-hover:brightness-105 group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-secondary-border)]",
  // The border ring is an outer 1px shadow at rest that hands off to an
  // inset 1px shadow when pressed, so the ring moves inward with the
  // surface. The translucent fill only ever reaches the ring's inner edge
  // (exactly the surface box), so it needs no spread of its own.
  tertiary:
    "bg-transparent shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-hover:bg-hover group-active:bg-active group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  // Translucent fill + same-color spread never double up: outer shadows
  // render only outside the surface box.
  ghost:
    "bg-transparent shadow-[0_0_0_1px_transparent] group-hover:bg-hover group-hover:shadow-[0_0_0_1px_var(--hover)] group-active:bg-active group-active:shadow-[0_0_0_0px_var(--active)]",
  destructive:
    "bg-[image:var(--button-destructive-gradient)] shadow-[0_0_0_1px_var(--button-destructive-border)] group-hover:brightness-110 group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-destructive-border)]",
  "destructive-ghost":
    "bg-transparent shadow-[0_0_0_1px_transparent] group-hover:bg-destructive/10 group-hover:shadow-[0_0_0_1px_var(--destructive-border)] group-active:bg-destructive/15 group-active:shadow-[0_0_0_0px_var(--destructive-border)]",
};

/* Forced-active (`active` prop): pressed colors at full size; the
   geometric press-collapse still reacts on top. */
const activeBgVariants: Record<string, string> = {
  primary:
    "bg-[image:var(--button-primary-gradient)] shadow-[0_0_0_1px_var(--button-primary-border)] group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-primary-border)]",
  secondary:
    "bg-[image:var(--button-secondary-gradient)] shadow-[0_0_0_1px_var(--button-secondary-border)] group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-secondary-border)]",
  tertiary:
    "bg-active shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  ghost:
    "bg-active shadow-[0_0_0_1px_var(--active)] group-active:shadow-[0_0_0_0px_var(--active)]",
  destructive:
    "bg-[image:var(--button-destructive-gradient)] shadow-[0_0_0_1px_var(--button-destructive-border)] group-active:brightness-95 group-active:shadow-[0_0_0_0px_var(--button-destructive-border)]",
  "destructive-ghost":
    "bg-destructive/10 shadow-[0_0_0_1px_var(--destructive-border)] group-active:bg-destructive/15 group-active:shadow-[0_0_0_0px_var(--destructive-border)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      render,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      active = false,
      disabled,
      children,
      style,
      ...rest
    },
    ref
  ) => {
    // nativeButton is accepted for Base UI parity and ignored (see its doc).
    const props = omit(rest, ["nativeButton"]);

    // asChild: the user's element becomes the root while the button's internal
    // structure (bg layer, content wrapper, spinner, icons) survives as its
    // children — the element's own children become the label. We clone the
    // element directly instead of routing through ButtonPrimitive's `render`:
    // Base UI would bolt button semantics (role="button", Space activation)
    // onto e.g. a link, where plain-link output is wanted.
    // `render` is the same thing written the Base UI way, and takes the same
    // path: its element is the root and the children, when given, are the
    // label (otherwise the element keeps its own).
    type SlotElement = ReactElement<{
      children?: ReactNode;
      className?: string;
      style?: React.CSSProperties;
      ref?: React.Ref<HTMLButtonElement>;
    }>;
    const asChildElement =
      render && isValidElement(render)
        ? children === undefined
          ? (render as SlotElement)
          : cloneElement(render as SlotElement, undefined, children)
        : asChild && isValidElement(children)
          ? (children as SlotElement)
          : null;
    const label = asChildElement ? asChildElement.props.children : children;
    // Resolve the size: explicit prop (legacy aliases mapped onto the
    // canonical ladder) > surrounding SizeProvider > default.
    const contextSize = useSizeVariant();
    const resolvedSize: ButtonSizeCanonical = size
      ? legacySizeAliases[size] ?? (size as ButtonSizeCanonical)
      : contextSize === "compact"
        ? "compact"
        : "default";
    const isIconOnly = resolvedSize === "icon" || resolvedSize === "icon-compact";
    const isCompact =
      resolvedSize === "compact" || resolvedSize === "icon-compact";
    const iconSize = isCompact ? 14 : 16;
    // Spinner box tracks the button height so the loading glyph stays
    // proportionate across sizes.
    const spinnerSizeClass = isCompact ? "h-3.5 w-3.5" : "h-4 w-4";

    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : bgVariants[variant ?? "primary"];

    const internals = (
      <>
        <span
          aria-hidden
          className={cn(
            "absolute inset-px rounded-[inherit] transition-[box-shadow,background-color,filter] [transition-duration:180ms,80ms,200ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease,ease] group-active:[transition-duration:80ms,80ms,80ms]",
            ["primary", "secondary", "destructive"].includes(variant ?? "primary") ? "hidden" : bgClass
          )}
        />
        <span className="relative inline-flex flex-row flex-nowrap items-center justify-center gap-[inherit] whitespace-nowrap">
          {loading ? (
            <>
              <span className="flex items-center justify-center gap-[inherit] opacity-0">
                {LeadingIcon && !isIconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} />
                )}
                {label}
                {TrailingIcon && !isIconOnly && (
                  <TrailingIcon size={iconSize} strokeWidth={2} />
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner className={spinnerSizeClass} />
              </span>
            </>
          ) : isIconOnly ? (
            <span className="[&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-80 group-hover:[&_svg]:stroke-[2]">
              {label}
            </span>
          ) : (
            <>
              {LeadingIcon && (
                <LeadingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
                />
              )}
              {/* Trim plain text only; composed icon/text content needs its own flex alignment. */}
              <span className={typeof label === "string" || typeof label === "number" ? "[text-box:trim-both_cap_alphabetic]" : "inline-flex items-center justify-center"}>{label}</span>
              {TrailingIcon && (
                <TrailingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
                />
              )}
            </>
          )}
        </span>
      </>
    );

    const rootClassName = cn(
      buttonVariants({
        variant,
        size: resolvedSize,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
      }),

      className
    );

    if (asChildElement) {
      const childProps = asChildElement.props;
      return cloneElement(
        asChildElement,
        {
          ...props,
          ref,
          className: cn(rootClassName, childProps.className),
          style: { ...style, ...childProps.style },
        },
        internals
      );
    }

    return (
      <ButtonPrimitive
        // Base UI's `ButtonPrimitive` forwards to an HTMLButtonElement;
        // keep the public ref type narrow so consumers see the right type.
        ref={ref as React.Ref<HTMLButtonElement>}
        className={rootClassName}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        style={style}
        {...props}
      >
        {internals}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps, ButtonSize };
