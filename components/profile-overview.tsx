'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { quickStats } from '@/lib/mock-data';

const statuses = ['Available', 'Studying', 'Busy', 'Away'];

export function ProfileOverview() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState(statuses[0]);
  const [photoURL, setPhotoURL] = useState('');
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setLoading(false);
        return;
      }

      setDisplayName(nextUser.displayName || '');
      setPhotoURL(nextUser.photoURL || '');

      const db = getFirebaseDb();
      if (db) {
        try {
          const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
          const profile = snapshot.data();
          if (profile) {
            setDisplayName(profile.displayName || nextUser.displayName || '');
            setBio(profile.bio || '');
            setStatus(statuses.includes(profile.status) ? profile.status : statuses[0]);
            setPhotoURL(profile.photoURL || nextUser.photoURL || '');
          }
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load profile.');
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    const trimmedPhotoURL = photoURL.trim();
    if (trimmedPhotoURL) {
      try {
        const parsedURL = new URL(trimmedPhotoURL);
        if (!['http:', 'https:'].includes(parsedURL.protocol)) {
          throw new Error();
        }
      } catch {
        setError('Enter a valid image URL starting with http:// or https://.');
        return;
      }
    }
    if (trimmedPhotoURL.length > 2048) {
      setError('Image URL must be 2048 characters or fewer.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const savedAt = new Date().toISOString();
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: trimmedPhotoURL || null,
      });
      const profileRef = doc(db, 'users', user.uid);
      const existingProfile = await getDoc(profileRef);
      const profileData = {
        displayName: displayName.trim(),
        email: user.email || '',
        photoURL: trimmedPhotoURL,
        bio: bio.trim().slice(0, 240),
        status,
        updatedAt: savedAt,
      };
      await setDoc(profileRef, existingProfile.exists() ? profileData : {
        uid: user.uid,
        role: 'STUDENT',
        classId: 'default',
        createdAt: savedAt,
        ...profileData,
      }, { merge: true });
      setMessage('Profile saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || user?.email?.split('@')[0] || 'S').slice(0, 1).toUpperCase();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
        <div className="mb-5">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Personal space</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Let your classmates know who you are and what you’re up to.</p>
        </div>

        {!isFirebaseConfigured() ? (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Connect Firebase to create and save a personal profile.</p>
        ) : !user && !loading ? (
          <div className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
            Sign in to edit your profile.
            <Link href="/auth" className="ml-2 font-semibold underline">Sign in</Link>
          </div>
        ) : loading ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading profile…</p>
        ) : (
          <>
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
              {photoURL && !photoLoadError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt={`${displayName || 'Profile'} avatar`} onError={() => setPhotoLoadError(true)} className="h-20 w-20 rounded-full border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white">{initials}</div>
              )}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">
                  Profile image URL
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(event) => {
                      setPhotoURL(event.target.value);
                      setPhotoLoadError(false);
                    }}
                    maxLength={2048}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    disabled={saving}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">Paste a direct link to an image. Leave blank to use your initials.</p>
              </div>
              <div className="min-w-0 sm:text-right">
                <p className="font-semibold text-slate-900">{user?.email}</p>
                <p className="mt-1 text-sm text-slate-500">Room 2A · Student</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Display name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Current status
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500">
                  {statuses.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                About me
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} placeholder="A little about you, your interests, or what you are working on…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500" />
                <span className="mt-1 block text-right text-xs text-slate-400">{bio.length}/240</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div aria-live="polite">
                {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
                {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              </div>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Progress</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Stats</h2>
          </div>
          <Link href="/leaderboard" className="text-sm font-semibold text-sky-700 hover:text-sky-800">Class leaderboard →</Link>
        </div>
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Preview stats until homework completion and XP records are connected.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{stat.change}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
