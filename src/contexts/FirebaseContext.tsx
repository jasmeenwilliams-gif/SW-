import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export const ADMIN_EMAIL = 'jasmeenwilliams@southernwellofsouthms.com';
export const ADMIN_EMAILS = [
  'jasmeenwilliams@southernwellofsouthms.com',
  'jwi4819@wgu.edu',
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized as (typeof ADMIN_EMAILS)[number]);
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'client' | 'admin';
}

interface FirebaseContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    let profileUnsub: Unsubscribe | null = null;
    let active = true;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!active) return;

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      setUser(firebaseUser);
      const userPath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);

      try {
        let snap;
        try {
          snap = await getDoc(userRef);
        } catch (getErr) {
          handleFirestoreError(getErr, OperationType.GET, userPath);
        }

        const email = (firebaseUser.email || '').trim().slice(0, 180);
        const fallbackName = email.includes('@') ? email.split('@')[0] : 'Family Steward';
        const displayName = (firebaseUser.displayName || fallbackName).trim().slice(0, 120);
        const expectedRole: 'client' | 'admin' = isAdminEmail(email) ? 'admin' : 'client';

        if (!snap.exists()) {
          try {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName,
              email,
              role: expectedRole,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (createErr) {
            handleFirestoreError(createErr, OperationType.CREATE, userPath);
          }
        } else if (expectedRole === 'admin' && snap.data()?.role !== 'admin') {
          try {
            await updateDoc(userRef, {
              role: 'admin',
              updatedAt: serverTimestamp(),
            });
          } catch (updateErr) {
            handleFirestoreError(updateErr, OperationType.UPDATE, userPath);
          }
        }

        if (!active) return;

        profileUnsub = onSnapshot(
          userRef,
          (docSnap) => {
            if (!active) return;
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile({
                uid: String(data.uid ?? firebaseUser.uid),
                displayName: String(data.displayName ?? firebaseUser.displayName ?? 'Family Steward'),
                email: String(data.email ?? firebaseUser.email ?? ''),
                role: data.role === 'admin' ? 'admin' : 'client',
              });
            }
            setAuthReady(true);
          },
          (listenErr) => {
            try {
              handleFirestoreError(listenErr, OperationType.GET, userPath);
            } catch (wrapped) {
              if (active) {
                setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
              }
            }
          }
        );
      } catch (err) {
        if (active) {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });

    return () => {
      active = false;
      authUnsub();
      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in was cancelled before completion.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else {
        setAuthError(error instanceof Error ? error.message : 'Unable to complete Google sign-in.');
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out right now.');
    } finally {
      setAuthLoading(false);
    }
  };

  const isAdmin = useMemo(
    () => Boolean(userProfile?.role === 'admin' || isAdminEmail(user?.email)),
    [userProfile, user]
  );

  const value: FirebaseContextValue = {
    user,
    userProfile,
    isAdmin,
    authReady,
    authLoading,
    authError,
    signInWithGoogle,
    signOutUser,
    clearAuthError: () => setAuthError(null),
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
}
