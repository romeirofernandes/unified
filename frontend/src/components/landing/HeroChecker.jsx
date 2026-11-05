import { cn } from "@/lib/utils";

export default function HeroChecker({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none bg-[conic-gradient(#7c99d7_25%,transparent_0_50%,#7c99d7_0_75%,transparent_0)] [background-size:16px_16px] [image-rendering:pixelated]", className)}
    />
  );
}
