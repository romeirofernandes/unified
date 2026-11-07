import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const sdk = path.resolve(import.meta.dirname, "..");
const app = mkdtempSync(path.join(tmpdir(), "unified-consumer-"));
let server, browser;
try {
  const [pack] = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", app], { cwd: sdk, encoding: "utf8" }));
  writeFileSync(path.join(app, "package.json"), JSON.stringify({ private: true, type: "module", dependencies: {
    react: process.env.CONSUMER_REACT_VERSION || "19.1.0", "react-dom": process.env.CONSUMER_REACT_VERSION || "19.1.0",
    vite: "^6.3.5", "unified-sdk": `file:${path.join(app, pack.filename)}`,
  } }));
  mkdirSync(path.join(app, "src"));
  writeFileSync(path.join(app, "index.html"), '<div id="root"></div><script type="module" src="/src/main.jsx"></script>');
  writeFileSync(path.join(app, "src/main.jsx"), `import React from 'react'; import {createRoot} from 'react-dom/client';
function App() {return <main><h1 id="host-title">Consumer app</h1><button id="host-button">Host button</button></main>}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);`);
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: app, stdio: "pipe" });
  execFileSync("node", ["--input-type=commonjs", "-e", "if(typeof require('unified-sdk').UnifiedFeedback !== 'function' && typeof require('unified-sdk').UnifiedFeedback !== 'object') process.exit(1)"], { cwd: app, stdio: "pipe" });
  execFileSync(path.join(app, "node_modules/.bin/unified-sdk"), ["init", "--project", "test-project", "--uid", "test-owner", "--api-url", "https://feedback.test", "--yes"], { cwd: app, stdio: "pipe" });
  execFileSync(path.join(app, "node_modules/.bin/vite"), ["build"], { cwd: app, stdio: "pipe" });
  server = spawn(path.join(app, "node_modules/.bin/vite"), ["--host", "127.0.0.1", "--port", "4178", "--strictPort"], { cwd: app, stdio: "ignore" });
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4178")).ok) break; } catch { /* startup */ }
    if (attempt === 100) throw new Error("Consumer server did not start");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: process.env.CONSUMER_MOTION || "reduce", viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => { errors.push(error.message); console.error("Consumer runtime error:", error.message); });
  let submissions = 0;
  let submitted;
  await page.route("https://feedback.test/**", async route => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    if (route.request().method() === "GET") return route.fulfill({ json: { _id: "test-project", name: "Tell us", theme: "light", fields: [
      { _id: "email", type: "email", label: "Your email", required: true },
      { _id: "message", type: "textarea", label: "Your feedback", required: true },
    ] } });
    submissions++;
    submitted = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 250));
    return route.fulfill({ status: submissions === 1 ? 500 : 201, json: { id: "saved" } });
  });
  await page.goto("http://127.0.0.1:4178");
  await page.getByRole("button", { name: "Open feedback form" }).click();
  await page.getByRole("textbox", { name: "Your email" }).waitFor();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Your email" }).count(), 1, "Required email cannot be skipped");
  await page.getByRole("textbox", { name: "Your email" }).fill("person@example.com");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("textbox", { name: "Your feedback" }).fill("Please add response triage");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("button", { name: "Sending…", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 1, "Sending cannot be dismissed");
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Your feedback" }).inputValue(), "Please add response triage");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByText("Thank you!", { exact: true }).waitFor();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.equal(submissions, 2);
  assert.deepEqual(submitted.formAnswers, { email: "person@example.com", message: "Please add response triage" });
  const host = await page.locator("#host-title").evaluate(el => ({ margin: getComputedStyle(el).marginTop, weight: getComputedStyle(el).fontWeight }));
  assert.equal(host.weight, "700", "SDK reset must not change host headings");
  assert.notEqual(host.margin, "0px", "SDK reset must not remove host margins");
  assert.deepEqual(errors, []);
  console.log(`Packed SDK installed with its CLI, built and passed dynamic validation/retry/success/CSS isolation checks (React ${process.env.CONSUMER_REACT_VERSION || "19.1.0"}).`);
} finally {
  await browser?.close();
  server?.kill();
  rmSync(app, { recursive: true, force: true });
}
