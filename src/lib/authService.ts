import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
} from "firebase/auth";
import { doc, getDocFromServer, type Firestore } from "firebase/firestore";
import type { UserDoc } from "./types";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(auth: Auth): Promise<void> {
  await signInWithPopup(auth, provider);
}

export async function signOut(auth: Auth): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resolveUserRole(
  db: Firestore,
  uid: string,
): Promise<UserDoc | null> {
  const snap = await getDocFromServer(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserDoc;
  if (!data.active) return null;
  return data;
}
