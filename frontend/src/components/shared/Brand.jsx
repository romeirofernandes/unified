import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { UnionCircleIcon } from "@hugeicons/core-free-icons";

export default function Brand() {
  return (
    <Link
      to="/"
      aria-label="unified home"
      className="inline-flex w-fit items-center gap-2.5 text-foreground no-underline"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#496699] bg-gradient-to-b from-[#9bb3e3] to-[#6e8dc9] text-white">
        <HugeiconsIcon icon={UnionCircleIcon} size={21} aria-hidden="true" />
      </span>
      <span className="font-serif text-2xl">unified</span>
    </Link>
  );
}
