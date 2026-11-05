import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { typeClass } from "@/lib/type-scale";

export default function ProjectCard({ project, onPreview, onDelete }) {
  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle>
          <Link
            to={`/project/${project._id}/feedbacks`}
            className="break-words text-foreground underline-offset-4 hover:underline"
          >
            {project.name}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {project.description ||
            "Your next customer conversation starts here."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div
          className={`${typeClass("caption")} flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground`}
        >
          <span>{project.fields?.length || 0} fields</span>
          <span>{project.feedbackCount ?? 0} responses</span>
          <span>{project.theme === "dark" ? "Dark" : "Light"} widget</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onPreview(project)}>
          Preview & code
        </Button>
        <Button
          variant="ghost"
          onClick={() => onDelete(project)}
          aria-label={`Delete ${project.name}`}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
