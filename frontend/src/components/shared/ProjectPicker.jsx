import { useId } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

export default function ProjectPicker({ projects, value, onChange, className, triggerClassName = "" }) {
  const id = useId();
  return <div className={cn("flex w-full min-w-52 flex-col gap-2 sm:w-60", className)}>
    <p id={id} className="text-sm text-muted-foreground">Project</p>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-labelledby={id} className={`h-10 w-full rounded-md ${triggerClassName}`} />
      <SelectContent>{projects.map((project) => <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}
