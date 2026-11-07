import type { ComponentType } from "react";
export interface UnifiedFeedbackProps {
  projectId: string;
  /** API origin for your Unified backend. Required outside local development. */
  apiUrl?: string;
  position?: "bottom-left" | "bottom-right";
  /** Omit this to use the mode saved on the project. */
  theme?: "light" | "dark";
}
export declare const UnifiedFeedback: ComponentType<UnifiedFeedbackProps>;
