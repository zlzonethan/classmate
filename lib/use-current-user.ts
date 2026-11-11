'use client';

import { useSyncExternalStore } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import type { UserRole } from '@/lib/user-profile';

type UserState = {
  user: User | null;
  role: UserRole;
  displayName: string;
  photoURL: string;
  loading: boolean;
};

export type CurrentUser = UserState & {
  /** Class president or teacher. */
  isStaff: boolean;
  isTeacher: boolean;
  configured: boolean;
};

// One shared auth subscription and profile read for every component on the page.
const initialState: UserState = { user: null, role: 'STUDENT', displayName: '', photoURL: '', loading: true };
let state = initialState;
let started = false;
let authSequence = 0;
const listeners = new Set<() => void>();
const syncedUids = new Set<string>();

function setState(patch: Partial<UserState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

// Makes sure a profile document exists for the signed-in account.
async function ensureProfile(user: User) {
  if (syncedUids.has(user.uid)) return;
  syncedUids.add(user.uid);
  try {
    const token = await user.getIdToken();
    await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    syncedUids.delete(user.uid);
  }
}

function start() {
  if (started) return;
  started = true;
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db) {
    setState({ loading: false });
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    const sequence = ++authSequence;
    if (!user) {
      setState({ ...initialState, loading: false });
      return;
    }

    const fallbackName = user.displayName || user.email?.split('@')[0] || 'Classmate';
    setState({ user, displayName: fallbackName, photoURL: user.photoURL || '', loading: true });
    try {
      await ensureProfile(user);
      const profile = (await getDoc(doc(db, 'users', user.uid))).data();
      if (sequence !== authSequence) return;
      const role = profile?.role === 'TEACHER' || profile?.role === 'CLASS_PRESIDENT' ? profile.role : 'STUDENT';
      setState({
        role,
        displayName: profile?.displayName || fallbackName,
        photoURL: profile?.photoURL || user.photoURL || '',
        loading: false,
      });
    } catch {
      if (sequence === authSequence) setState({ role: 'STUDENT', loading: false });
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function roleLabel(role: UserRole) {
  if (role === 'TEACHER') return 'Teacher';
  if (role === 'CLASS_PRESIDENT') return 'Class president';
  return 'Student';
}

export function useCurrentUser(): CurrentUser {
  const current = useSyncExternalStore(subscribe, () => state, () => initialState);
  return {
    ...current,
    isStaff: current.role === 'TEACHER' || current.role === 'CLASS_PRESIDENT',
    isTeacher: current.role === 'TEACHER',
    configured: isFirebaseConfigured(),
  };
}
