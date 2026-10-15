'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type AnnouncementItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  pinned: boolean;
  meta: string;
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const response = await fetch('/api/announcements', { cache: 'no-store' });
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Updates</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Announcements</h1>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+ Post</button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {['All', 'Pinned', 'Class updates', 'Teacher posts'].map((filter) => (
            <button key={filter} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === 'All' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-600 shadow-soft">Loading announcements…</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id || item.slug} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
                  {item.pinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">Pinned</span> : null}
                </div>
                <p className="text-sm text-slate-500">{item.meta}</p>
                <p className="mt-4 text-slate-600">{item.content}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <span className="text-sm text-slate-500">{item.pinned ? 'Pinned announcement' : 'Class update'}</span>
                  <Link href={`/announcements/${item.slug}`} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Read details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
