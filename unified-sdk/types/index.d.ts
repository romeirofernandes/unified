import type { ComponentType } from "react";
export interface UnifiedFeedbackProps {
  projectId: string;
  /** API origin for your Unified backend. Required outside local development. */
  apiUrl?: string;
  position?: "bottom-left" | "bottom-right";
  /** Auto follows the host app and OS. Project uses the saved project mode. */
  theme?: "auto" | "project" | "light" | "dark";
}
export declare const UnifiedFeedback: ComponentType<UnifiedFeedbackProps>;
