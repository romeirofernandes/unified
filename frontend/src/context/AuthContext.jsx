import { useEffect, useMemo, useState } from "react";
import { auth } from "@/firebaseConfig";
import { AuthContext } from "./auth-context";
import {
  signup,
  login,
  loginWithGoogle,
  logout,
  syncUser,
} from "@/lib/auth-service";

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, loading: true });

  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      const requestRevision = ++revision;
      if (!firebaseUser) {
        setSession({ user: null, loading: false });
        return;
      }
      syncUser(firebaseUser)
        .catch(() => firebaseUser)
        .then((user) => {
          if (active && revision === requestRevision)
            setSession({ user, loading: false });
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ ...session, signup, login, loginWithGoogle, logout }),
    [session],
  );
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
