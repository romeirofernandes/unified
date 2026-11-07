import { initializeApp } from "firebase/app";
import { setAccessTokenProvider } from "./lib/access-token";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics is optional and loads separately from authentication.
let analytics = null;
if (typeof window !== "undefined") {
  import("firebase/analytics")
    .then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) analytics = getAnalytics(app);
    })
    .catch(() => {
      // Tracking must not prevent sign-in in browsers without analytics support.
    });
}
const auth = getAuth(app);
setAccessTokenProvider(async (uid) => {
  const user = auth.currentUser;
  return user && (!uid || user.uid === uid) ? user.getIdToken() : null;
});

export { auth, analytics };
