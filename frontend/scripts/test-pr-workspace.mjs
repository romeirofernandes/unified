import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const requireSdk = createRequire(path.join(root, "unified-sdk/package.json"));
const { chromium, expect } = requireSdk("@playwright/test");
const output = mkdtempSync(path.join(tmpdir(), "unified-pr-workspace-"));
const fixture = `
import React, {useEffect, useState, useCallback} from 'react';
const project = {_id:'project-1',name:'Unified',fields:[]};
const issue = {_id:'issue-1',title:'Clarify the save button',description:'The editor button should use a specific label.',status:'todo'};
const run = {_id:'run-1',projectId:'project-1',issueId:'issue-1',issue:{title:issue.title,description:issue.description},acceptance:'The editor button must read Save changes.',repository:'owner/repository',baseBranch:'main',baseSha:'a'.repeat(40),requiredCheck:'tests',model:'fixture',status:'eligible',active:false,createdAt:'2026-11-09T10:00:00Z',message:'This is a small label correction in an existing component.',assessment:{suitable:true,reason:'The label is present in the selected editor component.',plan:['Change the existing save label without changing submission behavior.']},files:[{path:'frontend/src/components/Editor.tsx',sha:'b'.repeat(40),size:1240}],patch:[{path:'frontend/src/components/Editor.tsx',before:'<button>Save</button>',after:'<button>Save changes</button>'}],events:[{at:'2026-11-09T10:00:00Z',status:'eligible',message:'Assessment complete.'}]};
const data = {configured:true,installUrl:'https://github.com/apps/unified-test/installations/new',connection:{repository:'owner/repository',defaultBranch:'main',requiredCheck:'tests',connectedAt:'2026-11-09T09:00:00Z'},runs:[]};
window.prFixture = {run,data,calls:[],update(status){run.status=status; run.prUrl='https://github.com/owner/repository/pull/1'; run.branch='unified/fix-run-1'; data.runs=[{...run}]; window.dispatchEvent(new Event('fixture'));}};
export function useAuth(){return {user:{uid:'user-1',email:'owner@example.com',displayName:'Project owner'},loading:false,logout(){}};}
export function useApiResource(route){
 const [,redraw]=useState(0); const reload=useCallback(()=>redraw(n=>n+1),[]);
 useEffect(()=>{window.addEventListener('fixture',reload);return()=>window.removeEventListener('fixture',reload);},[reload]);
 return {data: route==='/projects'?[project]:route.startsWith('/workbench/')?[issue]:route.endsWith('/checks')?{names:['build','tests']}:route.includes('/runs/')?{...run}: {...data,runs:[...data.runs]},loading:false,error:'',reload,setData(){}};
}
export async function apiRequest(route,options){
 window.prFixture.calls.push({route,...options});
 if(route.endsWith('/runs')){data.runs=[{...run}];window.dispatchEvent(new Event('fixture'));return {_id:run._id};}
 if(route.endsWith('/connection/check')){data.connection.requiredCheck=options.body.requiredCheck;window.dispatchEvent(new Event('fixture'));}
 if(route.endsWith('/attempt')) window.prFixture.update('awaiting_checks');
 if(route.endsWith('/shipped')) window.prFixture.update('shipped');
 return {};
}
export function accessToken(){return Promise.resolve('fixture');}
export function useTheme(){const [,redraw]=useState(0);useEffect(()=>{const update=()=>redraw(n=>n+1);window.addEventListener('fixture-theme',update);return()=>window.removeEventListener('fixture-theme',update);},[]);const mode=document.documentElement.classList.contains('dark')?'dark':'light';return {theme:mode,resolvedTheme:mode,setTheme(value){document.documentElement.classList.toggle('dark',value==='dark');window.dispatchEvent(new Event('fixture-theme'));}};}
export function useWorkspaceBackground(){return ['none'];}
`;
const source = `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import {FluidRoot} from './src/components/fluid-root';import DashboardLayout from './src/components/dashboard/DashboardLayout';import PullRequests from './src/pages/PullRequests';createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/dashboard/pull-requests?project=project-1&issue=issue-1'+(location.search?'&'+location.search.slice(1):'')]}><FluidRoot><DashboardLayout><PullRequests/></DashboardLayout></FluidRoot></MemoryRouter>);`;
const result = await build({ stdin: { contents: source, resolveDir: path.join(root, "frontend"), loader: "jsx" }, bundle: true, nodePaths: [path.join(root, "frontend/node_modules")], jsx: "automatic", platform: "browser", format: "iife", write: false, loader: { ".css": "empty" }, alias: { "@": path.join(root, "frontend/src") }, define: { "import.meta.env": "{}", "process.env.NODE_ENV": '"test"' }, plugins: [{ name: "fixtures", setup(builder) {
  builder.onResolve({ filter: /^(?:@\/hooks\/(?:use-auth|use-api-resource|use-workspace-background)|@\/lib\/(?:api|access-token)|next-themes)$/ }, () => ({ path: "fixture", namespace: "fixture" }));
  builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: fixture, loader: "jsx", resolveDir: path.join(root, "frontend") }));
} }] });
const cssPath = readdirSync(path.join(root, "frontend/dist/assets")).find(name => /^index-.*\.css$/.test(name));
const css = readFileSync(path.join(root, "frontend/dist/assets", cssPath), "utf8");
const html = path.join(output, "index.html");
writeFileSync(html, `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body></html>`);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(pathToFileURL(html).toString());
  await expect(page.getByRole("heading", { name: "Pull requests", exact: true })).toBeVisible();
  const assess = page.getByRole("button", { name: "Assess this issue" });
  await expect(assess).toBeDisabled();
  await page.getByRole("textbox", { name: "What should change, and how will you verify it?" }).fill("The editor button must read Save changes; its existing interaction tests must pass.");
  await assess.click();
  await expect(page.getByRole("button", { name: "Attempt fix & open draft" })).toBeVisible();
  await page.getByRole("button", { name: "Source context", exact: false }).click();
  await expect(page.getByRole("region", { name: "Source context · 1 file" }).getByText("frontend/src/components/Editor.tsx", { exact: true })).toBeVisible();
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: path.join(output, `dark-${width}.png`), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No page overflow at ${width}px`);
  }
  await page.evaluate(() => { document.documentElement.classList.remove("dark"); window.dispatchEvent(new Event("fixture-theme")); });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(output, "light-390.png"), fullPage: true });
  await page.getByRole("button", { name: "Attempt fix & open draft" }).click();
  await expect(page.getByRole("link", { name: "Open draft on GitHub" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark shipped", exact: true })).toHaveCount(0);
  await page.evaluate(() => window.prFixture.update("merged"));
  await page.getByRole("button", { name: "Mark shipped", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Has this fix reached users?" })).toBeVisible();
  assert.equal(await page.evaluate(() => window.prFixture.calls.some(call => call.route.endsWith("/shipped"))), false);
  await page.getByRole("dialog").getByRole("button", { name: "Mark shipped", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  assert.equal(await page.evaluate(() => window.prFixture.calls.filter(call => call.route.endsWith("/shipped")).length), 1);
  await page.evaluate(() => { window.prFixture.data.connection = null; window.prFixture.data.runs = []; window.dispatchEvent(new Event('fixture')); });
  await expect(page.getByRole("heading", { name: "1. Allow repository access" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "GitHub repository" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Assess this issue" })).toHaveCount(0);
  await page.screenshot({ path: path.join(output, "setup-390.png"), fullPage: true });
  await page.getByRole("button", { name: "Already installed? Continue" }).click();
  await expect(page.getByRole("heading", { name: "2. Connect your repository" })).toBeVisible();
  await page.getByRole("textbox", { name: "GitHub repository" }).fill("https://github.com/owner/repository");
  await expect(page.getByRole("button", { name: "Connect repository", exact: true })).toBeEnabled();
  await expect(page.getByRole("textbox", { name: "Required CI check" })).toHaveCount(0);
  await page.evaluate(() => { window.prFixture.data.connection = { repository: 'owner/repository', defaultBranch: 'main', requiredCheck: '', connectedAt: '2026-11-09T12:00:00Z' }; window.dispatchEvent(new Event('fixture')); });
  await expect(page.getByRole("heading", { name: "3. Choose the test check" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish setup" })).toBeDisabled();
  await page.getByRole("combobox", { name: "Test check", exact: true }).click();
  await page.getByRole("option", { name: "tests", exact: true }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByRole("button", { name: "Assess this issue" })).toBeVisible();
  await page.goto(pathToFileURL(html).toString() + "?github=expired");
  await expect(page.getByRole("alert")).toContainText("get a fresh link");
  await expect(page.getByRole("textbox", { name: "GitHub repository" })).toHaveValue("owner/repository");
  await expect(page.getByRole("button", { name: "Connect repository", exact: true })).toBeEnabled();
  assert.deepEqual(errors, []);
  console.log(`PR workspace: guided setup, check selection, expired-link recovery, assessment, context, attempt, release confirmation and responsive checks passed. Screenshots: ${output}`);
} finally { await browser.close(); }
