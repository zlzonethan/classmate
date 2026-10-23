'use client';

import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
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
    <DashboardShell navItems={getAppNavigation('announcements')}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Class updates"
          title="Announcements"
          description="Important notes and updates shared with your class."
          action={
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {items.filter((item) => item.pinned).length} pinned
            </span>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Latest posts</h2>
              <p className="mt-1 text-sm text-slate-500">Class news, reminders, and pinned information.</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">Room 2A</span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-slate-600">Loading announcements…</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id || item.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                    </div>
                    {item.pinned ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pinned</span> : null}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.content}</p>
                  <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                    <Link href={`/announcements/${item.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50">
                      Read details →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
