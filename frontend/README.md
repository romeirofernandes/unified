# working on the frontend

the pages live in `src/pages`. keep them focused on loading data and composing sections - shared controls and larger sections belong in `src/components`.

## finding things

- `src/App.jsx`: routes, lazy loading, and protected pages.
- `src/components/auth`: the shared login and signup form.
- `src/components/dashboard`: workspace shell, project cards, creation dialog, and integration preview.
- `src/components/projects`: field editor and widget preview fields.
- `src/components/feedback`: responses and generated summaries.
- `src/components/settings`: account deletion confirmation.
- `src/components/docs`: the shared public and workspace quickstart.
- `src/components/shared`: brand, page headers, form fields, code blocks, and loading/error/empty states.
- `src/hooks`: session access, cancellable API loading, and summary state.
- `src/lib`: API requests, authentication sync, field validation, and integration snippets.
- `src/components/ui`: installed Fluid Functionalism / shadcn primitives.
- `src/index.css`: Tailwind entry point, shared theme tokens, and registry utilities.

use Tailwind utilities in components. keep colors on the shared theme tokens so light and dark modes stay together. the SDK preview deliberately uses the project's widget theme, which can differ from the workspace theme.

## adding a component

read `.agents/skills/fluid-functionalism/SKILL.md` and run its stack script first. this project uses the Base UI flavor. compose existing primitives before installing another one, and check for local changes before overwriting anything.

put product-specific behavior in a wrapper. the installed Card has a small Vite adaptation: links use React Router instead of Next.js. preserve that when updating it.

## requests and authentication

`apiRequest` handles the API base URL, identity header, JSON payloads, HTTP errors, and request timeouts. `useApiResource` cancels stale requests when the route or user changes. request errors stay visible and offer a retry.

project lists include `feedbackCount` from the backend. don't fetch every project's full response list just to show a count.

Firebase owns the session. backend synchronization is deduplicated per user and falls back to the Firebase session during a backend outage.

## local checks

run these from `frontend/`:

```sh
npm run dev
npm test
npm run lint
npm run build
```

tests cover request failures, form payload validation, summary parsing/storage, and rendering the routes with fixture data. route rendering tests use esbuild through Vite's installed toolchain. they don't exercise Firebase, MongoDB, Google sign-in, or a live Gemini request.

run `npm test` in `backend/` for the route tests. those use model doubles to check ownership boundaries, counts, and cleanup order without touching a database.

## environment

the Firebase and backend variables are listed in the root README. summaries use the existing `VITE_GEMINI_API_KEY` setting. `VITE_GEMINI_MODEL` optionally overrides the default `gemini-3.5-flash-lite` model.

summary storage is scoped by Firebase UID and project ID. broken or blocked local storage won't stop the page from loading.
