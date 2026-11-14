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
await writeFile('dist/llms.txt', `# unified

> A feedback platform for React apps: collect responses, summarize requests, organize workbench issues, attempt focused fixes through draft GitHub PRs, and notify reporters after shipping.

## source of truth

- [Complete integration guide](${siteUrl}/docs.md): SDK commands, custom forms, widget behavior, troubleshooting and digests. The same guide is included below.
- [Human-readable documentation](${siteUrl}/docs)
- [Repository](https://github.com/romeirofernandes/unified): frontend dashboard, backend API, React SDK and shared form code.
- [SDK README](https://github.com/romeirofernandes/unified/blob/main/unified-sdk/README.md): setup CLI options and widget lifecycle.
- [SDK types](https://github.com/romeirofernandes/unified/blob/main/unified-sdk/types/index.d.ts): authoritative exported component props.
- [Integration operations](https://github.com/romeirofernandes/unified/blob/main/backend/INTEGRATIONS.md): server configuration for AI, digests and integrations.
- [Draft PR workflow](https://github.com/romeirofernandes/unified/blob/main/docs/pull-request-workflow.md): GitHub App setup, scope, recovery, review and shipping.

## system and access model

The dashboard manages projects, questions, appearance, responses, summaries, workbench issues, integrations and PR runs. Firebase authenticates owners. The Express API persists data in MongoDB, with a replica set required for transactions. Backend workers handle digests, shipping updates and PR jobs. Groq handles server-side AI and transcription. Optional integrations include Slack, email delivery, GitHub Apps and Razorpay payments.

The React SDK is a public widget, not an owner API client. GET /api/widget/:projectId returns public form configuration. POST /api/widget/:projectId accepts feedback. Never use authenticated owner /api/projects or /api/feedback routes as public widget endpoints. projectId is public configuration, not a credential. apiUrl is the backend origin, not the dashboard URL or an /api path, and defaults to http://localhost:8000 only for local development. Production requires a reachable HTTPS backend.

Custom forms submit from a server to POST /api/submissions/:projectId with Authorization: Bearer YOUR_SUBMISSION_KEY and a JSON formAnswers object keyed by question IDs. Submission keys allow submission only, not reading responses or editing projects. Keep them and all owner credentials out of browsers, public repositories and prompts. Replace or revoke a key in Preview to disable the previous one. Required answers must be present, with at least one nonempty answer. Success returns 201 with an id, invalid answers return 400 and invalid/revoked credentials return 401. Question recreation changes IDs and requires updating the integration.

## widget and form behavior

The SDK exports UnifiedFeedback and a stylesheet at unified-sdk/dist/unified-sdk.css. Import the stylesheet once. Next.js needs a client component for the widget. The widget uses Shadow DOM for style isolation. Explicit props override saved launcher settings. Supported props are projectId, apiUrl, theme, triggerStyle and position, see the types linked above. Theme auto follows the host and system, project uses the saved mode, light and dark force a mode. Launcher removal is persisted per API origin and project in local storage, clear site storage to restore it. Reduced motion uses fades.

Forms support text, email, textarea, choice, numeric slider and date answers. Use configured question IDs and choice values. String answers include text, email, choices and YYYY-MM-DD dates, sliders use numbers. Project creation supports manual questions and text or voice generation. Appearance settings control themes, colors and launchers. Widget and custom form responses feed the same dashboard and summaries.

## feedback to release

Review responses and generate summaries, then use Workbench to organize linked issues from To do through Done. Email answers are excluded from AI summaries. Slack and email digests can run hourly or daily, start with feedback received after enabling the channel, skip empty periods and unchanged summaries, and refresh summaries before sending. Test deliveries use sample content without consuming pending feedback.

A connected GitHub repository enables focused React UI or documentation fixes. Assessment reads files at an immutable base commit. The worker validates a bounded patch and publishes a branch and draft PR, then observes GitHub checks. Limits include at most 8 context files, 3 edited existing files and 120 changed lines. It does not execute customer code on the API server, add dependencies, create/delete/rename files, edit tests, or change backend, auth, payment, migration, infrastructure or workflow code. Model preflight is not a test result, absent CI means manual review. Humans review and merge. Publication recovery reconciles existing branches and drafts rather than blindly repeating publication.

Merging a PR does not send shipping notifications. After release, explicitly mark shipped and confirm to resolve the unchanged linked issue and process opted-in reporters. Closed unmerged PRs do not notify reporters. Reset responses deletes project responses, shipping opt-ins and AI summary, clears response links and invalidates pending summary/digest work, while keeping the project form, workbench issues, PR history and repository connection.

## repository navigation and configuration

frontend/src/lib/documentation.js supplies the human guide and /docs.md. frontend/scripts/build-seo.mjs generates this file, page metadata, robots.txt and sitemap.xml during npm run build. frontend/src/lib/seo.js controls route metadata. unified-sdk/types/index.d.ts defines widget props, unified-sdk/cli contains setup, and shared contains form field definitions, themes and launcher behavior. backend/routes exposes API boundaries, backend/services holds workers and integration logic, and backend/models holds persistence.

Use Node.js 20.19+ for setup and React 18 or 19 in consumer apps. From the repository root run npm run install:all, then npm run dev:backend and npm run dev:frontend in separate terminals. Configure MONGO_URI, Firebase identity and FRONTEND_URL on the backend, Firebase web app values and VITE_BACKEND_URL on the frontend. Groq keys and integration secrets are server-only, never VITE_ variables. The backend environment example lists optional integration settings. Root checks are npm test, npm run lint, npm run build and npm run test:consumer.

## complete setup and usage reference

${documentationMarkdown}
`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/docs</loc></url></urlset>\n`);
