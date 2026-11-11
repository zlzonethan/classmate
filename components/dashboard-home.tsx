'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { announcementFeed } from '@/lib/mock-data';
import { useClassSettings } from '@/lib/class-settings';
import { getFirebaseDb } from '@/lib/firebase';
import { formatDay } from '@/lib/format';
import { useCurrentUser } from '@/lib/use-current-user';

export function DashboardGreeting() {
  const { user, displayName, isStaff, loading } = useCurrentUser();
  const { settings } = useClassSettings();
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="min-h-[1.25rem] text-sm text-slate-500">{today}</p>
          <h1 className="mt-0.5 text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            {loading ? '\u00a0' : user ? `Hello, ${displayName.split(' ')[0]}` : settings.name}
          </h1>
        </div>
        {isStaff ? <Link href="/homework/new" className="btn btn-primary">Add homework</Link> : null}
      </header>
      {settings.homeMessage ? (
        <p className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-[15px] text-accent-800">
          {settings.homeMessage}
        </p>
      ) : null}
    </div>
  );
}

type Post = { id: string; title: string; content: string; pinned: boolean; date: string; href: string };

const samplePosts: Post[] = announcementFeed.slice(0, 3).map((item) => ({
  id: item.slug,
  title: item.title,
  content: item.content,
  pinned: item.pinned,
  date: '',
  href: `/announcements/${item.slug}`,
}));

export function RecentAnnouncements() {
  const { user, loading: userLoading } = useCurrentUser();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    const db = getFirebaseDb();
    if (!user || !db) {
      setPosts(samplePosts);
      setIsSample(true);
      return;
    }

    let cancelled = false;
    getDocs(collection(db, 'announcements'))
      .then((snapshot) => {
        if (cancelled) return;
        const loaded = snapshot.docs
          .map((item) => ({ id: item.id, data: item.data() }))
          .filter(({ data }) => !data.archived)
          .sort((a, b) => Number(Boolean(b.data.pinned)) - Number(Boolean(a.data.pinned))
            || String(b.data.createdAt || '').localeCompare(String(a.data.createdAt || '')))
          .slice(0, 3)
          .map(({ id, data }) => ({
            id,
            title: data.title || 'Untitled',
            content: data.content || '',
            pinned: Boolean(data.pinned),
            date: data.createdAt ? formatDay(data.createdAt) : '',
            href: `/announcements/${id}`,
          }));
        setPosts(loaded);
        setIsSample(false);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => { cancelled = true; };
  }, [user, userLoading]);

  return (
    <section className="panel">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
        <Link href="/announcements" className="text-sm font-medium text-accent-600 hover:underline">See all</Link>
      </div>

      {posts === null ? (
        <p className="mt-3 text-slate-500">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="mt-3 text-slate-600">No announcements yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-slate-200">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={post.href} className="-mx-2 block rounded-md px-2 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">
                  {post.title}
                  {post.pinned ? <span className="chip ml-2 bg-amber-50 text-amber-800">Pinned</span> : null}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{post.content}</p>
                {post.date ? <p className="mt-1 text-xs text-slate-500">{post.date}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {isSample ? <p className="mt-2 text-xs text-slate-500">These are examples. Sign in to see your class’s posts.</p> : null}
    </section>
  );
}
