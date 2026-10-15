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
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome{user?.displayName ? `, ${user.displayName}` : ''}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
            {user?.email || 'Not signed in'}
          </span>
          <button onClick={handleSignOut} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Sign out
          </button>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Firebase is not configured yet. Add your frontend Firebase credentials to enable real authentication and class data.
          <div className="mt-3">
            <Link href="/auth" className="font-semibold underline">Go to auth</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Homework completed', value: '18/24', tone: 'bg-sky-50 text-sky-700' },
            { label: 'XP earned', value: '1,280', tone: 'bg-violet-50 text-violet-700' },
            { label: 'Class goal', value: '72%', tone: 'bg-emerald-50 text-emerald-700' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stat.tone}`}>{stat.label}</div>
              <div className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
