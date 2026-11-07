export function integrationCode({
  projectId = "YOUR_PROJECT_ID",
  theme = "light",
  apiUrl = import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000",
} = {}) {
  return `import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

export default function App() {
  return (
    <UnifiedFeedback
      projectId=${JSON.stringify(projectId)}
      apiUrl=${JSON.stringify(apiUrl)}
      theme=${JSON.stringify(theme)}
    />
  );
}`;
}

export function setupCommand({
  projectId = "YOUR_PROJECT_ID",
  manager = "npm",
  apiUrl = import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000",
} = {}) {
  const quote = (value) => "'" + String(value).replaceAll("'", "'\\''") + "'";
  const runners = { npm: "npx --yes unified-sdk@2.2.0", pnpm: "pnpm dlx unified-sdk@2.2.0", yarn: "yarn dlx unified-sdk@2.2.0", bun: "bunx unified-sdk@2.2.0" };
  return `${runners[manager]} init --project ${quote(projectId)} --api-url ${quote(apiUrl)} --package-manager ${manager}`;
}
