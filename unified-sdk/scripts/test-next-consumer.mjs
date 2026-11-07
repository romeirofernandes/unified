import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";

const sdk = path.resolve(import.meta.dirname, "..");
const app = mkdtempSync(path.join(tmpdir(), "unified-next-consumer-"));
const environment = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
let server, browser;
try {
  const [pack] = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", app], { cwd: sdk, encoding: "utf8" }));
  writeFileSync(path.join(app, "package.json"), JSON.stringify({ private: true, dependencies: {
    next: "16.4.5", react: "19.1.0", "react-dom": "19.1.0", "unified-sdk": `file:${path.join(app, pack.filename)}`,
  } }));
  mkdirSync(path.join(app, "app"));
  writeFileSync(path.join(app, "app/layout.jsx"), 'export const metadata = {title: "Next consumer"}; export default function Layout({children}) {return <html lang="en" className="dark"><body style={{background:"#111",color:"#eee"}}>{children}</body></html>}');
  writeFileSync(path.join(app, "app/page.jsx"), 'export default function Page() {return <main><h1>Next.js consumer</h1><p>Server-rendered page with an installed feedback widget.</p></main>}');
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: app, stdio: "pipe", env: environment });
  execFileSync(path.join(app, "node_modules/.bin/unified-sdk"), ["init", "--project", "next-project", "--api-url", "https://feedback.test", "--yes"], { cwd: app, stdio: "pipe", env: environment });
  execFileSync(path.join(app, "node_modules/.bin/next"), ["build"], { cwd: app, stdio: "pipe", env: environment });
  server = spawn(path.join(app, "node_modules/.bin/next"), ["start", "--hostname", "127.0.0.1", "--port", "4179"], { cwd: app, stdio: "ignore", env: environment });
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4179")).ok) break; } catch { /* startup */ }
    if (attempt === 100) throw new Error("Next consumer did not start");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ colorScheme: "light", reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydration|hydrating|Minified React/i.test(message.text())) errors.push(message.text()); });
  let submitted = false;
  await page.route("https://feedback.test/**", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { name: "Feedback from Next", theme: "light", fields: [{ _id: "message", type: "textarea", label: "Your feedback", required: true }] } });
    submitted = true;
    assert.equal(route.request().headers().authorization, undefined);
    return route.fulfill({ status: 201, json: { id: "saved" } });
  });
  await page.goto("http://127.0.0.1:4179");
  await expect(page.getByRole("heading", { name: "Next.js consumer" })).toBeVisible();
  await page.getByRole("button", { name: "Open feedback form" }).click();
  await expect(page.locator(".unified-feedback-root")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("textbox", { name: "Your feedback" }).fill("Works in a server-rendered Next app");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Thank you!", { exact: true })).toBeVisible();
  assert.equal(submitted, true);
  assert.deepEqual(errors, []);
  console.log("Packed SDK passed Next.js 16 App Router production build, server rendering, hydration, host-theme detection and submission.");
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout.toString().slice(-6000));
  if (error.stderr) process.stderr.write(error.stderr.toString().slice(-3000));
  throw error;
} finally {
  await browser?.close(); server?.kill(); rmSync(app, { recursive: true, force: true });
}
