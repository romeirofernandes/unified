import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("block min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-card px-3 py-3 text-base leading-6 text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-fluid-accent focus-visible:ring-2 focus-visible:ring-fluid-accent/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm", className)} {...props} />;
});
