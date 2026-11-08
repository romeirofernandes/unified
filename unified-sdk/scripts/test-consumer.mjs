import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";

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
  execFileSync(path.join(app, "node_modules/.bin/unified-sdk"), ["init", "--project", "test-project", "--api-url", "https://feedback.test", "--yes"], { cwd: app, stdio: "pipe" });
  const entryPath = path.join(app, "src/main.jsx");
  writeFileSync(entryPath, readFileSync(entryPath, "utf8").replace(/import\s+["']unified-sdk\/dist\/unified-sdk\.css["'];?\s*/g, ""));
  execFileSync(path.join(app, "node_modules/.bin/vite"), ["build"], { cwd: app, stdio: "pipe" });
  server = spawn(path.join(app, "node_modules/.bin/vite"), ["--host", "127.0.0.1", "--port", "4178", "--strictPort"], { cwd: app, stdio: "ignore" });
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4178")).ok) break; } catch { /* startup */ }
    if (attempt === 100) throw new Error("Consumer server did not start");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: process.env.CONSUMER_MOTION || "reduce", colorScheme: "light", viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => { errors.push(error.message); console.error("Consumer runtime error:", error.message); });
  let submissions = 0;
  let submitted;
  let allFields = false;
  let launcher = { style: "rounded", icon: "mail", label: "Talk to us", colors: { light: { background: "#123456", text: "#ffffff" } } };
  await page.route("https://feedback.test/**", async route => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    if (route.request().method() === "GET") return route.fulfill({ json: { _id: "test-project", name: "Tell us", theme: "light", appearance: { preset: "unified", launcher }, fields: allFields ? [
      { _id: "date", type: "date", label: "Visit date", required: true },
      { _id: "choice", type: "mcq", label: "Would you return?", required: true, options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] },
      { _id: "rating", type: "slider", label: "Rating", required: true, config: { min: 0, max: 10, step: 1 } },
      { _id: "name", type: "text", label: "Your name", required: true },
    ] : [
      { _id: "email", type: "email", label: "Your email", required: true },
      { _id: "message", type: "textarea", label: "Your feedback", required: true },
    ] } });
    assert.equal(route.request().headers()["firebase-uid"], undefined);
    assert.equal(route.request().headers().authorization, undefined);
    assert.match(route.request().url(), /\/api\/widget\/test-project$/);
    submissions++;
    submitted = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 250));
    return route.fulfill({ status: submissions === 1 ? 500 : 201, json: { id: "saved" } });
  });
  await page.goto("http://127.0.0.1:4178");
  const widget = page.locator(".unified-feedback-root");
  await expect(widget).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Open feedback form" })).toContainText(launcher.label || "Feedback");
  await page.locator(".uf-morph-surface").evaluate(el => { el.dataset.testShell = "persistent"; });
  await page.getByRole("button", { name: "Open feedback form" }).click();
  await expect(page.locator(".uf-panel")).toHaveAttribute("data-test-shell", "persistent");
  await page.getByRole("textbox", { name: "Your email" }).waitFor();
  await expect(page.getByRole("textbox", { name: "Your email" })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(page.locator(".uf-panel")).toBeInViewport({ ratio: 1 });
  const compactPanel = await page.locator(".uf-panel").boundingBox();
  assert.ok(compactPanel.x >= 0 && compactPanel.x + compactPanel.width <= 320);
  await page.setViewportSize({ width: 390, height: 844 });
  if (process.env.CONSUMER_CAPTURE) await page.screenshot({ path: process.env.CONSUMER_CAPTURE });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(widget).toHaveAttribute("data-theme", "dark");
  if (process.env.CONSUMER_CAPTURE) await page.screenshot({ path: process.env.CONSUMER_CAPTURE.replace(/\.png$/, "-dark.png") });
  await page.evaluate(() => { document.documentElement.classList.remove("dark"); document.documentElement.classList.add("light"); });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(widget).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => document.documentElement.classList.remove("light"));
  await expect(widget).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await expect(widget).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
  await page.emulateMedia({ colorScheme: "light" });
  await expect(widget).toHaveAttribute("data-theme", "light");
  await page.addStyleTag({ content: "body button { padding: 70px !important; background: magenta !important; font-size: 40px !important; } body input { height: 200px !important; font-size: 40px !important; }" });
  assert.equal(await page.getByRole("textbox", { name: "Your email" }).evaluate(el => getComputedStyle(el).height), "44px", "Host CSS cannot change widget geometry");
  assert.equal(await page.getByRole("textbox", { name: "Your email" }).evaluate(el => getComputedStyle(el).fontSize), "14px");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await expect(page.getByRole("button", { name: "Hide feedback widget" })).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Open feedback form" });
  await trigger.click();
  await page.getByRole("textbox", { name: "Your email" }).waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Your email" }).count(), 1, "Required email cannot be skipped");
  await page.getByRole("textbox", { name: "Your email" }).fill("person@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Your feedback" }).fill("Please add response triage");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await page.getByRole("button", { name: "Sending…", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 1, "Sending cannot be dismissed");
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Your feedback" }).inputValue(), "Please add response triage");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await page.getByText("Thank you!", { exact: true }).waitFor();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page.setViewportSize({ width: 320, height: 640 });
  assert.equal(submissions, 2);
  assert.deepEqual(submitted.formAnswers, { email: "person@example.com", message: "Please add response triage" });
  const host = await page.locator("#host-title").evaluate(el => ({ margin: getComputedStyle(el).marginTop, weight: getComputedStyle(el).fontWeight }));
  assert.equal(host.weight, "700", "SDK reset must not change host headings");
  assert.notEqual(host.margin, "0px", "SDK reset must not remove host margins");
  allFields = true;
  await page.reload();
  await page.getByRole("button", { name: "Open feedback form" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Choose a date");
  await page.getByRole("button", { name: /Visit date: Choose a date/ }).click();
  await page.getByRole("button", { name: "Use date", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Choose an option");
  const yes = page.getByRole("radio", { name: "Yes", exact: true });
  await yes.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "No", exact: true })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(yes).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Rating", exact: true });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "10");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Ada");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Thank you!", { exact: true })).toBeVisible();
  assert.equal(submitted.formAnswers.choice, "yes");
  assert.equal(submitted.formAnswers.rating, 1);
  assert.match(submitted.formAnswers.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(submitted.formAnswers.name, "Ada");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page.reload();
  await trigger.waitFor();
  for (const style of ["pill", "rounded", "icon", "text", "tab"]) {
    launcher = { style, icon: "star", label: "Share an idea", colors: { light: { background: "#123456", text: "#ffffff" } } };
    await page.reload();
    await expect(trigger).toHaveClass(new RegExp(`uf-trigger-${style}`));
    await expect(trigger.locator("svg")).toHaveCount(style === "text" ? 0 : 1);
    await expect(trigger.locator(".uf-launcher-content > span")).toHaveCount(style === "icon" ? 0 : 1);
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(18, 52, 86)");
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).color), "rgb(255, 255, 255)");
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await expect(trigger).toBeFocused();
  }
  const start = await trigger.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 - 20, start.y + start.height / 2 - 30, { steps: 8 });
  const zone = page.getByRole("region", { name: "Drop here to remove feedback" });
  await zone.waitFor();
  const drop = await zone.boundingBox();
  assert.ok(drop.height >= 100);
  assert.ok(Number(await trigger.evaluate(el => getComputedStyle(el.closest(".uf-position")).zIndex)) > Number(await zone.evaluate(el => getComputedStyle(el.closest(".uf-delete-dock")).zIndex)));
  await page.mouse.move(drop.x + drop.width / 2, drop.y + drop.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(trigger).toHaveCount(0);
  if (process.env.CONSUMER_MOTION === "no-preference") {
    await expect(page.locator(".uf-fragment")).toHaveCount(48);
    await expect(page.locator(".uf-fragment-face").first()).toHaveClass(/uf-trigger-tab/);
    await expect(page.locator(".uf-fragment-face").first()).toContainText("Share an idea");
    await expect(page.locator(".uf-fragment-face").first()).toHaveCSS("background-color", "rgb(18, 52, 86)");
    if (process.env.CONSUMER_CAPTURE) await page.screenshot({ path: process.env.CONSUMER_CAPTURE.replace(/\.png$/, "-disintegrating.png") });
  } else {
    await expect(page.locator(".uf-fragment")).toHaveCount(0);
  }
  await expect(page.locator("[data-disintegrating], .uf-dust-fallback")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveCount(0);
  await Promise.all([page.waitForResponse(response => response.url().includes("/api/widget/test-project")), page.reload()]);
  await expect(widget).toHaveCount(0);
  await expect(trigger).toHaveCount(0);
  assert.equal(await page.evaluate(() => localStorage.getItem("unified-feedback:dismissed:https://feedback.test:test-project")), "1");
  assert.deepEqual(errors, []);
  console.log(`Packed SDK installed with its CLI, built and passed validation, retry, theme switching, Shadow DOM isolation, persistent drag-to-delete checks (React ${process.env.CONSUMER_REACT_VERSION || "19.1.0"}).`);
} finally {
  await browser?.close();
  server?.kill();
  rmSync(app, { recursive: true, force: true });
}
