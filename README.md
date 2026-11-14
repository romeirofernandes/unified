# (unified)

customer feedback, from the first response to the fix you ship.

(unified) gives you a React feedback widget and a workspace to read responses, find common requests, turn them into issues, and attempt small fixes through draft GitHub PRs. you can use your own form too - the SDK is optional.

## what you can do

- build project forms by hand or generate questions from text and voice
- style the widget with saved themes, colors, launcher options, and light or dark mode
- collect responses with the React SDK or a server-side custom form integration
- review AI summaries and organize related feedback in the workbench
- receive hourly or daily digests through Slack and email
- connect a GitHub repository, assess a focused issue, and review a generated draft PR
- notify opted-in reporters after you explicitly mark the work shipped

PR generation has limits. it targets small React UI and documentation changes, observes repository checks, and still needs human review. it does not run customer code on the API server or merge PRs for you.

## add it to your app

create a project in the [workspace](https://unified-chi.vercel.app/dashboard), configure its questions and appearance, then copy the project ID from Preview.

from your Vite or Next.js app:

```sh
npx unified-sdk@2.3.0 init --project YOUR_PROJECT_ID --api-url https://YOUR_BACKEND_HOST
```

add `--dry-run` to inspect the changes first. setup installs the SDK, imports its stylesheet, and mounts the widget. it supports Node.js 20.19+ and React 18 or 19.

or install it yourself:

```sh
npm install unified-sdk
```

```jsx
import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

export default function App() {
  return (
    <UnifiedFeedback
      projectId="YOUR_PROJECT_ID"
      apiUrl="https://YOUR_BACKEND_HOST"
      theme="auto"
    />
  );
}
```

for Next.js, put the widget in a client component. import the stylesheet once.

| prop | values | default |
| --- | --- | --- |
| `projectId` | public project ID from Preview | required |
| `apiUrl` | backend origin | `http://localhost:8000` |
| `theme` | `auto`, `project`, `light`, `dark` | `auto` |
| `triggerStyle` | `pill`, `rounded`, `icon`, `text`, `tab` | saved project setting |
| `position` | `bottom-left`, `bottom-right` | saved project setting |

`auto` follows the host app and system theme. `project` uses the saved project mode. explicit launcher and position props override project settings. dragging the launcher onto its delete target hides it across refreshes, clearing site storage restores it.

## bring your own form

create matching questions, then open **Preview → Custom form** to generate a submission key and copy the question IDs. send requests from your server:

```js
const response = await fetch(`${process.env.UNIFIED_API_URL}/api/submissions/${process.env.UNIFIED_PROJECT_ID}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.UNIFIED_SUBMISSION_KEY}`,
  },
  body: JSON.stringify({ formAnswers: { QUESTION_ID: "your answer" } }),
});
if (!response.ok) throw new Error("could not send feedback");
```

map answers to question IDs, not labels. submission keys stay on your server and grant write-only access to one project's responses. the public project ID is safe to embed in the widget, owner credentials are not.

## run the repository

this is three npm packages, with shared form code outside them:

```text
frontend/       React 19 dashboard, public site, documentation and SEO output
backend/        Express 5 API, MongoDB models, integrations and background workers
unified-sdk/    React widget, types, stylesheet, setup CLI and consumer checks
shared/         form fields, themes, fonts, controls and launcher configuration
docs/           feedback and draft PR workflow notes
```

use Node.js 20.19+ and a MongoDB replica set, including MongoDB Atlas. feedback deletion and workflow locks use transactions.

```sh
git clone https://github.com/romeirofernandes/unified.git
cd unified
npm run install:all
cp backend/.env.example backend/.env
```

set these in `backend/.env` alongside the optional integration settings from the example:

```dotenv
PORT=8000
MONGO_URI=mongodb://localhost:27017/unified?replicaSet=rs0
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-firebase-web-api-key
FRONTEND_URL=http://localhost:5173
```

create `frontend/.env` using your Firebase web app configuration:

```dotenv
VITE_BACKEND_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

configure Firebase authentication for your app and its allowed domains. keep Groq keys, email credentials, GitHub credentials, Slack secrets, payment secrets, and the integration encryption key in the backend environment. nothing prefixed `VITE_` is secret.

run these in separate terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

the defaults are API port 8000 and Vite port 5173. configure `GROQ_API_KEYS` for AI features. optional Slack, email, GitHub and payment features need their own credentials, the full app isn't a zero-configuration local demo.

## checks

```sh
npm test
npm run lint
npm run build
npm run test:consumer
```

`build` produces the dashboard and SDK. the frontend build also generates `/docs.md`, `/llms.txt`, static page metadata, robots.txt and the sitemap from source documentation.

## read more

- [documentation](https://unified-chi.vercel.app/docs) and [machine-readable guide](https://unified-chi.vercel.app/llms.txt)
- [SDK setup and behavior](unified-sdk/README.md)
- [widget prop types](unified-sdk/types/index.d.ts)
- [integration configuration](backend/INTEGRATIONS.md)
- [feedback workflow](docs/feedback-workflow-checkpoints.md)
- [draft PR setup, scope and recovery](docs/pull-request-workflow.md)

if something breaks, [open an issue](https://github.com/romeirofernandes/unified/issues) with the SDK version and what you expected to happen.
