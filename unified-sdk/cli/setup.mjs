import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
export { createPlan, sdkVersion } from "./project.mjs";

export function applyPlan(
  plan,
  { skipInstall = false, dryRun = false, install = runInstall } = {},
) {
  if (dryRun) return;
  // Check for edits made after planning before writing any file.
  for (const file of plan.files) {
    const actual = existsSync(file.path)
      ? readFileSync(file.path, "utf8")
      : null;
    if (actual !== file.before)
      throw new Error(
        `File changed during setup: ${path.relative(plan.root, file.path)}. Run setup again.`,
      );
  }
  const locks = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lock",
    "bun.lockb",
  ].map((name) => ({
    path: path.join(plan.root, name),
    before: existsSync(path.join(plan.root, name))
      ? readFileSync(path.join(plan.root, name))
      : null,
  }));
  const written = [];
  try {
    for (const file of plan.files) {
      mkdirSync(path.dirname(file.path), { recursive: true });
      writeFileSync(file.path, file.after);
      written.push(file);
    }
    if (!skipInstall) install(plan.manager, plan.root);
  } catch (error) {
    for (const file of written.reverse()) {
      if (file.before === null) {
        if (existsSync(file.path)) unlinkSync(file.path);
      } else writeFileSync(file.path, file.before);
    }
    for (const file of locks) {
      if (file.before === null) {
        if (existsSync(file.path)) unlinkSync(file.path);
      } else writeFileSync(file.path, file.before);
    }
    throw new Error(
      `Setup failed; project files were restored. ${error.message}`,
    );
  }
}
function runInstall(manager, cwd) {
  execFileSync(
    process.platform === "win32" ? `${manager}.cmd` : manager,
    ["install"],
    { cwd, stdio: "inherit", shell: process.platform === "win32" },
  );
}
