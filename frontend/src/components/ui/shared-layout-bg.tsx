"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import {
  Children,
  cloneElement,
  forwardRef,
  type FocusEvent,
  type HTMLAttributes,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface SharedLayoutBgProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  as?: "div" | "ul";
  pillClassName?: string;
  inset?: number;
  pillContainerClassName?: string;
}

const variants: Variants = {
  initial: { opacity: 0, filter: "blur(6px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: (active: boolean) => (!active ? { opacity: 0, filter: "blur(6px)" } : {}),
};
const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: (active: boolean) => (!active ? { opacity: 0 } : {}),
};

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(function SharedLayoutBg(
  { children, as = "div", className, onMouseLeave, onBlur, pillClassName, pillContainerClassName, inset = 20, ...props },
  forwardedRef,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const uid = useId();
  const reduce = useReducedMotion();
  const hovering = useRef(false);
  const rows = Children.toArray(children).filter(isValidElement).map((child, index) => {
    const element = child as ReactElement<{ className?: string; onMouseEnter?: () => void; onFocus?: (event: FocusEvent<HTMLElement>) => void; children?: ReactNode }>;
    const key = element.key ? String(element.key) : `item-${index}`;
    return cloneElement(element, {
      key,
      className: cn("relative", element.props.className),
      onMouseEnter: () => { element.props.onMouseEnter?.(); hovering.current = true; setActiveId(key); },
      onFocus: (event: FocusEvent<HTMLElement>) => { element.props.onFocus?.(event); setActiveId(key); },
    }, <>
      <AnimatePresence custom={activeId !== null}>
        {activeId !== null && <motion.div variants={reduce ? reducedVariants : variants} initial="initial" animate="animate" exit="exit" custom={activeId !== null} className={cn("pointer-events-none absolute inset-y-0", pillContainerClassName)} style={{ left: -inset, right: -inset }}>
          {activeId === key && <motion.div layoutId={`shared-bg-${uid}`} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 32 }} className={cn("pointer-events-none h-full w-full rounded-xl bg-hover", pillClassName)} />}
        </motion.div>}
      </AnimatePresence>
      <div className="relative z-10">{element.props.children}</div>
    </>);
  });
  const leave = (event: MouseEvent<HTMLElement>) => { hovering.current = false; if (!event.currentTarget.contains(document.activeElement)) setActiveId(null); onMouseLeave?.(event); };
  const blur = (event: FocusEvent<HTMLElement>) => { const next = event.relatedTarget; if (!hovering.current && !(next instanceof Node && event.currentTarget.contains(next))) setActiveId(null); onBlur?.(event); };
  return as === "ul" ? <motion.ul {...(props as HTMLMotionProps<"ul">)} ref={forwardedRef as Ref<HTMLUListElement>} layoutRoot onMouseLeave={leave} onBlur={blur} className={cn("flex w-full flex-col", className)}>{rows}</motion.ul> : <motion.div {...(props as HTMLMotionProps<"div">)} ref={forwardedRef as Ref<HTMLDivElement>} layoutRoot onMouseLeave={leave} onBlur={blur} className={cn("flex w-full flex-col", className)}>{rows}</motion.div>;
});
