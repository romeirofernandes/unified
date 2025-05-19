import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to register user with backend
  const registerUserWithBackend = async (firebaseUser) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          firebaseUid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Backend registration failed:", data);
        throw new Error(data.message);
      }

      return await response.json();
    } catch (error) {
      console.error("Backend registration error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Try to login with backend
          const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ firebaseUid: firebaseUser.uid }),
            credentials: "include",
          });

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            setUser({ ...firebaseUser, ...data.user });
          } else if (loginResponse.status === 404) {
            // User exists in Firebase but not in backend
            const backendResponse = await registerUserWithBackend(firebaseUser);
            setUser({ ...firebaseUser, ...backendResponse.user });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state sync failed:", error);
        // In case of backend errors, still set the Firebase user
        setUser(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Immediately register with backend after Firebase auth
      const backendResponse = await registerUserWithBackend(
        userCredential.user
      );

      // Set the user state right away with combined data
      setUser({
        ...userCredential.user,
        ...backendResponse.user,
      });

      return userCredential;
    } catch (error) {
      console.error("Signup failed:", error);
      // If backend registration fails, clean up Firebase user
      if (error.message === "Backend registration failed") {
        await auth.currentUser?.delete();
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      try {
        // Try login first
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firebaseUid: result.user.uid }),
          credentials: "include",
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          setUser({ ...result.user, ...data.user });
        } else {
          // If login fails, register the user
          const backendResponse = await registerUserWithBackend(result.user);
          setUser({ ...result.user, ...backendResponse.user });
        }
      } catch (error) {
        console.error("Backend sync failed:", error);
        // Still set the Firebase user if backend fails
        setUser(result.user);
      }

      return result;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Optional: Clear backend session
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const value = {
    user,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
