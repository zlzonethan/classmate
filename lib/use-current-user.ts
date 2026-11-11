'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import type { UserRole } from '@/lib/user-profile';

export type CurrentUser = {
  user: User | null;
  role: UserRole;
  displayName: string;
  photoURL: string;
  /** Class president or teacher. */
  isStaff: boolean;
  loading: boolean;
  configured: boolean;
};

const syncedUids = new Set<string>();

// Makes sure a profile document exists for the signed-in account.
async function ensureProfile(user: User) {
  if (syncedUids.has(user.uid)) return;
  syncedUids.add(user.uid);
  try {
    const token = await user.getIdToken();
    await fetch('/api/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    syncedUids.delete(user.uid);
  }
}

export function roleLabel(role: UserRole) {
  if (role === 'TEACHER') return 'Teacher';
  if (role === 'CLASS_PRESIDENT') return 'Class president';
  return 'Student';
}

export function useCurrentUser(): CurrentUser {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setRole('STUDENT');
        setDisplayName('');
        setPhotoURL('');
        setLoading(false);
        return;
      }

      const fallbackName = nextUser.displayName || nextUser.email?.split('@')[0] || 'Classmate';
      setDisplayName(fallbackName);
      setPhotoURL(nextUser.photoURL || '');
      try {
        await ensureProfile(nextUser);
        const profile = (await getDoc(doc(db, 'users', nextUser.uid))).data();
        const profileRole = profile?.role;
        setRole(profileRole === 'TEACHER' || profileRole === 'CLASS_PRESIDENT' ? profileRole : 'STUDENT');
        setDisplayName(profile?.displayName || fallbackName);
        setPhotoURL(profile?.photoURL || nextUser.photoURL || '');
      } catch {
        setRole('STUDENT');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return {
    user,
    role,
    displayName,
    photoURL,
    isStaff: role === 'TEACHER' || role === 'CLASS_PRESIDENT',
    loading,
    configured,
  };
}
