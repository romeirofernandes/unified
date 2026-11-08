import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";

const fixture = {
  _id: "project-1",
  name: "Sample project",
  description: "Customer feedback",
  theme: "light",
  feedbackCount: 1,
  fields: [
    { _id: "email-field", type: "email", label: "Email", required: true },
  ],
};
const source = `
import React from "react";
import { usePreviewTheme } from "./src/hooks/use-preview-theme";
import { setFixtureTheme } from "next-themes";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FluidRoot } from "./src/components/fluid-root";
import Login from "./src/pages/Login";
import Signup from "./src/pages/Signup";
import Dashboard from "./src/pages/Dashboard";
import Feedbacks from "./src/pages/Feedbacks";
import Settings from "./src/pages/Settings";
import Docs from "./src/pages/Docs";
import Integrations from "./src/pages/Integrations";
import Workbench from "./src/pages/Workbench";
import NotFound from "./src/pages/NotFound";
export { documentationMarkdown } from "./src/components/docs/Quickstart";
function PreviewThemeProbe() {
  const [mode] = usePreviewTheme();
  return <output>{mode}</output>;
}
export function renderPreviewTheme(theme) {
  setFixtureTheme(theme);
  return renderToString(<PreviewThemeProbe />);
}
const pages = { Workbench, Integrations, Login, Signup, Dashboard, Feedbacks, Settings, Docs, NotFound };
export function render(name, url) {
  const Page = pages[name];
  return renderToString(<MemoryRouter initialEntries={[url]}><FluidRoot><Routes><Route path="/project/:projectId/feedbacks" element={<Page />} /><Route path="*" element={<Page />} /></Routes></FluidRoot></MemoryRouter>);
}
`;

const result = await build({
  stdin: { contents: source, loader: "jsx", resolveDir: process.cwd() },
  bundle: true,
  nodePaths: [path.resolve("node_modules")],
  loader: { ".css": "empty" },
  platform: "node",
  format: "cjs",
  write: false,
  alias: { "@": path.resolve("src") },
  define: { "import.meta.env": "{}" },
  plugins: [
    {
      name: "page-fixtures",
      setup(builder) {
        builder.onResolve({ filter: /^next-themes$/ }, () => ({ path: "theme-fixture", namespace: "theme-fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "theme-fixture" }, () => ({
          loader: "js",
          contents: 'let resolvedTheme; export function setFixtureTheme(value) { resolvedTheme = value; } export const useTheme = () => ({ resolvedTheme, theme: resolvedTheme, setTheme() {} });',
        }));
        builder.onResolve({ filter: /^@\/hooks\/use-auth$/ }, () => ({
          path: "auth-fixture",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /^@\/hooks\/use-api-resource$/ }, () => ({
          path: "api-fixture",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /^@\/firebaseConfig$/ }, () => ({
          path: "firebase-fixture",
          namespace: "fixture",
        }));
        builder.onLoad(
          { filter: /.*/, namespace: "fixture" },
          ({ path: name }) => ({
            loader: "js",
            contents:
              name === "auth-fixture"
                ? `export const useAuth = () => ({ user: { uid: "user-1", email: "person@example.com", providerData: [], metadata: {} }, login() {}, signup() {}, loginWithGoogle() {}, logout() {} });`
                : name === "firebase-fixture"
                  ? "export const auth = {};"
                  : `const project = ${JSON.stringify(fixture)}; export const useApiResource = (path) => ({ data: path === "/projects" ? [project] : path.startsWith("/projects/") ? project : path.startsWith("/workbench/") ? [{ _id: "issue-1", title: "Fix search", description: "Search fails on mobile", status: "todo", sourceKey: "summary" }] : [{ _id: "feedback-1", timestamp: "2026-11-05T00:00:00.000Z", formAnswers: { "email-field": "customer@example.com" } }], loading: false, error: "", reload() {}, setData() {} });`,
          }),
        );
      },
    },
  ],
});
const module = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const { render, renderPreviewTheme } = module.exports;

test("fresh previews use the app theme, including dark mode", () => {
  assert.equal(renderPreviewTheme("dark"), "<output>dark</output>");
  assert.equal(renderPreviewTheme("light"), "<output>light</output>");
  assert.equal(renderPreviewTheme(undefined), "<output>light</output>");
});

for (const [name, url, expected] of [
  ["Login", "/login", "Welcome back"],
  ["Signup", "/signup", "Create account"],
  ["Dashboard", "/dashboard", "Sample project"],
  ["Feedbacks", "/project/project-1/feedbacks", "customer@example.com"],
  ["Workbench", "/dashboard/workbench", "Fix search"],
  ["Integrations", "/dashboard/integrations", "Slack"],
  ["Settings", "/dashboard/settings", "person@example.com"],
  ["Docs", "/docs", "Set up the SDK"],
  ["Docs", "/dashboard/docs", "Set up the SDK"],
  ["NotFound", "/missing", "This page wandered off."],
]) {
  test(`${name} renders at ${url} with the shared component providers`, () => {
    const markup = render(name, url);
    assert.ok(markup.includes(expected), `Expected ${expected} in ${name}`);
    assert.doesNotMatch(markup, /undefined responses/);
    if (name === "Workbench") {
      assert.equal((markup.match(/data-stage=/g) || []).length, 3);
      assert.doesNotMatch(markup, /Summary issues appear|Add issue to|<select/);
      for (const stage of ["todo", "in_progress", "done"]) assert.ok(markup.includes(`data-stage="${stage}"`));
    }
  });
}

test("copy page includes the full integration contract and every package manager", () => {
  const markdown = module.exports.documentationMarkdown;
  assert.doesNotMatch(markdown, /must be published|requires SDK .* to be published|after its npm release/);
  const sdkVersion = createRequire(import.meta.url)("../../unified-sdk/package.json").version;
  assert.ok(markdown.includes(`unified-sdk@${sdkVersion}`));
  for (const text of ["# Unified documentation", "## Connect your own form", "YOUR_BACKEND_URL/api/submissions/YOUR_PROJECT_ID", "Bearer YOUR_SUBMISSION_KEY", "QUESTION_ID", "HTTP 201", "required", "npm install unified-sdk", "pnpm add unified-sdk", "yarn add unified-sdk", "bun add unified-sdk", "pnpm dlx", "bunx", "Get feedback digests"]) assert.ok(markdown.includes(text), `Missing ${text}`);
});
