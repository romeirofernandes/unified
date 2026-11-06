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
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FluidRoot } from "./src/components/fluid-root";
import Login from "./src/pages/Login";
import Signup from "./src/pages/Signup";
import Dashboard from "./src/pages/Dashboard";
import Feedbacks from "./src/pages/Feedbacks";
import Settings from "./src/pages/Settings";
import Docs from "./src/pages/Docs";
import NotFound from "./src/pages/NotFound";
const pages = { Login, Signup, Dashboard, Feedbacks, Settings, Docs, NotFound };
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
                  : `const project = ${JSON.stringify(fixture)}; export const useApiResource = (path) => ({ data: path === "/projects" ? [project] : path.startsWith("/projects/") ? project : [{ _id: "feedback-1", timestamp: "2026-11-05T00:00:00.000Z", formAnswers: { "email-field": "customer@example.com" } }], loading: false, error: "", reload() {}, setData() {} });`,
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
const { render } = module.exports;

for (const [name, url, expected] of [
  ["Login", "/login", "Welcome back"],
  ["Signup", "/signup", "Create account"],
  ["Dashboard", "/dashboard", "Sample project"],
  ["Feedbacks", "/project/project-1/feedbacks", "customer@example.com"],
  ["Settings", "/dashboard/settings", "person@example.com"],
  ["Docs", "/docs", "Install the SDK"],
  ["Docs", "/dashboard/docs", "Install the SDK"],
  ["NotFound", "/missing", "This page wandered off."],
]) {
  test(`${name} renders at ${url} with the shared component providers`, () => {
    const markup = render(name, url);
    assert.ok(markup.includes(expected), `Expected ${expected} in ${name}`);
    assert.doesNotMatch(markup, /undefined responses/);
  });
}
