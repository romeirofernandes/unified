#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import { createPlan, applyPlan } from "./setup.mjs";

const help = `unified-sdk init --project PROJECT_ID

Installs and mounts the widget in Vite or Next.js.
  --cwd PATH              App directory (default: current directory)
  --api-url URL           Unified backend origin (default: localhost:8000)
  --entry PATH            Custom entry, relative to the app directory
  --theme auto|project|light|dark  Default: follow the host app
  --package-manager NAME  npm, pnpm, yarn, or bun (auto-detected)
  --dry-run               Show the plan without changing files
  --skip-install          Write files; leave dependency installation to you
  --yes                   Require flags instead of interactive prompts
  --help                  Show this help
`;
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      project: { type: "string" },
      "api-url": { type: "string" },
      cwd: { type: "string" },
      entry: { type: "string" },
      theme: { type: "string" },
      "package-manager": { type: "string" },
      "dry-run": { type: "boolean" },
      "skip-install": { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help || !positionals.length) console.log(help);
  else {
    if (positionals.length !== 1 || positionals[0] !== "init")
      throw new Error("Use unified-sdk init. Run --help for options.");
    let projectId = values.project;
    if (!projectId && process.stdin.isTTY && !values.yes) {
      const input = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      try {
        if (!projectId) projectId = await input.question("Project ID: ");
      } finally {
        input.close();
      }
    }
    const plan = createPlan({
      cwd: values.cwd,
      projectId,
      apiUrl: values["api-url"],
      theme: values.theme,
      entry: values.entry,
      manager: values["package-manager"],
    });
    console.log(`\nUnified setup · ${plan.framework} · ${plan.manager}`);
    for (const file of plan.files)
      console.log(
        `  ${file.before === null ? "Create" : "Update"} ${path.relative(plan.root, file.path)}`,
      );
    if (!plan.files.length)
      console.log("  Widget is already configured. No source changes needed.");
    applyPlan(plan, {
      dryRun: values["dry-run"],
      skipInstall: values["skip-install"],
    });
    console.log(
      values["dry-run"]
        ? "\nDry run complete. No files changed."
        : values["skip-install"]
          ? `\nWidget configured. Run ${plan.manager} install to install dependencies.`
          : "\nWidget configured and dependencies installed.",
    );
  }
} catch (error) {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}
