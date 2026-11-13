// Manual QA: node frontend/scripts/check-fonts.mjs <dist> <output-directory>
// Uses request interception, so no server or application/backend data is needed.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(root + '/frontend/package.json');
const {build} = require('esbuild');
const {chromium} = createRequire(root + '/unified-sdk/package.json')('@playwright/test');
const [distArg, outputArg] = process.argv.slice(2);
assert.ok(distArg && outputArg, 'Pass the built dist directory and screenshot output directory');
const dist = path.resolve(distArg), output = path.resolve(outputArg);
mkdirSync(output, {recursive:true});
const css = readdirSync(dist + '/assets').filter(f => f.endsWith('.css')).map(f => readFileSync(dist + '/assets/' + f, 'utf8')).join('\n');
const preload = (readFileSync(dist + '/index.html', 'utf8').match(/<link\b[^>]*rel="preload"[^>]*>/g) || []).join('\n');
const source = `import React from 'react';import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';import {ThemeProvider} from 'next-themes';
import {FluidRoot} from './src/components/fluid-root';
import ProjectFormPreview from './src/components/projects/ProjectFormPreview';
import CodeBlock from './src/components/shared/CodeBlock';
import {InputCopy} from './src/components/ui/input-copy';
import {fontWeights} from './src/lib/font-weight';
const kind=location.pathname.split('/').pop();
const accent=kind==='accents';const cjk=kind==='cjk';const glyphs=kind==='glyphs';
const text=accent?'Crème brûlée — Łódź, São Tomé, Ādam, naïve façade.':cjk?'Feedback 中文 日本語 한국어 — unchanged system fonts.':'Review your feedback — “ready”, it’s working…';
createRoot(document.getElementById('root')).render(<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><FluidRoot><BrowserRouter><main style={{padding:32,maxWidth:1100}}>
<h1 className="text-4xl">{text}</h1><p className="mt-5">{text} <em>Italic <strong>and bold inside italics</strong></em></p>
<p className="mt-3" style={{fontVariationSettings:fontWeights.semibold}}>Component override: 550 weight, 18 optical size. 0123456789</p>
<InputCopy value={text} label="Component copy field"/>
<div className="mt-5"><CodeBlock code={'const response = { status: "ready", score: 8 };'} language="javascript"/></div>
<p className="tabular-nums mt-3">Tabular numbers: 0123456789 111 888</p>
<p lang="en" style={{hyphens:'auto',width:95}}>Internationalization representation extraordinary</p>
{kind==='component'&&<ProjectFormPreview name="Your feedback form" fields={[{id:'name',type:'text',label:'Your name'}]} appearance={{font:'Inter'}} disabled/>}
{glyphs&&['Geist Variable','Inter Variable','Geist Serif'].map(font=><section key={font} style={{fontFamily:font}}>{[400,500,550,600,700].map(weight=><div key={weight} style={{fontWeight:weight,fontSize:17,lineHeight:1.6}}><span>{font} {weight}: </span>{Array.from({length:352},(_,i)=>i+32).filter(c=>c<127||c>=160).map(c=>String.fromCodePoint(c)).join('')} ‐‑–—‘’“”…</div>)}</section>)}
</main></BrowserRouter></FluidRoot></ThemeProvider>);`;
const bundle = await build({stdin:{contents:source,resolveDir:root+'/frontend',loader:'jsx'},bundle:true,nodePaths:[root+'/frontend/node_modules'],write:false,jsx:'automatic',platform:'browser',format:'iife',loader:{'.css':'empty'},alias:{'@':root+'/frontend/src'},define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const browser = await chromium.launch({headless:true});
const results = [];
try {
 for (const routeName of ['/', '/docs', '/login', '/signup', '/font-check/code', '/font-check/accents', '/font-check/component', '/font-check/cjk', '/font-check/glyphs'].filter(r=>!process.argv[4]||r.includes(process.argv[4]))) {
  for (const width of [1440,390]) {
   const context = await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
   const page = await context.newPage();
   const requests = [];const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Keep optional form-font CSS and binaries identical between runs, including network failures.
   const externalDir = path.join(path.dirname(output), 'font-external-cache');mkdirSync(externalDir,{recursive:true});
   await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.host !== 'font-check.test') {
     if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
      const cache = path.join(externalDir, Buffer.from(url.href).toString('base64url'));
      if (!existsSync(cache)) {
       try {const response=await route.fetch();writeFileSync(cache,JSON.stringify({status:response.status(),headers:response.headers(),body:(await response.body()).toString('base64')}));}
       catch {writeFileSync(cache,JSON.stringify({status:503,headers:{},body:''}));}
      }
      const saved=JSON.parse(readFileSync(cache));return route.fulfill({status:saved.status,headers:saved.headers,body:Buffer.from(saved.body,'base64')});
     }
     return route.abort();
    }
    const file = path.join(dist, decodeURIComponent(url.pathname));
    if (existsSync(file) && !url.pathname.endsWith('/')) return route.fulfill({path:file});
    if (url.pathname.startsWith('/font-check/')) return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+preload+'<style>'+css+'</style></head><body><div id="root"></div><script>'+bundle.outputFiles[0].text.replaceAll('</script>','<\\/script>')+'</script></body></html>'});
    return route.fulfill({path:dist+'/index.html'});
   });
   page.on('response',response=>{if(/\.(woff2?|ttf)(\?|$)/.test(response.url()))requests.push(response.url())});
   await page.goto('http://font-check.test'+routeName);
   await page.waitForLoadState('networkidle');
   assert.deepEqual(errors,[],routeName);
   assert.ok((await page.locator('body').innerText()).length>30,'Page rendered: '+routeName);
   await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('svg').forEach(s=>s.pauseAnimations?.());});
   // Freeze all animations at the same first frame, including JS-driven decoration.
   await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   const name=(routeName==='/'?'landing':routeName.replaceAll('/','_').slice(1))+'-'+width;
   await page.screenshot({path:output+'/'+name+'.png',fullPage:true,animations:'disabled'});
   const data=await page.evaluate(()=>({title:document.title,text:document.body.innerText,preloads:[...document.querySelectorAll('link[rel="preload"][as="font"]')].map(el=>el.getAttribute('href')),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight,range:f.unicodeRange})),glyphMetrics:[...document.querySelectorAll('main>section>div')].map(e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);const result=[];while(w.nextNode()){const t=w.currentNode;for(let i=0;i<t.length;i++){const r=new Range();r.setStart(t,i);r.setEnd(t,i+1);const b=r.getBoundingClientRect();result.push([t.textContent.charCodeAt(i),b.x,b.y,b.width])}}return result}),sizes:[...document.querySelectorAll('h1,h2,h3,p,button')].map(e=>({text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
   let platformFonts=[];
   if(routeName.endsWith('/cjk')){const client=await context.newCDPSession(page);await client.send('DOM.enable');await client.send('CSS.enable');const doc=await client.send('DOM.getDocument');const node=await client.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'h1'});platformFonts=(await client.send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId})).fonts;await client.detach();assert.ok(platformFonts.some(f=>!f.isCustomFont),'CJK uses system fonts');}
   const fonts=[];
   for(const url of [...new Set(requests)]) {
    const u=new URL(url), local=path.join(dist,decodeURIComponent(u.pathname));
    let bytes;
    if(u.host==='font-check.test')bytes=readFileSync(local).length;
    else {const cache=path.join(externalDir,Buffer.from(url).toString('base64url'));bytes=Buffer.from(JSON.parse(readFileSync(cache)).body,'base64').length;}
    fonts.push({url:u.host==='font-check.test'?u.pathname:url,bytes});
   }
   assert.equal(requests.length,new Set(requests).size,'No duplicate font downloads');
   if(preload){const extended=fonts.filter(f=>f.url.endsWith('-extended.woff2'));if(!routeName.endsWith('/accents')&&!routeName.endsWith('/glyphs'))assert.equal(extended.length,0,'Core-only page '+name);if(routeName.endsWith('/accents'))assert.ok(extended.some(f=>f.url.endsWith('geist-extended.woff2')),'Accent loads extended font');}
   results.push({platformFonts,name,route:routeName,width,bytes:fonts.reduce((n,f)=>n+f.bytes,0),requests:fonts,...data});
   await context.close();
  }
 }
 writeFileSync(output+'/pages.json',JSON.stringify({browser:browser.version(),pages:results},null,2)+'\n');
 console.log('Font measurements and screenshots: '+output);
} finally {await browser.close()}
