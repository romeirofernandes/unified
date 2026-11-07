import PageHeader from "@/components/shared/PageHeader";
import CopyButton from "@/components/shared/CopyButton";
import PackageCommands from "@/components/shared/PackageCommands";
import { useEffect, useRef, useState } from "react";
import { BounceSidebar } from "@/components/motion/bounce-sidebar";
import { Link } from "react-router-dom";
import CodeBlock from "@/components/shared/CodeBlock";
import { Button } from "@/components/ui/button";
import { integrationCode, setupCommand } from "@/lib/integration-code";

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

const steps = [
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
    description: "From SDK 2.2.0 (after its npm release), run this in your Vite or Next.js app. The CLI checks your React entry, installs the SDK, adds its stylesheet, and mounts the widget. Add --dry-run to inspect the changes first.",
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
export const documentationMarkdown = "# Unified documentation\n\n" + steps.map((step) => `## ${step.title}\n\n${step.description}\n\n${step.id === "install" ? automaticMarkdown + "\n\n" : ""}${(step.items || []).map((item) => `- ${item}`).join("\n")}${step.code ? `\n\n\`\`\`${step.label === "Terminal" ? "sh" : "jsx"}\n${step.code}\n\`\`\`` : ""}`).join("\n\n") + "\n\n## SDK installation\n\n```sh\n# npm\nnpm install unified-sdk\n# pnpm\npnpm add unified-sdk\n# Yarn\nyarn add unified-sdk\n# Bun\nbun add unified-sdk\n```\n\nAutomatic setup requires SDK 2.2.0 to be published. Yarn automatic setup requires Yarn 2 or newer. Manual installation works with 2.1.2. Replace project and Firebase UID placeholders with values from Preview. Keep project submission keys server-side.\n";

export default function Quickstart() {
  const contentRef = useRef(null);
  const [active, setActive] = useState(steps[0].id);
  useEffect(() => {
    let frame;
    const root = contentRef.current;
    let scroller = root?.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const update = () => {
      const viewport = scroller && scroller !== document.body && scroller !== document.documentElement
        ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const last = document.getElementById(steps.at(-1).id)?.getBoundingClientRect();
      const endVisible = last && last.top < viewport.bottom && last.bottom <= viewport.bottom + 16;
      const current = endVisible ? steps.at(-1) : [...steps].reverse().find(({ id }) => document.getElementById(id)?.getBoundingClientRect().top <= viewport.top + Math.min(320, (viewport.bottom - viewport.top) * 0.35)) || steps[0];
      setActive(current.id);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    // Capture scroll from nested containers as well as the document.
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    if (root) observer.observe(root);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <div ref={contentRef} className="space-y-10 pb-8">
      <PageHeader title="Documentation" description="Set up the widget, connect your own form, and bring feedback into your workflow." action={<CopyButton value={documentationMarkdown} label="page" showLabel />} />
      <div className="grid min-w-0 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-16">
        <div className="min-w-0 max-w-4xl space-y-12">
          {steps.map((step, index) => (
            <section
              key={step.id}
              id={step.id}
              aria-labelledby={`${step.id}-title`}
              className="min-w-0 scroll-mt-24 space-y-6 border-b border-border pb-12 last:border-0 last:pb-0"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
                <h2
                  id={`${step.id}-title`}
                  className="text-2xl tracking-tight sm:text-3xl"
                >
                  {step.title}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {step.description}
              </p>
              {step.items && (
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {step.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1 shrink-0 rounded-full bg-fluid-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {step.id === "install" && <><p className="text-sm text-muted-foreground">The npm release is currently 2.1.2 and has no CLI. Use manual setup below until 2.2.0 is published. These automatic commands require that release. Yarn commands require Yarn 2 or newer.</p><PackageCommands automatic /></>}
              {step.id === "integrate" && <PackageCommands />}
              {step.code && <CodeBlock code={step.code} label={step.label} />}
              {step.id === "integrate" && (
                <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm leading-6 text-muted-foreground">
                  Replace{" "}
                  <code className="font-mono text-xs text-foreground">
                    YOUR_PROJECT_ID
                  </code>{" "}
                  and{" "}
                  <code className="font-mono text-xs text-foreground">
                    YOUR_FIREBASE_UID
                  </code>{" "}
                  with the values in your project’s{" "}
                  <span className="text-foreground">Preview</span> panel.
                </div>
              )}
              {step.action && (
                <Button variant="secondary" asChild>
                  <Link to="/dashboard">Open your workspace</Link>
                </Button>
              )}
            </section>
          ))}
        </div>
        <aside onClick={(event) => {
          const link = event.target.closest('a[href^="#"]');
          if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const section = document.getElementById(link.hash.slice(1));
          if (!section) return;
          event.preventDefault();
          history.replaceState(null, "", link.hash);
          section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        }} className="hidden space-y-6 xl:sticky xl:top-24 xl:block">
          <BounceSidebar items={steps.map((step) => ({ id: step.id, label: step.title, href: `#${step.id}` }))} value={active} onValueChange={setActive} ariaLabel="On this page" itemClassName="text-sm" indicatorClassName="bg-fluid-accent" />
          <p className="ps-5 text-xs leading-6 text-muted-foreground">
            Already set up? Open a project to view responses and generate a
            feedback summary.
          </p>
        </aside>
      </div>
    </div>
  );
}
