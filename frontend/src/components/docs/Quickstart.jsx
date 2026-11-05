import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import CodeBlock from "@/components/shared/CodeBlock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrationCode } from "@/lib/integration-code";
import { typeClass } from "@/lib/type-scale";

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
    <div className="space-y-10">
      <PageHeader
        title="From setup to your first response."
        description="A small React component. A direct line to your customers. Here’s how to get started."
      />
      <div className="grid items-start gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav
          aria-label="On this page"
          className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col"
        >
          {steps.map((step, index) => (
            <Button
              key={step.id}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <a href={`#${step.id}`}>
                {index + 1}. {step.title}
              </a>
            </Button>
          ))}
        </nav>
        <div className="min-w-0 space-y-6">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              id={step.id}
              className="scroll-mt-24 space-y-5 p-5 sm:p-7"
            >
              <div className="space-y-2">
                <p className={`${typeClass("caption")} text-muted-foreground`}>
                  Step {index + 1} of {steps.length}
                </p>
                <h2 className={typeClass("title")}>{step.title}</h2>
                <p className={`${typeClass("body")} text-muted-foreground`}>
                  {step.description}
                </p>
              </div>
              {step.items && (
                <ul
                  className={`${typeClass("body")} list-disc space-y-2 pl-5 text-muted-foreground`}
                >
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {step.code && <CodeBlock code={step.code} label={step.label} />}
              {step.action && (
                <Button variant="secondary" asChild>
                  <Link to="/dashboard">Open your workspace</Link>
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
