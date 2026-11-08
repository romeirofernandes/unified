import { useSyncExternalStore } from "react";
import {
  getWorkspaceBackground,
  setWorkspaceBackground,
  subscribeWorkspaceBackground,
} from "@/lib/workspace-background";

export function useWorkspaceBackground() {
  const background = useSyncExternalStore(
    subscribeWorkspaceBackground,
    getWorkspaceBackground,
    () => "glyph",
  );
  return [background, setWorkspaceBackground];
}
