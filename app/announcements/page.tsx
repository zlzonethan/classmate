'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
import { announcementFeed } from '@/lib/mock-data';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

type AnnouncementItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  pinned: boolean;
  meta: string;
  createdBy?: string;
  isSample?: boolean;
};

const sampleItems: AnnouncementItem[] = announcementFeed.map((item) => ({
  id: item.slug,
  slug: item.slug,
  title: item.title,
  content: item.content,
  pinned: item.pinned,
  meta: item.meta,
  isSample: true,
}));

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>(sampleItems);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setError('');
      if (!currentUser) {
        setRole('STUDENT');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
        const profile = profileSnapshot.data();
        setRole(profile?.role || 'STUDENT');
        setDisplayName(profile?.displayName || currentUser.displayName || currentUser.email || 'Class member');

        const snapshot = await getDocs(collection(db, 'announcements'));
        const savedItems = snapshot.docs
          .map((announcement) => {
            const data = announcement.data();
            return {
              id: announcement.id,
              slug: data.slug || announcement.id,
              title: data.title || 'Untitled announcement',
              content: data.content || '',
              pinned: Boolean(data.pinned),
              meta: `Posted by ${data.authorName || 'Class staff'} · ${data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Recently'}`,
              createdBy: data.createdBy,
              isSample: false,
              archived: Boolean(data.archived),
            };
          })
          .filter((item) => !item.archived)
          .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id.localeCompare(a.id));

        setItems(savedItems.length ? savedItems : sampleItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load announcements.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const canPost = role === 'CLASS_PRESIDENT' || role === 'TEACHER';

  const saveAnnouncement = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !canPost) {
      setError('Only class presidents and teachers can publish announcements.');
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('Enter both a title and announcement message.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const announcementTitle = title.trim().slice(0, 120);
      const announcementContent = content.trim().slice(0, 5000);
      if (editingId) {
        await updateDoc(doc(db, 'announcements', editingId), {
          title: announcementTitle,
          content: announcementContent,
          pinned,
          updatedAt: now,
        });
        setItems((current) => current
          .filter((item) => !item.isSample)
          .map((item) => item.id === editingId
            ? { ...item, title: announcementTitle, content: announcementContent, pinned }
            : item)
          .sort((a, b) => Number(b.pinned) - Number(a.pinned)));
      } else {
        const announcementRef = await addDoc(collection(db, 'announcements'), {
          title: announcementTitle,
          content: announcementContent,
          pinned,
          attachmentUrls: [],
          createdBy: user.uid,
          authorName: displayName,
          createdAt: now,
          updatedAt: now,
          archived: false,
          slug: `notice-${Date.now()}`,
        });
        const created: AnnouncementItem = {
          id: announcementRef.id,
          slug: announcementRef.id,
          title: announcementTitle,
          content: announcementContent,
          pinned,
          meta: `Posted by ${displayName} · ${new Date(now).toLocaleDateString('en-US', { timeZone: 'UTC' })}`,
          createdBy: user.uid,
        };
        setItems((current) => [...current.filter((item) => !item.isSample), created].sort((a, b) => Number(b.pinned) - Number(a.pinned)));
      }
      setTitle('');
      setContent('');
      setPinned(false);
      setEditingId(null);
      setShowComposer(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not publish announcement. Check your class role and Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  const editAnnouncement = (item: AnnouncementItem) => {
    if (item.isSample) return;
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setPinned(item.pinned);
    setError('');
    setShowComposer(true);
  };

  const removeAnnouncement = async (item: AnnouncementItem) => {
    if (!canPost || item.isSample) return;
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }
    setError('');
    try {
      await deleteDoc(doc(db, 'announcements', item.id));
      setItems((current) => current.filter((announcement) => announcement.id !== item.id));
      if (editingId === item.id) {
        setEditingId(null);
        setShowComposer(false);
        setTitle('');
        setContent('');
        setPinned(false);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this announcement.');
    }
  };

  const cancelEditing = () => {
    setShowComposer(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setPinned(false);
    setError('');
  };

  return (
    <DashboardShell navItems={getAppNavigation('announcements')}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Class updates"
          title="Announcements"
          description="Important notes and updates shared with your class."
          action={
            canPost ? (
              <button onClick={() => setShowComposer((current) => !current)} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                {showComposer ? 'Cancel' : '+ Write announcement'}
              </button>
            ) : (
              <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {items.filter((item) => item.pinned).length} pinned
              </span>
            )
          }
        />

        {showComposer && canPost ? (
          <form onSubmit={saveAnnouncement} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">For your class</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{editingId ? 'Edit announcement' : 'Write an announcement'}</h2>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="e.g. Friday schedule change" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Message
              <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={5} required placeholder="Write the details for your classmates…" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
              Pin this announcement
            </label>
            {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish to class'}</button>
              {editingId ? <button type="button" onClick={cancelEditing} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel edit</button> : null}
            </div>
          </form>
        ) : null}

        {!canPost && !user ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Sign in to read live class announcements. The examples below are previews.
          </p>
        ) : null}

        {error && !showComposer ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No announcements yet.</div>
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
                    {canPost && !item.isSample ? (
                      <div className="mr-auto flex gap-2">
                        <button type="button" onClick={() => editAnnouncement(item)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50">Edit</button>
                        <button type="button" onClick={() => void removeAnnouncement(item)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                      </div>
                    ) : null}
                    <Link href={`/announcements/${item.isSample ? item.slug : item.id}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50">Read details →</Link>
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
