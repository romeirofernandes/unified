import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, Mail01Icon, StarIcon } from "@hugeicons/core-free-icons";

const icons = { chat: BubbleChatIcon, mail: Mail01Icon, star: StarIcon };
export default function FeedbackLauncher({ launcher = {} }) {
  const icon = icons[launcher.icon || "chat"];
  const iconOnly = launcher.style === "icon";
  return <>
    {icon && launcher.style !== "text" && <HugeiconsIcon icon={icon} size={19} aria-hidden="true" />}
    {(!iconOnly || !icon) && <span>{launcher.label || "Feedback"}</span>}
  </>;
}
