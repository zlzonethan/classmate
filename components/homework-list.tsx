'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { getClassHomework } from '@/lib/homework-client';

const subjectLabels: Record<string, string> = {
  math: 'Mathematics',
  science: 'Science',
  english: 'English',
  history: 'History',
  spanish: 'Spanish',
};

function getSubjectName(subjectId: string) {
  return subjectLabels[subjectId.toLowerCase()] || subjectId;
}

export function HomeworkList() {
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured, so assignments cannot be loaded.');
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase authentication is unavailable.');
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      setSignedIn(Boolean(user));
      setLoading(true);
      setError(null);
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        const records = await getClassHomework();
        setItems(records.filter((item) => !item.archived).sort((a, b) =>
          `${a.dueDate}T${a.dueTime || '23:59'}`.localeCompare(`${b.dueDate}T${b.dueTime || '23:59'}`),
        ));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load class assignments.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const subjects = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => getSubjectName(item.subjectId))))], [items]);
  const visibleItems = selectedSubject === 'All'
    ? items
    : items.filter((item) => getSubjectName(item.subjectId) === selectedSubject);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading homework…</div>;
  }

  if (error) {
    return <div role="alert" className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-soft">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {!signedIn ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-800">
          Sign in to see assignments shared with your class.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Filter assignments by subject">
          {subjects.map((subject) => (
            <button key={subject} type="button" onClick={() => setSelectedSubject(subject)} aria-pressed={selectedSubject === subject} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedSubject === subject ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {subject}
            </button>
          ))}
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-soft">
          {signedIn ? 'No class assignments yet.' : 'Sign in to view the class assignment list.'}
        </div>
      ) : (
        visibleItems.map((item) => {
          const itemId = item.id || item.title;
          return (
            <article key={itemId} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <span className="text-sm font-medium text-slate-600">{getSubjectName(item.subjectId)}</span>
                </div>
                <Link href={`/homework/${item.id ?? encodeURIComponent(item.title)}`} className="text-xl font-semibold text-slate-900 hover:text-sky-700">{item.title}</Link>
                <p className="mt-1 text-sm text-slate-500">Due {item.dueDate}{item.dueTime ? ` at ${item.dueTime}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${item.priority === 'high' ? 'bg-rose-50 text-rose-700' : item.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.priority}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.archived ? 'Archived' : 'Active'}</span>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
