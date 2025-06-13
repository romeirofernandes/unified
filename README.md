# Unified SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-9.x-orange.svg)](https://firebase.google.com/)

A complete feedback management system for React applications. Collect user feedback with a single component and powerful dashboard.

---

## What is Unified?

Unified is a full-stack feedback collection platform that combines:

- **React SDK** for seamless frontend integration
- **Express.js backend** with MongoDB for data management
- **Admin dashboard** with AI-powered analytics
- **Firebase authentication** for secure user management

---

## Project Structure

```

unified/
├── frontend/       # React dashboard app
├── backend/        # Express.js API server
└── unified-sdk/    # NPM package for integration
    
````

---

## Features

- **One-line Integration**: Add feedback forms to any React app
- **Custom Forms**: Text, email, multiple choice, slider, textarea fields
- **Real-time Dashboard**: Monitor feedback with AI summaries
- **Theme Support**: Light/dark modes
- **Mobile Responsive**: Works on all devices
- **Firebase Auth**: Secure user management

---

## Installation

```bash
npm install unified-sdk
````

### Example Usage

```javascript
import { UnifiedFeedback } from "unified-sdk";

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <UnifiedFeedback
        projectId="your-project-id"
        firebaseUid="user-firebase-uid"
        theme="light"
      />
    </div>
  );
}
```

---

## Environment Variables

### Frontend (.env)

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_BACKEND_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your-key-here
```

### Backend (.env)

```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/unified
```

---

## Dashboard Setup

1. Visit [unified-chi.vercel.app/dashboard](https://unified-chi.vercel.app/dashboard)
2. Sign in with Google
3. Create a new project
4. Configure form fields and theme
5. Copy your project ID

---

## API Props

| Prop          | Type              | Required | Default | Description               |
| ------------- | ----------------- | -------- | ------- | ------------------------- |
| `projectId`   | string            | Yes      | -       | Project ID from dashboard |
| `firebaseUid` | string            | Yes      | -       | Firebase user ID          |
| `theme`       | "light" \| "dark" | No       | "light" | Visual theme              |

---

## Supported Field Types

* **Text**: Single-line input with validation
* **Email**: Email validation with RFC compliance
* **Multiple Choice**: Single selection questions
* **Slider**: Numeric range selector
* **Textarea**: Multi-line text input

---

## Development Setup

```bash
# Clone repository
git clone https://github.com/romeirofernandes/unified.git
cd unified

# Install dependencies
npm install

# Setup environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Run development servers
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 8000

# Build SDK
cd unified-sdk
npm install
npm run build
npm publish
```

---

## API Endpoints

* `POST /api/projects` — Create project
* `GET  /api/projects/:id` — Get project config
* `POST /api/feedback` — Submit feedback
* `GET  /api/feedback/:id` — Get project feedback

---

## Tech Stack

* **Frontend**: React, Vite, Tailwind CSS, Framer Motion
* **Backend**: Express.js, MongoDB, Firebase Admin
* **Deployment**: Vercel (frontend), Railway (backend)

---

## Browser Support

* Chrome 88+
* Firefox 85+
* Safari 14+
* Edge 88+

---

## Support

* **Issues**: [GitHub Issues](https://github.com/romeirofernandes/unified/issues)
* **Documentation**: [unified-chi.vercel.app/docs](https://unified-chi.vercel.app/docs)

---

## License

MIT License - see LICENSE file for details.

```
