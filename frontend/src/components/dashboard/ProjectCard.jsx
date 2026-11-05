import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { raisedCardSurface } from "@/components/ui/cardStyles";

export default function ProjectCard({ project, onEdit, onDelete }) {
  const count = project.feedbackCount ?? 0;
  return (
    <Card
      className={`${raisedCardSurface} relative flex h-full min-h-36 min-w-0 flex-col p-4 transition-colors hover:border-fluid-accent/50 focus-within:ring-2 focus-within:ring-ring`}
    >
      <div className="absolute end-3 top-3 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon-compact"
          onClick={() => onEdit(project)}
          aria-label={`Edit ${project.name}`}
          title="Edit project"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={15} aria-hidden="true" />
        </Button>
        <Button
          variant="destructive"
          size="icon-compact"
          onClick={() => onDelete(project)}
          aria-label={`Delete ${project.name}`}
          title="Delete project"
        >
          <HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" />
        </Button>
      </div>
      <h2 className="pe-20 text-lg leading-7">
        <Link
          to={`/project/${project._id}/feedbacks`}
          className="break-words outline-none after:absolute after:inset-0 after:rounded-md"
        >
          {project.name}
        </Link>
      </h2>
      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>
      )}
      <div className="mt-auto flex justify-end pt-3">
        <span className="rounded-full border border-[#30456d]/40 bg-[#5575b4] px-2.5 py-1 text-xs font-medium tabular-nums text-white">
          {count} {count === 1 ? "response" : "responses"}
        </span>
      </div>
    </Card>
  );
}
