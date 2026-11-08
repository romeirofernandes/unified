import sdkPackage from "../../../unified-sdk/package.json" with { type: "json" };

export const sdkVersion = sdkPackage.version;

export function integrationCode({
  projectId = "YOUR_PROJECT_ID",
  theme = "auto",
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
  const runners = { npm: "npx --yes", pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" };
  return `${runners[manager]} unified-sdk@${sdkVersion} init --project ${quote(projectId)} --api-url ${quote(apiUrl)} --package-manager ${manager}`;
}
