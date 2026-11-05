import { Link } from "react-router-dom";
import CodeBlock from "@/components/shared/CodeBlock";
import { Button } from "@/components/ui/button";
import { integrationCode } from "@/lib/integration-code";

const steps = [
  {
    id: "create-project",
    title: "Create a project",
    description:
      "Open your workspace and create a project for the app you want to hear from.",
    items: [
      "Add a project name and description.",
      "Choose a light or dark widget.",
      "Add your questions. Email is included by default.",
    ],
    action: true,
  },
  {
    id: "install",
    title: "Install the SDK",
    description: "Run this command in your React app’s directory.",
    code: "npm install unified-sdk",
    label: "Terminal",
  },
  {
    id: "integrate",
    title: "Add the feedback widget",
    description:
      "Open Preview & code on your project card for a snippet with your own project ID, Firebase UID, and theme. Import the SDK stylesheet once.",
    code: integrationCode(),
    label: "App.jsx",
  },
  {
    id: "listen",
    title: "Read the conversation",
    description:
      "Select your project’s name in the dashboard to read responses.",
    items: [
      "Try the widget in your app and send a response.",
      "Review answers on the project’s feedback page.",
      "Generate a summary to identify common requests.",
    ],
  },
];

export default function Quickstart() {
  return (
    <div className="pb-8">
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
                  <span className="text-foreground">Preview & code</span> panel.
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
        <aside className="hidden space-y-6 xl:sticky xl:top-24 xl:block">
          <nav
            aria-label="On this page"
            className="space-y-4 border-s border-border ps-5"
          >
            <p className="text-xs font-medium text-foreground">On this page</p>
            {steps.map((step, index) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className="block text-xs leading-6 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground"
              >
                0{index + 1} <span className="ms-2">{step.title}</span>
              </a>
            ))}
          </nav>
          <p className="ps-5 text-xs leading-6 text-muted-foreground">
            Already set up? Open a project to view responses and generate a
            feedback summary.
          </p>
        </aside>
      </div>
    </div>
  );
}
