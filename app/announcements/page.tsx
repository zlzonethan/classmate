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
              meta: `Posted by ${data.authorName || 'Class staff'} · ${data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}`,
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
          meta: `Posted by ${displayName} · ${new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
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
      <div className="space-y-8">
        <PageHeader
          title="Announcements"
          description="News and reminders from your class president and teacher."
          action={
            canPost && !showComposer ? (
              <button type="button" onClick={() => setShowComposer(true)} className="btn btn-primary">Write announcement</button>
            ) : null
          }
        />

        {showComposer && canPost ? (
          <form onSubmit={saveAnnouncement} className="panel space-y-4">
            <h2 className="title text-xl">{editingId ? 'Edit announcement' : 'New announcement'}</h2>
            <label className="label">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="e.g. Friday schedule change" className="input mt-1.5" />
            </label>
            <label className="label">
              Message
              <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={6} required className="input mt-1.5" />
            </label>
            <label className="flex items-center gap-2.5 text-[15px] text-slate-800">
              <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} className="h-4 w-4" />
              Pin to the top
            </label>
            {error ? <p role="alert" className="note note-error">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Post to class'}</button>
              <button type="button" onClick={cancelEditing} className="btn">Cancel</button>
            </div>
          </form>
        ) : null}

        {!user && !loading ? (
          <p className="note note-info">
            These are examples. <Link href="/auth" className="font-medium underline underline-offset-4">Sign in</Link> to read your class’s announcements.
          </p>
        ) : null}

        {error && !showComposer ? <p role="alert" className="note note-error">{error}</p> : null}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="panel text-slate-600">No announcements yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 border-t-2 border-slate-900">
            {items.map((item) => (
              <article key={item.id || item.slug} className="py-5">
                <h2 className="title text-xl">
                  <Link href={`/announcements/${item.isSample ? item.slug : item.id}`} className="underline-offset-4 hover:underline">{item.title}</Link>
                  {item.pinned ? <span className="chip ml-2 bg-slate-900 align-middle font-sans text-paper">Pinned</span> : null}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                <p className="mt-2 line-clamp-4 max-w-prose whitespace-pre-wrap text-base leading-7 text-slate-700">{item.content}</p>
                {canPost && !item.isSample ? (
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => editAnnouncement(item)} className="btn btn-sm">Edit</button>
                    <button type="button" onClick={() => void removeAnnouncement(item)} className="btn btn-danger btn-sm">Delete</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
