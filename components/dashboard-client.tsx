'use client';

import Link from 'next/link';
import { signOut, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

async function syncUserProfile(user: User) {
  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName || '',
        email: user.email || '',
        classId: 'default',
        role: 'STUDENT',
      }),
    });

    if (!response.ok) {
      console.warn('User profile sync failed', await response.text());
    }
  } catch (syncError) {
    console.warn('Profile sync encountered an error:', syncError);
  }
}

export function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await syncUserProfile(nextUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) return;
    await signOut(auth);
  };

  if (loading) {
    return <div className="p-8 text-slate-600">Loading dashboard...</div>;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-soft md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
              {(user?.displayName || user?.email || 'C').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-600">Dashboard</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Welcome{user?.displayName ? `, ${user.displayName}` : ''}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-56 truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:inline-block">
            {user?.email || 'Not signed in'}
          </span>
          {user ? (
            <Link href="/profile" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Profile
            </Link>
          ) : null}
          {user ? (
            <button onClick={handleSignOut} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Sign out
            </button>
          ) : (
            <Link href="/auth" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {!user ? (
        <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm ${isFirebaseConfigured() ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'}`}>
          <span>{isFirebaseConfigured() ? 'Sign in to see your profile and personal progress.' : 'Firebase is not configured yet; showing class preview data.'}</span>
          <Link href="/auth" className="shrink-0 font-semibold underline">{isFirebaseConfigured() ? 'Sign in with Google' : 'Sign in'}</Link>
        </div>
      ) : null}
    </div>
  );
}
