# Unified SDK

A beautiful and customizable feedback component for React applications. Collect, analyze, and act on user feedback - all in one place.

## Features

- 🎯 One-line integration
- 🎨 Light and dark theme support
- corner feedback popup with reversible open and close motion
- 📝 Customizable form fields
- Public feedback submissions without exposing dashboard credentials
- 💫 Smooth animations
- 🎭 Elegant UI components

## automatic setup (2.2.1)

this CLI is included in this branch but 2.2.1 must be published to npm before the command below works publicly.

from your Vite or Next.js frontend directory:

```bash
npx unified-sdk@2.2.1 init --project YOUR_PROJECT_ID --api-url https://YOUR_BACKEND_HOST
```

get project ID from your project's **Preview & code** panel. omit the flags to enter them interactively. the project ID is public widget configuration, not an owner authentication credential.

setup checks package.json, React, and the app entry before it changes anything. it installs the SDK with your package manager, creates `components/unified-feedback-widget.jsx` (or `.tsx`), imports the stylesheet, and mounts the widget inside your existing app. Next.js layouts stay server components, the generated widget is a client component.

- `--dry-run` shows the files without writing or installing anything.
- `--api-url URL` selects your deployed Unified backend (default: localhost:8000).
- `--cwd ./frontend` selects an app in a monorepo.
- `--entry src/main.tsx` selects a custom entry.
- `--trigger-style icon` selects the launcher: `pill` (default), `icon`, `text`, or `tab`.
- `--theme light` or `--theme dark` overrides the saved project mode.
- `--skip-install` writes the integration but leaves installation to you.
- `--package-manager pnpm` overrides package manager detection.

running it again does not add a second widget. existing manual mounts and unmanaged files are left alone with an explanation. if installation fails, setup restores the files and lockfile it changed.

### try the unreleased CLI locally

build and pack this SDK first:

```bash
cd unified-sdk
npm run build
npm pack
```

then run it against your frontend (use absolute paths):

```bash
npm install /path/to/unified-sdk/unified-sdk-2.2.1.tgz
npx unified-sdk init --project YOUR_PROJECT_ID --dry-run
npx unified-sdk init --project YOUR_PROJECT_ID --api-url https://YOUR_BACKEND_HOST
```

this installs our SDK and writes the integration. it does not copy all widget source into your app like a shadcn registry does, widget updates come through the SDK dependency.

## Installation

```bash
npm install unified-sdk
```

## Quick Start

```jsx
import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

function App() {
  return (
    <UnifiedFeedback
      projectId="your-project-id"
      apiUrl="https://YOUR_BACKEND_HOST"
      theme="auto" // follows the host app, or set "light", "dark", "project"
    />
  );
}
```

## Props

| Prop        | Type              | Required | Description                                         |
| ----------- | ----------------- | -------- | --------------------------------------------------- |
| projectId   | string            | Yes      | Your project ID from Unified dashboard              |
| theme | "auto" \| "project" \| "light" \| "dark" | No | Follows the host app by default |

## Usage

1. Create a project in your [Unified Dashboard](https://unified-chi.vercel.app/dashboard)
2. Set up your feedback form with custom fields
3. Copy your project ID
4. Add the component to your React app
5. Start collecting feedback!

## Form Field Types

- Text input
- Email input
- Multiple choice
- Slider
- Textarea

## Example

```jsx
import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

function App() {
  return (
    <div>
      <h1>My Awesome App</h1>
      <UnifiedFeedback
        projectId={import.meta.env.UNIFIED_PROJECT_ID}
        theme="dark"
      />
    </div>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/romeirofernandes/unified).

## Learn More

For more information on how to use the Unified SDK, check out our [documentation](https://unified-chi.vercel.app/docs).


The widget embeds its own styles in a Shadow DOM. It follows host theme classes, data attributes, color-scheme and system preference by default. Remove a hard-coded `theme="light"` to enable automatic mode. Drag the trigger onto the red delete target to remove it. The button disintegrates into particles on removal (a short fade with reduced motion). Removal is saved in local storage per API origin and project and persists across refreshes. Clearing site storage restores it. Set `triggerStyle="pill"`, `"rounded"`, `"icon"`, `"text"`, or `"tab"` on `UnifiedFeedback` to choose the launcher. The launcher morphs into the form using beUI’s opening animation; closing uses a shorter contraction with an early form fade and a stationary launcher reveal. Reduced motion uses only a fade. Project Appearance settings control the launcher icon, label, shape, position, and light/dark colors. Explicit `triggerStyle` and `position` props override the saved project choices.
