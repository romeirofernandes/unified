import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { apiRequest } from "./api";

const pendingSyncs = new Map();

export function syncUser(firebaseUser) {
  if (pendingSyncs.has(firebaseUser.uid))
    return pendingSyncs.get(firebaseUser.uid);
  const request = (async () => {
    let response;
    try {
      response = await apiRequest("/auth/login", {
        method: "POST",
        body: { firebaseUid: firebaseUser.uid },
      });
    } catch (error) {
      if (error.status !== 404) throw error;
      response = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          email: firebaseUser.email,
          firebaseUid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
      });
    }
    return {
      ...firebaseUser,
      ...response.user,
      uid: firebaseUser.uid,
      providerData: firebaseUser.providerData,
      metadata: firebaseUser.metadata,
    };
  })().finally(() => pendingSyncs.delete(firebaseUser.uid));
  pendingSyncs.set(firebaseUser.uid, request);
  return request;
}

async function authenticate(operation) {
  const result = await operation();
  // Authentication succeeds even if the backend is temporarily offline.
  // The workspace reports API failures and offers a retry.
  await syncUser(result.user).catch(() => {});
  return result;
}

export const signup = (email, password) =>
  authenticate(() => createUserWithEmailAndPassword(auth, email, password));
export const login = (email, password) =>
  authenticate(() => signInWithEmailAndPassword(auth, email, password));
export const loginWithGoogle = () =>
  authenticate(() => signInWithPopup(auth, new GoogleAuthProvider()));
export const logout = () => signOut(auth);
