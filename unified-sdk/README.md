# Unified SDK

A beautiful and customizable feedback component for React applications. Collect, analyze, and act on user feedback - all in one place.

## Features

- 🎯 One-line integration
- 🎨 Light and dark theme support
- 🔄 Draggable feedback button
- 📝 Customizable form fields
- 🔒 Firebase authentication support
- 💫 Smooth animations
- 🎭 Elegant UI components

## Installation

```bash
npm install unified-sdk
```

## Quick Start

```jsx
import { UnifiedFeedback } from "unified-sdk";

function App() {
  return (
    <UnifiedFeedback
      projectId="your-project-id"
      firebaseUid="your-firebase-uid"
      theme="light" // or "dark"
    />
  );
}
```

## Props

| Prop        | Type              | Required | Description                                         |
| ----------- | ----------------- | -------- | --------------------------------------------------- |
| projectId   | string            | Yes      | Your project ID from Unified dashboard              |
| firebaseUid | string            | Yes      | Firebase user ID for authentication                 |
| theme       | "light" \| "dark" | No       | Theme for the feedback component (default: "light") |

## Usage

1. Create a project in your [Unified Dashboard](https://unified-chi.vercel.app/dashboard)
2. Set up your feedback form with custom fields
3. Copy your project ID and Firebase UID
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

function App() {
  return (
    <div>
      <h1>My Awesome App</h1>
      <UnifiedFeedback
        projectId={process.env.UNIFIED_PROJECT_ID}
        firebaseUid={process.env.FIREBASE_UID}
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

#Learn More

For more information on how to use the Unified SDK, check out our [documentation](https://unified-chi.vercel.app/docs).

