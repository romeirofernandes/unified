export function integrationCode({
  projectId = "YOUR_PROJECT_ID",
  uid = "YOUR_FIREBASE_UID",
  theme = "light",
} = {}) {
  return `import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

export default function App() {
  return (
    <UnifiedFeedback
      projectId=${JSON.stringify(projectId)}
      firebaseUid=${JSON.stringify(uid)}
      theme=${JSON.stringify(theme)}
    />
  );
}`;
}
