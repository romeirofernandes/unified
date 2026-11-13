// Build today's content with the original font declarations, without editing the checkout.
import config from '../vite.config.js';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const front = path.resolve(import.meta.dirname, '..');
const require = createRequire(front + '/package.json');
const {build} = await import(require.resolve('vite'));
const outDir = path.resolve(process.argv[2] || '/tmp/unified-font-baseline/dist');
const original = `@import "@fontsource-variable/inter/opsz.css";
@import "@fontsource-variable/geist";
@font-face {font-family:"Geist Serif";src:url("/fonts/GeistSerif-Regular.woff2") format("woff2");font-style:normal;font-weight:400;font-display:swap;}`;
await build({...config, configFile:false, root:front, build:{outDir,emptyOutDir:true}, plugins:[{
 name:'original-fonts-baseline',enforce:'pre',
 load(id) {
  if(id === front + '/src/index.css') return readFileSync(id,'utf8').replace('@import "./fonts.css";',original);
 },
 transformIndexHtml(html) {return html.replace(/\s*<link rel="preload"[^>]*>/g,'')},
 generateBundle() {this.emitFile({type:'asset',fileName:'fonts/GeistSerif-Regular.woff2',source:readFileSync(import.meta.dirname+'/font-sources/GeistSerif-Regular.woff2')})},
},...config.plugins]});
