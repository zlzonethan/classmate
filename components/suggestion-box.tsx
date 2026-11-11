'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useClassSettings } from '@/lib/class-settings';
import { getFirebaseDb } from '@/lib/firebase';
import { formatDay } from '@/lib/format';
import { useCurrentUser } from '@/lib/use-current-user';

// Keep in sync with the `suggestions` rule in firestore.rules.
const categories = ['Classroom', 'Homework', 'Events', 'Other'] as const;
const MAX_LENGTH = 2000;

type Suggestion = {
  id: string;
  content: string;
  category: string;
  anonymous: boolean;
  authorName: string;
  status: 'OPEN' | 'DONE';
  createdAt: string;
};

function SuggestionForm() {
  const { user, displayName } = useCurrentUser();
  const { settings } = useClassSettings();
  const [category, setCategory] = useState<string>(categories[0]);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const db = getFirebaseDb();
    const text = content.trim();
    if (!user || !db || !text) return;

    setSending(true);
    setError('');
    try {
      const sendAnonymously = anonymous && settings.anonymousSuggestions;
      const now = new Date().toISOString();
      await addDoc(collection(db, 'suggestions'), {
        content: text.slice(0, MAX_LENGTH),
        category,
        anonymous: sendAnonymously,
        // An anonymous suggestion stores nothing that identifies the sender.
        createdBy: sendAnonymously ? null : user.uid,
        authorName: sendAnonymously ? '' : displayName.slice(0, 80),
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
      });
      setContent('');
      setSent(true);
    } catch {
      setError('Could not send your suggestion. Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="panel">
        <h2 className="font-semibold text-slate-900">Sent. Thank you.</h2>
        <p className="mt-1 text-[15px] text-slate-600">The class president and teacher will read it.</p>
        <button type="button" onClick={() => setSent(false)} className="btn mt-4">Write another</button>
      </section>
    );
  }

  return (
    <form onSubmit={send} className="panel space-y-4">
      <label className="label">
        What is it about?
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="input mt-1.5 sm:w-56">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>

      <label className="label">
        Your suggestion
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_LENGTH}
          rows={6}
          required
          placeholder="What should change, and why?"
          className="input mt-1.5"
        />
        <span className="mt-1 block text-right text-xs font-normal text-slate-500">{content.length}/{MAX_LENGTH}</span>
      </label>

      {settings.anonymousSuggestions ? (
        <label className="flex items-start gap-2.5 text-[15px] text-slate-800">
          <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-1 h-4 w-4" />
          <span>
            Send without my name
            <span className="block text-sm text-slate-500">
              {anonymous ? 'Your name and account will not be saved with this suggestion.' : `It will be sent as ${displayName}.`}
            </span>
          </span>
        </label>
      ) : (
        <p className="text-sm text-slate-600">Your class has anonymous suggestions turned off, so this will be sent as {displayName}.</p>
      )}

      {error ? <p role="alert" className="note note-error">{error}</p> : null}

      <button type="submit" disabled={sending || !content.trim()} className="btn btn-primary">
        {sending ? 'Sending…' : 'Send suggestion'}
      </button>
    </form>
  );
}

function SuggestionInbox() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const db = getFirebaseDb();
    if (!db) return;
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'suggestions'));
      setItems(snapshot.docs
        .map((item) => {
          const data = item.data();
          return {
            id: item.id,
            content: data.content || '',
            category: data.category || 'Other',
            anonymous: Boolean(data.anonymous),
            authorName: data.authorName || '',
            status: data.status === 'DONE' ? 'DONE' as const : 'OPEN' as const,
            createdAt: data.createdAt || '',
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      setError('Could not load suggestions. If this keeps happening, the Firestore rules may not be deployed yet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (item: Suggestion, status: Suggestion['status']) => {
    const db = getFirebaseDb();
    if (!db) return;
    setBusyId(item.id);
    setError('');
    try {
      await updateDoc(doc(db, 'suggestions', item.id), { status, updatedAt: new Date().toISOString() });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    } catch {
      setError('Could not update that suggestion.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: Suggestion) => {
    if (!window.confirm('Delete this suggestion? This cannot be undone.')) return;
    const db = getFirebaseDb();
    if (!db) return;
    setBusyId(item.id);
    setError('');
    try {
      await deleteDoc(doc(db, 'suggestions', item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch {
      setError('Could not delete that suggestion.');
    } finally {
      setBusyId(null);
    }
  };

  const openCount = items.filter((item) => item.status === 'OPEN').length;
  const doneCount = items.length - openCount;
  const visible = items.filter((item) => (showDone ? item.status === 'DONE' : item.status === 'OPEN'));

  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
        <div className="flex gap-1" role="group" aria-label="Show">
          <button type="button" aria-pressed={!showDone} onClick={() => setShowDone(false)} className={`rounded-md px-2.5 py-1.5 text-sm ${!showDone ? 'bg-slate-800 font-medium text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            To read ({openCount})
          </button>
          <button type="button" aria-pressed={showDone} onClick={() => setShowDone(true)} className={`rounded-md px-2.5 py-1.5 text-sm ${showDone ? 'bg-slate-800 font-medium text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            Handled ({doneCount})
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="note note-error mt-3">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-slate-500">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-slate-600">{showDone ? 'Nothing handled yet.' : 'No new suggestions.'}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-200">
          {visible.map((item) => (
            <li key={item.id} className="py-4">
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-800">{item.anonymous || !item.authorName ? 'Anonymous' : item.authorName}</span>
                {' · '}{item.category}{item.createdAt ? ` · ${formatDay(item.createdAt)}` : ''}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-900">{item.content}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busyId === item.id} onClick={() => void setStatus(item, item.status === 'OPEN' ? 'DONE' : 'OPEN')} className="btn btn-sm">
                  {item.status === 'OPEN' ? 'Mark as handled' : 'Move back to To read'}
                </button>
                <button type="button" disabled={busyId === item.id} onClick={() => void remove(item)} className="btn btn-danger btn-sm">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SuggestionBox() {
  const { user, isStaff, loading, configured } = useCurrentUser();
  const { settings, loading: settingsLoading } = useClassSettings();
  const [writing, setWriting] = useState(false);

  if (loading || (user && settingsLoading)) return <p className="text-slate-500">Loading…</p>;

  if (!configured) {
    return <p className="note note-warn">The suggestion box needs Firebase to be connected.</p>;
  }

  if (!user) {
    return (
      <p className="note note-info">
        <Link href="/auth" className="font-medium underline">Sign in</Link> to send a suggestion.
      </p>
    );
  }

  if (!isStaff) {
    return settings.suggestionsEnabled
      ? <SuggestionForm />
      : <p className="note note-info">The suggestion box is turned off for now.</p>;
  }

  return (
    <div className="space-y-5">
      {!settings.suggestionsEnabled ? (
        <p className="note note-warn">
          The suggestion box is off, so students can’t send new suggestions. Turn it on in <Link href="/settings#features" className="font-medium underline">Class settings</Link>.
        </p>
      ) : null}
      <SuggestionInbox />
      {!settings.suggestionsEnabled ? null : writing ? (
        <SuggestionForm />
      ) : (
        <button type="button" onClick={() => setWriting(true)} className="btn">Write a suggestion yourself</button>
      )}
    </div>
  );
}
