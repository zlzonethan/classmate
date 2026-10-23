'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { demoAssignments } from '@/lib/mock-data';
import type { HomeworkRecord } from '@/lib/firestore-schema';

type Assignment = Pick<HomeworkRecord, 'title' | 'subjectId' | 'dueDate' | 'dueTime' | 'priority' | 'description'> & {
  id?: string;
};

function formatDueDate(dueDate: string, dueTime?: string) {
  const date = new Date(`${dueDate}T${dueTime || '23:59'}:00`);
  if (Number.isNaN(date.getTime())) return `Due ${dueDate}`;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysUntilDue = Math.round((startOfDueDate.getTime() - startOfToday.getTime()) / 86400000);
  const dueLabel = daysUntilDue < 0
    ? 'Overdue'
    : daysUntilDue === 0
      ? 'Due today'
      : daysUntilDue === 1
        ? 'Due tomorrow'
        : `Due ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  return dueTime ? `${dueLabel} · ${dueTime}` : dueLabel;
}

export function HomeworkOverview() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAssignments() {
      try {
        const response = await fetch('/api/homework', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load assignments.');
        }

        const activeItems: Assignment[] = (Array.isArray(payload.items) ? payload.items : [])
          .filter((item: HomeworkRecord) => !item.archived)
          .sort((a: HomeworkRecord, b: HomeworkRecord) => {
            const aDue = `${a.dueDate}T${a.dueTime || '23:59'}`;
            const bDue = `${b.dueDate}T${b.dueTime || '23:59'}`;
            return aDue.localeCompare(bDue);
          });

        if (activeItems.length === 0) {
          setItems(demoAssignments);
          setUsingDemoData(true);
        } else {
          setItems(activeItems);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load assignments.');
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Your work</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Assignments</h2>
          <p className="mt-1 text-sm text-slate-500">Closest deadlines first</p>
        </div>
        <Link href="/homework" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          All assignments
        </Link>
      </div>

      {usingDemoData ? (
        <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Sample assignments are shown until real class assignments are added.
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Loading assignments…</p>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
          <p className="font-semibold text-slate-800">You’re all caught up</p>
          <p className="mt-1 text-sm text-slate-500">New assignments will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.id || item.title}
              href={item.id && !item.id.startsWith('demo-') ? `/homework/${item.id}` : '/homework'}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{item.subjectId}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.priority === 'high' ? 'bg-rose-100 text-rose-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.priority} priority
                  </span>
                </div>
                <h3 className="truncate text-lg font-semibold text-slate-900">{item.title}</h3>
                {item.description ? <p className="mt-0.5 truncate text-sm text-slate-500">{item.description}</p> : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-700">{formatDueDate(item.dueDate, item.dueTime)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
