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
const run = {_id:'run-1',projectId:'project-1',issueId:'issue-1',issue:{title:issue.title,description:issue.description},acceptance:'The editor button must read Save changes.',repository:'owner/repository',baseBranch:'main',baseSha:'a'.repeat(40),requiredCheck:'',model:'fixture',prNumber:1,notification:{status:'pending',total:2,sent:0,pending:2,message:'2 shipping emails are queued for delivery.'},status:'eligible',active:false,createdAt:'2026-11-09T10:00:00Z',message:'This is a small label correction in an existing component.',assessment:{suitable:true,reason:'The label is present in the selected editor component.',plan:['Change the existing save label without changing submission behavior.']},files:[{path:'frontend/src/components/Editor.tsx',sha:'b'.repeat(40),size:1240}],patch:[{path:'frontend/src/components/Editor.tsx',before:'<button>Save</button>',after:'<button>Save changes</button>'}],events:[{at:'2026-11-09T10:00:00Z',status:'eligible',message:'Assessment complete.'},{at:'2026-11-09T10:01:00Z',status:'generating',stage:'patch',message:'Patch replacement validated.'}]};
const data = {configured:true,installUrl:'https://github.com/apps/unified-test/installations/new',repositories:[{repositoryId:1,repository:'owner/repository'},{repositoryId:2,repository:'owner/second'}],connection:{repository:'owner/repository',defaultBranch:'main',connectedAt:'2026-11-09T09:00:00Z'},runs:[]};
window.prFixture = {run,data,calls:[],update(status){run.status=status; run.prUrl='https://github.com/owner/repository/pull/1'; run.branch='unified/fix-run-1'; data.runs=[{...run}]; window.dispatchEvent(new Event('fixture'));}};
export function useAuth(){return {user:{uid:'user-1',email:'owner@example.com',displayName:'Project owner'},loading:false,logout(){}};}
export function useApiResource(route){
 const [,redraw]=useState(0); const reload=useCallback(()=>redraw(n=>n+1),[]);
 useEffect(()=>{window.addEventListener('fixture',reload);return()=>window.removeEventListener('fixture',reload);},[reload]);
 return {data: route==='/projects'?[project]:route.startsWith('/workbench/')?[issue]:route.includes('/runs/')?{...run}: {...data,runs:[...data.runs]},loading:false,error:'',reload,setData(){}};
}
export async function apiRequest(route,options){
 window.prFixture.calls.push({route,...options});
 if(route.endsWith('/runs')){data.runs=[{...run}];window.dispatchEvent(new Event('fixture'));return {_id:run._id};}
 if(route.endsWith('/connection/repository')){const repo=data.repositories.find(item=>item.repositoryId===options.body.repositoryId);data.connection={repository:repo.repository,defaultBranch:'main',connectedAt:new Date().toISOString()};window.dispatchEvent(new Event('fixture'));}
 if(options.method==='DELETE'){data.connection=null;window.dispatchEvent(new Event('fixture'));}
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
  builder.onLoad({ filter: /[\/]FixPipeline\.jsx$/ }, args => ({ contents: readFileSync(args.path, "utf8").replace('export default function FixPipeline({ run, selectedStage, onSelect }) {', 'export default function FixPipeline({ run, selectedStage, onSelect }) { window.pipelineRenders = (window.pipelineRenders || 0) + 1;'), loader: "jsx", resolveDir: path.dirname(args.path) }));
  builder.onResolve({ filter: /^(?:@\/hooks\/(?:use-auth|use-api-resource|use-workspace-background)|@\/lib\/(?:api|access-token)|next-themes)$/ }, () => ({ path: "fixture", namespace: "fixture" }));
  builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: fixture, loader: "jsx", resolveDir: path.join(root, "frontend") }));
} }] });
const cssPath = readdirSync(path.join(root, "frontend/dist/assets")).find(name => /^index-.*\.css$/.test(name));
const css = readFileSync(path.join(root, "frontend/dist/assets", cssPath), "utf8") + readFileSync(path.join(root, "frontend/node_modules/@xyflow/react/dist/style.css"), "utf8") + readFileSync(path.join(root, "frontend/src/components/pull-requests/fix-pipeline.css"), "utf8");
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
  await page.getByRole("textbox", { name: "Expected result" }).fill("The editor button must read Save changes and preserve its current submit behavior.");
  await assess.click();
  await expect(page.getByRole("button", { name: "Start fix", exact: true })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  assert.match(await page.locator('.fix-pipeline .react-flow').evaluate(node => getComputedStyle(node).backgroundImage), /repeating-linear-gradient/);
  const movable = page.locator('.react-flow__node[data-id="patch"]');
  await page.waitForTimeout(100);
  const renderCount = await page.evaluate(() => window.pipelineRenders);
  const beforeDrag = await movable.boundingBox();
  await page.mouse.move(beforeDrag.x + 100, beforeDrag.y + 60);
  await page.mouse.down();
  await page.mouse.move(beforeDrag.x + 150, beforeDrag.y + 90, {steps:10});
  await page.mouse.up();
  assert.ok((await movable.boundingBox()).x > beforeDrag.x + 30, 'Pipeline nodes can be moved');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.equal(await page.evaluate(() => window.pipelineRenders), renderCount, 'Dragging does not rerender the whole pipeline');
  const afterDrag = await movable.boundingBox();
  await page.evaluate(() => window.dispatchEvent(new Event('fixture')));
  await page.waitForTimeout(100);
  assert.ok(Math.abs((await movable.boundingBox()).x - afterDrag.x) < 2, 'Polling preserves moved node positions');
  await page.waitForTimeout(100);
  await page.locator('.react-flow__node[data-id="scope"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Assess scope" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("frontend/src/components/Editor.tsx");
  await expect(page.getByRole("list", {name:"Execution trace"})).toContainText("Assessment complete.");
  await expect(page.getByRole("list", {name:"Execution trace"})).not.toContainText("Patch replacement validated.");
  await expect(page.getByRole('region', {name:'Run history'})).toHaveCount(0);
  await expect(page.locator('.fix-node.state-complete').getByText('Complete',{exact:true})).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator('.react-flow__node[data-id="patch"]').click();
  await expect(page.getByRole('dialog')).toContainText('Patch replacement validated.');
  await expect(page.getByRole('dialog')).not.toContainText('Assessment complete.');
  await expect(page.getByRole('button',{name:'Diff',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Code',exact:true}).click();
  await expect(page.getByRole('button',{name:'Copy',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(120);
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.ok((await page.locator(".fix-node").first().boundingBox()).width >= 220, `Nodes remain readable at ${width}px`);
    await page.screenshot({ path: path.join(output, `dark-${width}.png`), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No page overflow at ${width}px`);
    const backgrounds = await page.locator('.fix-node').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
    assert.ok(backgrounds.every(color => !color.includes('rgba') && color !== 'transparent'), 'Pipeline nodes have opaque surfaces');
  }
  await page.emulateMedia({colorScheme:"dark"});
  await page.evaluate(() => { document.documentElement.classList.remove("dark"); window.dispatchEvent(new Event("fixture-theme")); });
  await page.waitForTimeout(100);
  await expect(page.locator(".react-flow")).toHaveClass(/light/);
  assert.notEqual(await page.locator(".fix-node").first().evaluate(node => getComputedStyle(node).backgroundColor), "rgb(23, 23, 23)");
  await page.screenshot({ path: path.join(output, "light-390.png"), fullPage: true });
  await page.getByRole("button", { name: "Start fix", exact: true }).click();
  await expect(page.getByRole("link", { name: "PR #1", exact: true })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="pr"] a')).toHaveAttribute('href', 'https://github.com/owner/repository/pull/1');
  await expect(page.getByRole("button", { name: "Mark shipped", exact: true })).toHaveCount(0);
  await page.evaluate(() => { window.prFixture.run.failedStage='review'; window.prFixture.run.message='Build failed: missing export.'; window.prFixture.update('needs_attention'); });
  await expect(page.locator('.react-flow__node[data-id="review"] .state-failed')).toHaveCount(1);
  await page.getByRole("button", { name: "View details", exact: true }).click();
  await expect(page.getByRole("button", {name:'Step details',exact:true})).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText('Build failed: missing export.');
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => window.prFixture.update("merged"));
  await page.getByRole("button", { name: "Mark shipped", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Has this fix reached users?" })).toBeVisible();
  assert.equal(await page.evaluate(() => window.prFixture.calls.some(call => call.route.endsWith("/shipped"))), false);
  await page.getByRole("dialog").getByRole("button", { name: "Mark shipped", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  assert.equal(await page.evaluate(() => window.prFixture.calls.filter(call => call.route.endsWith("/shipped")).length), 1);
  await page.locator('.react-flow__node[data-id="notify"]').click();
  await expect(page.getByRole("dialog")).toContainText('2 shipping emails are queued');
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => { window.prFixture.data.connection = null; window.prFixture.data.runs = []; window.dispatchEvent(new Event('fixture')); });
  await expect(page.getByRole("button", { name: "Assess this issue" })).toHaveCount(0);
  await page.getByRole('combobox', {name:'Repository for this project'}).click();
  await page.getByRole('option', {name:'owner/second',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  const repoBox = await page.getByRole('combobox', {name:'Repository for this project'}).boundingBox();
  const buttonBox = await page.getByRole('button', {name:'Use repository',exact:true}).boundingBox();
  assert.ok(Math.abs(repoBox.y - buttonBox.y) < 2, 'Repository button aligns with its dropdown');
  await page.getByRole('button', {name:'Use repository',exact:true}).click();
  await expect(page.getByRole("button", { name: "Assess this issue" })).toBeVisible();
  await expect(page.getByRole('button', {name:'Disconnect',exact:true})).toHaveClass(/from-/);
  await page.getByRole('button', {name:'Disconnect',exact:true}).click();
  await expect(page.getByRole('dialog', {name:'Disconnect this project?'})).toBeVisible();
  await page.getByRole('dialog').getByRole('button', {name:'Cancel',exact:true}).click();
  await page.goto(pathToFileURL(html).toString() + "?github=expired");
  await expect(page.getByRole("alert")).toContainText("Refresh repositories");
  await expect(page.getByRole('button', {name:'Refresh repositories',exact:true})).toBeEnabled();
  assert.deepEqual(errors, []);
  console.log(`PR workspace: repository selection, React Flow nodes, failures, PR links, email progress, release confirmation and responsive checks passed. Screenshots: ${output}`);
} finally { await browser.close(); }
