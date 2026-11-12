import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');const req=createRequire(root+'/frontend/package.json');const{build}=req('esbuild');const{chromium,expect}=createRequire(root+'/unified-sdk/package.json')('@playwright/test');
const source=`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route}from'react-router-dom';import{ThemeProvider}from'next-themes';import{FluidRoot}from'./src/components/fluid-root';import Landing from './src/pages/Landing';import FeedbackList from './src/components/feedback/FeedbackList';import SummaryCard from './src/components/feedback/SummaryCard';
const issues=[{_id:'search',title:'Search older responses',status:'todo'},{_id:'radio',title:'Show the selected radio option',status:'done'}];const fields=[{_id:'email',type:'email',label:'Email'},{_id:'message',type:'textarea',label:'What could we improve?'},{_id:'rating',type:'slider',label:'Overall experience'}];const responses=[{_id:'r1',projectId:'p1',timestamp:'2026-11-12T10:00:00Z',formAnswers:{email:'ava@acme.example',message:'I remember someone mentioning exports, but I cannot find their message. Could we search by a word or email?',rating:8},issues:[issues[0]]},{_id:'r2',projectId:'p1',timestamp:'2026-11-11T10:00:00Z',formAnswers:{email:'sam@acme.example',message:'The choices do get selected but there is no dot to tell me which one I picked.',rating:6},issues:[issues[1]]},{_id:'r3',projectId:'p1',timestamp:'2026-11-10T10:00:00Z',formAnswers:{email:'jordan@acme.example',message:'Please let me search older feedback by email.',rating:9},issues:[issues[0]]}];function Responses(){return <main className="min-h-screen bg-background text-foreground p-6 sm:p-10"><div className="mx-auto max-w-[1300px] space-y-7"><h1 className="text-3xl">Acme website</h1><SummaryCard summary={{tldr:'Two customers want to search older feedback. The invisible radio selection is fixed.',features:issues.map(i=>i.title),evidence:issues.map(i=>({title:i.title,issueId:i._id}))}} issues={issues} projectId="p1"/><FeedbackList responses={responses} fields={fields} issues={issues}/></div></main>}
createRoot(document.getElementById('root')).render(<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><FluidRoot><BrowserRouter><Routes><Route path="/responses" element={<Responses/>}/><Route path="/" element={<Landing/>}/></Routes></BrowserRouter></FluidRoot></ThemeProvider>);`;
const built=await build({stdin:{contents:source,resolveDir:root+'/frontend',loader:'jsx'},bundle:true,write:false,jsx:'automatic',platform:'browser',format:'iife',loader:{'.css':'empty'},alias:{'@':root+'/frontend/src'},define:{'process.env.NODE_ENV':'"test"','import.meta.env':'{}'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/^@\/hooks\/use-auth$/},()=>({path:'auth',namespace:'auth'}));b.onLoad({filter:/.*/,namespace:'auth'},()=>({contents:'export function useAuth(){return {user:null}}',loader:'js'}));b.onResolve({filter:/\.svg\?raw$/},args=>({path:path.resolve(args.resolveDir,args.path.replace('?raw','')),namespace:'raw-svg'}));b.onLoad({filter:/.*/,namespace:'raw-svg'},args=>({contents:readFileSync(args.path,'utf8'),loader:'text'}));}}]});
const css=readdirSync(root+'/frontend/dist/assets').filter(f=>f.endsWith('.css')).map(f=>readFileSync(root+'/frontend/dist/assets/'+f,'utf8')).join('\n');
const dir=mkdtempSync(path.join(tmpdir(),'unified-selected-ui-'));
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://prototype.test/**',async route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/logos/'))return route.fulfill({path:root+'/frontend/public'+url.pathname});if(url.pathname.startsWith('/assets/'))return route.fulfill({path:root+'/frontend/dist'+url.pathname});return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${built.outputFiles[0].text.replaceAll('</script>','<\\/script>')}</script></body></html>`});});
try{
 await page.goto('http://prototype.test/responses');await page.getByRole('heading',{name:'Follow the issue'}).waitFor();await expect(page.getByRole('heading',{name:'Feedback summary',exact:true})).toBeVisible();await expect(page.locator('article')).toHaveCount(3);
 await page.getByRole('button',{name:/Search older responses 2/}).click();await expect(page.locator('article')).toHaveCount(2);
 await expect(page.locator('article').first().getByRole('link',{name:'Search older responses'})).toHaveAttribute('href','/dashboard/workbench?project=p1&issue=search');
 await page.getByRole('searchbox').fill('jordan');await expect(page.locator('article')).toHaveCount(1);await page.getByRole('searchbox').fill('');await page.getByRole('button',{name:/All responses/}).click();
 await page.screenshot({path:dir+'/responses-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/Show the selected radio option 1 Completed/}).click();await expect(page.locator('article')).toHaveCount(1);await expect(page.locator('article a').first()).toHaveClass(/text-muted-foreground/);
 for(const width of [1440,1024,768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'response overflow '+width)}await page.screenshot({path:dir+'/responses-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://prototype.test/');await page.locator('#capabilities').scrollIntoViewIfNeeded();await expect(page.locator('.feedback-cycle-step')).toHaveCount(4);await expect(page.getByText('Fewer duplicate cards. More useful context.')).toHaveCount(0);
 const button=page.getByRole('button',{name:'Play animation: Give the issue a place'});await button.hover();await expect(button.locator('.isometric-figure')).toHaveAttribute('data-playing','true');const first=await button.locator('.iso-moving-card').evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(700);const second=await button.locator('.iso-moving-card').evaluate(el=>getComputedStyle(el).transform);assert.notEqual(first,second,'Kanban card actually moves on hover');await page.locator('#feedback-loop-title').hover();await expect(button.locator('.isometric-figure')).not.toHaveAttribute('data-playing');
 const devices=page.getByRole('button',{name:'Play animation: Prepare a fix for review'});await devices.hover();await expect(devices.locator('.iso-writing')).toHaveCount(11);const phone=devices.locator('.iso-writing').nth(7);const phoneBefore=await phone.evaluate(el=>getComputedStyle(el).strokeDashoffset);await page.waitForTimeout(700);assert.notEqual(await phone.evaluate(el=>getComputedStyle(el).strokeDashoffset),phoneBefore,'phone lines animate with the laptop on step three');
 await expect(page.locator('.feedback-cycle-arrow path').first()).toHaveAttribute('stroke-dasharray','5 5');
 await page.screenshot({path:dir+'/loop-desktop.png',fullPage:true});
 for(const width of [1024,768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'loop overflow '+width)}await page.screenshot({path:dir+'/loop-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://prototype.test/');await page.locator('#digest-section').scrollIntoViewIfNeeded();
 const backgrounds=await page.evaluate(()=>[getComputedStyle(document.querySelector('.dispatch-digest')).backgroundColor,getComputedStyle(document.querySelector('[aria-labelledby="landing-cta-title"]')).backgroundColor]);assert.notEqual(backgrounds[0],backgrounds[1],'light CTA has a distinct surface from the digest');
 await expect(page.locator('.dispatch-route')).toHaveAttribute('stroke-dasharray','5 5');
 await expect(page.locator('.dispatch-drawing')).toHaveAttribute('data-playing','true');
 await expect(page.locator('.dispatch-destinations')).toContainText('Your inbox');await expect(page.locator('.dispatch-destinations')).toContainText('Your channel');
 await expect(page.getByText('Hover, focus or tap a drawing to play.')).toHaveCount(0);await expect(page.locator('.proto-picker')).toHaveCount(0);
 await expect(page.locator('.dispatch-motion-toggle')).toHaveCount(0);await expect(page.locator('.dispatch-destination-badge')).toHaveCount(2);
 await page.locator('.dispatch-drawing').evaluate(svg=>svg.pauseAnimations());
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:1000});
  await expect(page.locator('.dispatch-drawing')).toHaveAttribute('viewBox',width<=700?'0 0 360 600':'0 0 640 470');
  for(const time of [1.5,3,5,6.5]){
   const distance=await page.locator('.dispatch-drawing').evaluate(async(svg,time)=>{
    svg.setCurrentTime(time);await new Promise(requestAnimationFrame);
    const route=svg.querySelector('.dispatch-route');const note=svg.querySelector('.dispatch-message');
    const expected=route.getPointAtLength(route.getTotalLength()*((time-.96)/6.08));
    const local=svg.createSVGPoint().matrixTransform(note.getCTM()).matrixTransform(svg.getCTM().inverse());
    return Math.hypot(local.x-expected.x,local.y-expected.y);
   },time);
   assert.ok(distance<.5,'message follows the exact dotted path at '+width+'px and '+time+'s: '+distance);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'dispatch overflow '+width);
  if(width===390){
   const tops=await page.locator('.feedback-cycle-step').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));assert.ok(tops.every((top,index)=>index===0||top>tops[index-1]),'phone stages stay vertical and in process order');
   await expect(page.locator('.feedback-mobile-arrow').first()).toBeVisible();
  }
  await page.locator('#digest-section').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/dispatch-'+width+'.png',fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.locator('#digest-section').scrollIntoViewIfNeeded();await page.locator('.dispatch-drawing').evaluate(svg=>svg.unpauseAnimations());await expect(page.locator('.dispatch-drawing')).toHaveAttribute('data-playing','true');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.dispatch-drawing')).toHaveAttribute('data-playing','false');await expect(page.getByRole('button',{name:'Pause digest animation'})).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Switch to dark theme'}).click();await page.waitForTimeout(1200);await page.screenshot({path:dir+'/dispatch-dark.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Evidence response links, hover motion, exact SVG-path travel, phone line motion and ordering, reduced motion and responsive checks passed. Screenshots: '+dir);
}finally{await browser.close()}
