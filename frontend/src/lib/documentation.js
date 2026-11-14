import { integrationCode, setupCommand, sdkVersion } from "./integration-code.js";

const customFormCode = `const response = await fetch("YOUR_BACKEND_URL/api/submissions/YOUR_PROJECT_ID", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_SUBMISSION_KEY",
  },
  body: JSON.stringify({
    formAnswers: {
      "QUESTION_ID": "Your answer",
    },
  }),
});
if (!response.ok) throw new Error("Could not send feedback");`;

export const steps = [
  {
    id: "create-project",
    title: "Create a project",
    description:
      "Open your workspace and create a project for the app you want to hear from.",
    items: [
      "Add a project name and description.",
      "Add questions by hand, or describe them with voice or text. Email is included by default.",
      "Choose a theme preset, its default mode, and any custom colors.",
    ],
    action: true,
  },
  {
    id: "install",
    title: "Set up the SDK",
    description: `Run this in your Vite or Next.js app. The CLI checks your React entry, installs SDK ${sdkVersion}, adds its stylesheet, and mounts the widget. Add --dry-run to inspect the changes first.`,
    label: "Terminal",
  },
  {
    id: "integrate",
    title: "Or set it up manually",
    description:
      "If you used the CLI, skip this step. Otherwise, install the SDK with your package manager below. Select Preview in the project editor, then add the snippet and stylesheet once.",
    code: integrationCode(),
    label: "App.jsx",
  },
  {
    id: "custom-form",
    title: "Connect your own form",
    description: "Already have a feedback form? Keep your UI and send its answers to Unified from your server. You do not need to install the SDK.",
    items: [
      "Create matching questions in your project, then open Preview → Custom form.",
      "Create a submission key. You can return to copy it anytime, replace it, or revoke it. Replacing or revoking it disables the previous key.",
      "Copy the project endpoint and question IDs from the generated example. Map your input values to those IDs, not question labels.",
      "Keep the key on your server. It grants submission access only, and does not grant access to read responses or edit projects.",
      "Send formAnswers as an object. Text, email, date and choice answers are strings; sliders are numbers. Dates use YYYY-MM-DD, and choices use the configured option value.",
      "Include every required answer and at least one nonempty answer. A successful request returns HTTP 201 with the response id. Invalid answers return 400; invalid or revoked keys return 401.",
      "Responses appear in the same dashboard and summaries as SDK responses. When a question is recreated, update your integration to use its new ID.",
    ],
    code: customFormCode,
    label: "Server · JavaScript",
  },
  {
    id: "widget-options",
    title: "Configure the widget",
    description: "Use project Appearance settings for saved defaults. Pass props when an app needs its own overrides.",
    items: [
      "projectId is required and public. Set apiUrl to your deployed backend origin in production; the local default is http://localhost:8000.",
      'theme accepts auto (the default), project, light, or dark. Auto follows the host app and system preference; project uses the saved project mode.',
      'triggerStyle accepts pill, rounded, icon, text, or tab. position accepts bottom-left or bottom-right. These props override project settings.',
      "For Next.js, mount the widget in a client component and import the SDK stylesheet once. The setup CLI creates that component for you.",
      "Dragging the launcher onto its delete target hides it across refreshes for that API origin and project. Clear site storage to restore it.",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshoot setup",
    description: "Start with the project ID, API origin, and installed SDK version.",
    items: [
      "Use Node.js 20.19 or newer for the setup CLI and React 18 or 19 in the host app. Run setup with --dry-run to inspect its changes.",
      "If the widget cannot load, check that apiUrl points to a reachable backend over HTTPS and that projectId matches Preview. localhost only works during local development.",
      "If the launcher is missing, check whether it was removed on this browser. Clearing site storage restores it, but also clears other saved site preferences.",
      "For custom forms, a 400 response means answers need checking; a 401 means the submission key is invalid or revoked. Send the key only from your server.",
    ],
  },
  {
    id: "workbench",
    title: "Turn feedback into work",
    description: "Generate a feedback summary, then open Workbench to review the issues it produces.",
    items: [
      "Review related responses and move cards from To do through to Done as work progresses.",
      "Use the draft pull request flow for a focused issue when a repository is connected. Review the proposed code before merging.",
    ],
  },
  {
    id: "notifications",
    title: "Get feedback digests",
    description: "Open Integrations in your workspace and choose a project. Use Install in workspace to choose your Slack workspace and channel, enable email to your account address, or use both.",
    items: [
      "Choose hourly or daily delivery for each channel. The first digest covers feedback received after you enable it. Empty periods and unchanged summaries are skipped.",
      "A fresh summary is generated from new feedback before delivery, even when nobody opens the responses page. Each digest includes the new response count, an AI overview, actionable requests and a link to the project. Email answers are excluded from the summary.",
      "Send a test after saving to check delivery. Tests use sample content and do not consume pending feedback. Pause a channel anytime to stop scheduled delivery.",
    ],
  },
  {
    id: "listen",
    title: "Read the conversation",
    description:
      "Select your project’s name in the dashboard to read responses.",
    items: [
      "Try the widget in your app and send a response.",
      "Review answers on the project’s feedback page.",
      "Read the automatic summary to identify common requests.",
    ],
  },
];

const managers = ["npm", "pnpm", "yarn", "bun"];
const automaticMarkdown = managers.map((manager) => `### ${manager}\n\n\`\`\`sh\n${setupCommand({ manager })}\n\`\`\``).join("\n\n");
export const documentationMarkdown = "# Unified documentation\n\n" + steps.map((step) => `## ${step.title}\n\n${step.description}\n\n${step.id === "install" ? automaticMarkdown + "\n\n" : ""}${(step.items || []).map((item) => `- ${item}`).join("\n")}${step.code ? `\n\n\`\`\`${step.label === "Terminal" ? "sh" : "jsx"}\n${step.code}\n\`\`\`` : ""}`).join("\n\n") + "\n\n## SDK installation\n\n```sh\n# npm\nnpm install unified-sdk\n# pnpm\npnpm add unified-sdk\n# Yarn\nyarn add unified-sdk\n# Bun\nbun add unified-sdk\n```\n\nYarn automatic setup requires Yarn 2 or newer. This backend requires SDK 2.2.0 or newer. Replace project placeholders with values from Preview. Keep project submission keys server-side.\n";

