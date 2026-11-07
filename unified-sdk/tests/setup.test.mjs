import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createPlan, applyPlan } from "../cli/setup.mjs";
import { parseEntry } from "../cli/transform.mjs";

const options = { projectId: "507f1f77bcf86cd799439011" };
function fixture(t, files, pkg = {}) {
  const cwd = mkdtempSync(path.join(tmpdir(), "unified-setup-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const put = (name, value) => {
    mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
    writeFileSync(path.join(cwd, name), value);
  };
  put(
    "package.json",
    JSON.stringify(
      {
        name: "fixture",
        dependencies: { react: "^19.0.0", ...pkg.dependencies },
        ...pkg,
      },
      null,
      2,
    ) + "\n",
  );
  for (const [name, value] of Object.entries(files)) put(name, value);
  return {
    cwd,
    put,
    read: (name) => readFileSync(path.join(cwd, name), "utf8"),
    plan: (extra = {}) => createPlan({ cwd, ...options, ...extra }),
  };
}
const vite = `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n// keep this comment\ncreateRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);\n`;

test("Vite setup preserves providers and comments, and reruns without duplicate mounts", (t) => {
  const f = fixture(t, { "src/main.jsx": vite });
  const plan = f.plan();
  applyPlan(plan, { skipInstall: true });
  const entry = f.read("src/main.jsx");
  parseEntry(entry);
  assert.ok(entry.includes("// keep this comment"));
  assert.ok(
    entry.includes("<StrictMode><App /><UnifiedFeedbackWidget /></StrictMode>"),
  );
  assert.equal(entry.match(/unified-sdk\/dist\/unified-sdk.css/g).length, 1);
  assert.ok(
    f
      .read("src/components/unified-feedback-widget.jsx")
      .includes(options.projectId),
  );
  assert.equal(f.plan().files.length, 0);
});
test("aliased React roots in TypeScript are wrapped once", (t) => {
  const f = fixture(t, {
    "src/main.tsx": `import { createRoot as mount } from 'react-dom/client';\nimport App from './App';\nconst root = mount(document.getElementById('root')!);\nroot.render(<App />);`,
  });
  applyPlan(f.plan(), { skipInstall: true });
  assert.ok(
    f.read("src/main.tsx").includes("<><App /><UnifiedFeedbackWidget /></>"),
  );
  assert.ok(
    existsSync(path.join(f.cwd, "src/components/unified-feedback-widget.tsx")),
  );
});
test("Next App Router keeps metadata and the layout server-side", (t) => {
  const f = fixture(
    t,
    {
      "app/layout.tsx": `import type { ReactNode } from 'react';\nexport const metadata = { title: 'Keep me' };\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body className="app">{children}</body></html>; }`,
    },
    { dependencies: { react: "^19", next: "^15" } },
  );
  const plan = f.plan();
  assert.equal(plan.framework, "next-app");
  applyPlan(plan, { skipInstall: true });
  const entry = f.read("app/layout.tsx");
  assert.ok(entry.includes("{children}<UnifiedFeedbackWidget /></body>"));
  assert.ok(entry.includes("export const metadata"));
  assert.ok(!entry.includes('"use client"'));
  assert.ok(
    f.read("components/unified-feedback-widget.tsx").startsWith('"use client"'),
  );
  assert.equal(f.plan().files.length, 0);
});
test("Next Pages Router wraps the page component without changing its props", (t) => {
  const f = fixture(
    t,
    {
      "src/pages/_app.tsx": `import type { AppProps } from 'next/app';\nconst App = ({ Component, pageProps }: AppProps) => <Component {...pageProps} />;\nexport default App;`,
    },
    { dependencies: { react: "^18", next: "^14" } },
  );
  applyPlan(f.plan(), { skipInstall: true });
  const entry = f.read("src/pages/_app.tsx");
  assert.ok(entry.includes("<Component {...pageProps} />"));
  assert.ok(entry.includes("<UnifiedFeedbackWidget />"));
  parseEntry(entry);
  assert.equal(f.plan().files.length, 0);
});
test("hydration and namespace roots are supported", (t) => {
  for (const source of [
    `import DOM from 'react-dom/client'; DOM.createRoot(document.getElementById('root')).render(<App />);`,
    `import { hydrateRoot as hydrate } from 'react-dom/client'; hydrate(document, <App />);`,
  ]) {
    const f = fixture(t, { "src/main.jsx": source });
    applyPlan(f.plan(), { skipInstall: true });
    assert.ok(f.read("src/main.jsx").includes("<UnifiedFeedbackWidget />"));
  }
});
test("dry runs do not write source, dependencies, or component directories", (t) => {
  const f = fixture(t, { "src/main.jsx": vite });
  const before = f.read("package.json");
  applyPlan(f.plan(), {
    dryRun: true,
    install: () => assert.fail("No installation in dry run"),
  });
  assert.equal(f.read("src/main.jsx"), vite);
  assert.equal(f.read("package.json"), before);
  assert.ok(!existsSync(path.join(f.cwd, "src/components")));
});
test("an existing manual mount in App is detected before any write", (t) => {
  const f = fixture(t, {
    "src/main.jsx": vite,
    "src/App.jsx": `import { UnifiedFeedback as Feedback } from 'unified-sdk'; export default function App() { return <Feedback projectId="p" firebaseUid="u" />; }`,
  });
  assert.throws(() => f.plan(), /already mounted manually in src/);
  assert.equal(f.read("src/main.jsx"), vite);
});
test("unmanaged widget files and ambiguous entries are preserved", (t) => {
  const f = fixture(t, {
    "src/main.jsx": vite,
    "src/components/unified-feedback-widget.jsx": "// handwritten",
  });
  assert.throws(() => f.plan(), /not managed/);
  assert.equal(
    f.read("src/components/unified-feedback-widget.jsx"),
    "// handwritten",
  );
  const ambiguous = fixture(t, {
    "src/main.jsx": `import { createRoot } from 'react-dom/client'; createRoot(a).render(<A />); createRoot(b).render(<B />);`,
  });
  assert.throws(() => ambiguous.plan(), /Expected one React root/);
});
test("a failed dependency installation restores original project files and lockfile", (t) => {
  const f = fixture(t, {
    "src/main.jsx": vite,
    "package-lock.json": "original lock",
  });
  const before = f.read("package.json");
  assert.throws(
    () =>
      applyPlan(f.plan(), {
        install: () => {
          f.put("package-lock.json", "changed lock");
          throw new Error("offline");
        },
      }),
    /files were restored/,
  );
  assert.equal(f.read("src/main.jsx"), vite);
  assert.equal(f.read("package.json"), before);
  assert.equal(f.read("package-lock.json"), "original lock");
  assert.ok(
    !existsSync(path.join(f.cwd, "src/components/unified-feedback-widget.jsx")),
  );
});
test("stale plans and paths outside the project are rejected", (t) => {
  const f = fixture(t, { "src/main.jsx": vite });
  const plan = f.plan();
  f.put("src/main.jsx", "// newer edit");
  assert.throws(
    () => applyPlan(plan, { skipInstall: true }),
    /changed during setup/,
  );
  assert.equal(f.read("src/main.jsx"), "// newer edit");
  assert.throws(() => f.plan({ entry: "../outside.jsx" }), /inside the target/);
});
test("setup does not follow a component directory symlink outside the app", (t) => {
  const f = fixture(t, { "src/main.jsx": vite });
  const outside = mkdtempSync(path.join(tmpdir(), "unified-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  symlinkSync(outside, path.join(f.cwd, "src/components"), "dir");
  assert.throws(() => f.plan(), /symlink outside/);
});
test("package managers and theme settings are explicit and validated", (t) => {
  const f = fixture(t, {
    "src/main.jsx": vite,
    "pnpm-lock.yaml": "lockfileVersion: '9'",
  });
  assert.equal(f.plan().manager, "pnpm");
  assert.equal(f.plan({ manager: "bun" }).manager, "bun");
  assert.throws(() => f.plan({ manager: "bad; command" }), /Choose npm/);
  assert.throws(() => f.plan({ theme: "invalid" }), /Theme must/);
  const plan = f.plan({ theme: "dark" });
  applyPlan(plan, { skipInstall: true });
  assert.ok(
    f
      .read("src/components/unified-feedback-widget.jsx")
      .includes('"theme": "dark"'),
  );
});
test("the published CLI entry accepts noninteractive flags", (t) => {
  const f = fixture(t, { "src/main.jsx": vite });
  const bin = fileURLToPath(new URL("../cli/bin.mjs", import.meta.url));
  const output = execFileSync(
    process.execPath,
    [
      bin,
      "init",
      "--cwd",
      f.cwd,
      "--project",
      options.projectId,
      "--skip-install",
      "--yes",
    ],
    { encoding: "utf8" },
  );
  assert.match(output, /Widget configured/);
  assert.ok(f.read("src/main.jsx").includes("<UnifiedFeedbackWidget />"));
});

test("backend origin is preserved in generated consumer configuration", (t) => {
  const app = fixture(t, { "src/main.jsx": 'import React from "react"; import {createRoot} from "react-dom/client"; createRoot(document.getElementById("root")).render(<div />);' });
  const plan = app.plan({ apiUrl: "https://feedback.example.com/" });
  applyPlan(plan, { skipInstall: true });
  assert.match(app.read("src/components/unified-feedback-widget.jsx"), /"apiUrl": "https:\/\/feedback.example.com"/);
  assert.throws(() => app.plan({ apiUrl: "javascript:alert(1)" }), /http/);
});
