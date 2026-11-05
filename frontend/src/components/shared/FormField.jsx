import { useId } from "react";
import { typeClass } from "@/lib/type-scale";

const controlClass = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-[length:var(--fs-body,13px)]";

export default function FormField({ label, as: control = "input", className = "", ...props }) {
  const id = useId();
  const Component = control;
  return <div className="min-w-0 space-y-2"><label htmlFor={id} className={`${typeClass("body")} block text-muted-foreground`}>{label}</label><Component id={id} className={`${controlClass} ${className}`} {...props} /></div>;
}
