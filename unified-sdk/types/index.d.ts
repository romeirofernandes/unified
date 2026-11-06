import type { ComponentType } from "react";
export interface UnifiedFeedbackProps {
  projectId: string;
  firebaseUid: string;
  /** Omit this to use the mode saved on the project. */
  theme?: "light" | "dark";
}
export declare const UnifiedFeedback: ComponentType<UnifiedFeedbackProps>;
