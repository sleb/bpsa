import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { resolveUserRole } from "@/lib/authService";
import type { UserDoc } from "@/lib/types";

type AuthState = {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
};

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    userDoc: null,
    loading: true,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, userDoc: null, loading: false });
        return;
      }
      resolveUserRole(db, user.uid)
        .then((userDoc) => setState({ user, userDoc, loading: false }))
        .catch(() => setState({ user, userDoc: null, loading: false }));
    });
  }, []);

  return state;
}
