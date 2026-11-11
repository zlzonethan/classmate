'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { demoAssignments } from '@/lib/mock-data';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { getClassHomework } from '@/lib/homework-client';
import { formatDue } from '@/lib/format';

type Assignment = Pick<HomeworkRecord, 'title' | 'subjectId' | 'dueDate' | 'dueTime' | 'priority' | 'description'> & {
  id?: string;
};

export function HomeworkOverview() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssignments = async (isSignedIn: boolean) => {
      setError('');
      try {
        const records = isSignedIn ? await getClassHomework() : [];
        const activeItems: Assignment[] = records
          .filter((item) => !item.archived)
          .sort((a: HomeworkRecord, b: HomeworkRecord) => {
            const aDue = `${a.dueDate}T${a.dueTime || '23:59'}`;
            const bDue = `${b.dueDate}T${b.dueTime || '23:59'}`;
            return aDue.localeCompare(bDue);
          });

        if (!isSignedIn) {
          setItems(demoAssignments);
          setUsingDemoData(true);
        } else {
          setItems(activeItems);
          setUsingDemoData(false);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load assignments.');
      } finally {
        setLoading(false);
      }
    };

    if (!isFirebaseConfigured()) {
      void loadAssignments(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      void loadAssignments(false);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setLoading(true);
      void loadAssignments(Boolean(user));
    });
  }, []);

  return (
    <section className="panel">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Homework due next</h2>
        <Link href="/homework" className="text-sm font-medium text-accent-600 hover:underline">See all</Link>
      </div>

      {loading ? (
        <p className="mt-3 text-slate-500">Loading…</p>
      ) : error ? (
        <p role="alert" className="note note-error mt-3">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-slate-600">Nothing due. You’re all caught up.</p>
      ) : (
        <ul className="mt-1 divide-y divide-slate-200">
          {items.slice(0, 5).map((item) => {
            const due = formatDue(item.dueDate, item.dueTime);
            return (
              <li key={item.id || item.title}>
                <Link
                  href={item.id && !item.id.startsWith('demo-') ? `/homework/${item.id}` : '/homework'}
                  className="-mx-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-md px-2 py-3 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-slate-900">{item.title}</span>
                    <span className="ml-2 text-sm text-slate-500">{item.subjectId}</span>
                  </span>
                  <span className={`shrink-0 text-sm ${due.urgent ? 'font-medium text-red-700' : 'text-slate-600'}`}>{due.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {usingDemoData ? <p className="mt-2 text-xs text-slate-500">These are examples. Sign in to see your class’s homework.</p> : null}
    </section>
  );
}
