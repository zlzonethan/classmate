'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
import { announcementFeed } from '@/lib/mock-data';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

type Announcement = {
  title: string;
  content: string;
  pinned: boolean;
  authorName: string;
  createdAt: string;
};

export default function AnnouncementDetailPage({ params }: { params: { slug: string } }) {
  const sample = announcementFeed.find((item) => item.slug === params.slug);
  const [announcement, setAnnouncement] = useState<Announcement | null>(sample ? {
    title: sample.title,
    content: sample.content,
    pinned: sample.pinned,
    authorName: sample.meta.split('·').pop()?.trim() || 'Class staff',
    createdAt: sample.meta,
  } : null);
  const [loading, setLoading] = useState(!sample);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sample) return;
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db || !isFirebaseConfigured()) {
      setError('Sign in to read this class announcement.');
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Sign in to read this class announcement.');
        setLoading(false);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, 'announcements', params.slug));
        if (!snapshot.exists()) {
          setError('This announcement could not be found.');
          return;
        }
        const data = snapshot.data();
        setAnnouncement({
          title: data.title || 'Announcement',
          content: data.content || '',
          pinned: Boolean(data.pinned),
          authorName: data.authorName || 'Class staff',
          createdAt: data.createdAt || '',
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load this announcement.');
      } finally {
        setLoading(false);
      }
    });
  }, [params.slug, sample]);

  return (
    <DashboardShell navItems={getAppNavigation('announcements')}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Class announcement"
          title={announcement?.title || 'Announcement'}
          description={announcement ? `Posted by ${announcement.authorName}${announcement.createdAt ? ` · ${announcement.createdAt}` : ''}` : 'Read the latest update from your class.'}
          action={
            <Link href="/announcements" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← All announcements
            </Link>
          }
        />
        {loading ? <p className="rounded-2xl bg-white p-5 text-slate-500">Loading announcement…</p> : null}
        {error ? <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">{error}</p> : null}
        {announcement && !loading ? (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-8">
            {announcement.pinned ? <span className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Pinned</span> : null}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
              <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">{announcement.content}</p>
            </div>
          </article>
        ) : null}
      </div>
    </DashboardShell>
  );
}
