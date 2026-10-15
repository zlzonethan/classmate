'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HomeworkRecord } from '@/lib/firestore-schema';

export function HomeworkList() {
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHomework() {
      try {
        const response = await fetch('/api/homework', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load homework list.');
        }

        setItems(Array.isArray(payload.items) ? payload.items : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown load error');
      } finally {
        setLoading(false);
      }
    }

    loadHomework();
  }, []);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading homework...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-soft">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-soft">
          No homework assigned yet. Create the first assignment when ready.
        </div>
      ) : (
        items.map((item) => (
          <Link
            key={item.id || item.title}
            href={`/homework/${item.id ?? item.title}`}
            className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span className="text-sm font-medium text-slate-600">{item.subjectId}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Due {item.dueDate}{item.dueTime ? ` at ${item.dueTime}` : ''}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{item.priority}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.archived ? 'Archived' : 'Active'}</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
