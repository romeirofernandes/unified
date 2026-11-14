import { build } from 'esbuild';
import { loadEnv } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pageMetadata, siteUrl } from '../src/lib/seo.js';

// Bundle the same documentation data used by the UI, including the configured API origin.
const bundled = await build({ entryPoints: ['src/lib/documentation.js'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env': JSON.stringify({ VITE_BACKEND_URL: loadEnv("production", process.cwd(), "VITE_").VITE_BACKEND_URL }) } });
const { steps, documentationMarkdown } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const escape = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const template = await readFile('dist/index.html', 'utf8');
for (const path of ['/', '/docs', '/login', '/signup']) {
  const page = pageMetadata(path);
  const head = `<title>${escape(page.title)}</title>
    <meta name="description" content="${escape(page.description)}" />
    <meta name="robots" content="${page.robots}" />
    <link rel="canonical" href="${page.url}" />
    <link rel="alternate" type="text/markdown" href="${siteUrl}/docs.md" title="Unified documentation" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Unified" />
    <meta property="og:title" content="${escape(page.title)}" />
    <meta property="og:description" content="${escape(page.description)}" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:image" content="${siteUrl}/images/unified-social.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Unified — Make customer feedback part of your next release." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(page.title)}" />
    <meta name="twitter:description" content="${escape(page.description)}" />
    <meta name="twitter:image" content="${siteUrl}/images/unified-social.png" />
    <meta name="twitter:image:alt" content="Unified — Make customer feedback part of your next release." />`;
  const content = path === '/docs' ? `<main><h1>Unified documentation</h1>${steps.map(step => `<section id="${step.id}"><h2>${escape(step.title)}</h2><p>${escape(step.description)}</p>${step.items ? `<ul>${step.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}${step.code ? `<pre><code>${escape(step.code)}</code></pre>` : ''}</section>`).join('')}<a href="/docs.md">Read the complete setup commands and documentation</a></main>` : path === '/' ? '<main><h1>Make customer feedback part of your next release.</h1><p>Collect useful feedback inside your React app, see what customers keep asking for, and decide what to build next.</p><a href="/docs">Read the documentation</a><a href="/signup">Create an account</a></main>' : '';
  const html = template.replace(/<title>.*?<\/title>/s, head).replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  const directory = path === '/' ? 'dist' : `dist${path}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html);
}
await writeFile('dist/docs.md', documentationMarkdown);
await writeFile('dist/llms.txt', `# Unified\n\n> Unified collects customer feedback in React apps and helps teams review responses, AI summaries, workbench issues, and feedback digests.\n\n## Documentation\n\n- [Setup and usage](${siteUrl}/docs.md): Full SDK setup commands, widget options, custom form API, troubleshooting, workbench, and notifications.\n- [Documentation page](${siteUrl}/docs): Human-readable setup guide.\n\n## Project sources\n\n- [SDK README](https://github.com/romeirofernandes/unified/blob/main/unified-sdk/README.md): React SDK usage and CLI options.\n- [SDK types](https://github.com/romeirofernandes/unified/blob/main/unified-sdk/types/index.d.ts): Supported widget props.\n\n## Integration notes\n\nUse the SDK version and commands in the documentation. projectId is public configuration. apiUrl must point to the deployed backend in production. Keep custom-form submission keys on the server; never put owner credentials in client code.\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/docs</loc></url></urlset>\n`);
