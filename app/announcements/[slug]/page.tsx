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
      <div className="space-y-5">
        <PageHeader
                    title={announcement?.title || 'Announcement'}
          description={announcement ? `Posted by ${announcement.authorName}${announcement.createdAt ? ` · ${announcement.createdAt}` : ''}` : 'Read the latest update from your class.'}
          action={
            <Link href="/announcements" className="btn">
              ← All announcements
            </Link>
          }
        />
        {loading ? <p className="rounded-lg bg-white p-5 text-slate-500">Loading announcement…</p> : null}
        {error ? <p role="alert" className="note note-warn">{error}</p> : null}
        {announcement && !loading ? (
          <article className="panel">
            {announcement.pinned ? <span className="inline-flex chip bg-amber-100 text-amber-800">Pinned</span> : null}
            <p className={`whitespace-pre-wrap text-base leading-7 text-slate-800 ${announcement.pinned ? 'mt-3' : ''}`}>{announcement.content}</p>
          </article>
        ) : null}
      </div>
    </DashboardShell>
  );
}
