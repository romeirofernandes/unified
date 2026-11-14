import type { ComponentProps } from "react";
import { ditherAvatarDataUri } from "@/lib/dither-avatar";
import { cn } from "@/lib/utils";

type FallbackAvatarProps = {
  name: string;
  size?: number;
  className?: string;
} & Omit<ComponentProps<"img">, "src" | "alt" | "width" | "height">;

export default function FallbackAvatar({
  name,
  size = 32,
  className,
  ...props
}: FallbackAvatarProps) {
  return (
    <img
      {...props}
      src={ditherAvatarDataUri(name)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("inline-block shrink-0 rounded-full", className)}
    />
  );
}
