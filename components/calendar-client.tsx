'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  isPublic: boolean;
  createdBy: string;
};

const eventTypes = ['Homework', 'Test', 'Reminder', 'Event'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

export function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toDateKey(new Date()));
  const [time, setTime] = useState('');
  const [type, setType] = useState(eventTypes[3]);
  const [isPublic, setIsPublic] = useState(false);

  const loadEvents = useCallback(async (currentUser: User | null) => {
    const db = getFirebaseDb();
    if (!db) {
      setEvents([]);
      setError('Firebase is not configured, so calendar events cannot be loaded.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const eventsRef = collection(db, 'events');
      const publicQuery = query(eventsRef, where('isPublic', '==', true));
      const publicSnapshot = await getDocs(publicQuery);
      const visibleEvents = new Map<string, CalendarEvent>();

      for (const item of publicSnapshot.docs) {
        const data = item.data();
        if (!data.archived) {
          visibleEvents.set(item.id, {
            id: item.id,
            title: data.title,
            description: data.description || '',
            date: data.date,
            time: data.time || '',
            type: data.type || 'Event',
            isPublic: true,
            createdBy: data.createdBy || '',
          });
        }
      }

      if (currentUser) {
        const privateQuery = query(
          eventsRef,
          where('createdBy', '==', currentUser.uid),
          where('isPublic', '==', false),
        );
        const privateSnapshot = await getDocs(privateQuery);
        for (const item of privateSnapshot.docs) {
          const data = item.data();
          if (!data.archived) {
            visibleEvents.set(item.id, {
              id: item.id,
              title: data.title,
              description: data.description || '',
              date: data.date,
              time: data.time || '',
              type: data.type || 'Event',
              isPublic: false,
              createdBy: data.createdBy || '',
            });
          }
        }
      }

      setEvents(Array.from(visibleEvents.values()).sort((a, b) =>
        `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`),
      ));
    } catch (loadError) {
      setEvents([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load calendar events. Check Firestore and its security rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      void loadEvents(null);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      void loadEvents(null);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      void loadEvents(currentUser);
    });
  }, [loadEvents]);

  const cells = useMemo(() => getMonthCells(month), [month]);
  const upcomingEvents = events.filter((event) => event.date >= toDateKey(new Date()));

  const handleSaveEvent = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      setError('Sign in to add a calendar event.');
      return;
    }
    if (!title.trim() || !date) {
      setError('Add an event title and date.');
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const eventData = {
        title: title.trim().slice(0, 100),
        description: description.trim().slice(0, 500),
        date,
        time,
        type,
        isPublic,
        updatedAt: now,
      };
      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), eventData);
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdBy: user.uid,
          createdAt: now,
          archived: false,
        });
      }
      await loadEvents(user);
      setTitle('');
      setDescription('');
      setTime('');
      setType(eventTypes[3]);
      setIsPublic(false);
      setEditingEventId(null);
      setShowForm(false);
      setMessage(editingEventId ? 'Event updated.' : isPublic ? 'Public class event added.' : 'Private event added to your calendar.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this event. Check Firestore security rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = (item: CalendarEvent) => {
    setEditingEventId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setDate(item.date);
    setTime(item.time);
    setType(item.type);
    setIsPublic(item.isPublic);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleDeleteEvent = async (item: CalendarEvent) => {
    if (!user || !window.confirm(`Delete "${item.title}" from your calendar?`)) return;
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }

    setDeletingEventId(item.id);
    setError('');
    setMessage('');
    try {
      await deleteDoc(doc(db, 'events', item.id));
      setEvents((current) => current.filter((eventItem) => eventItem.id !== item.id));
      setMessage('Event deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this event. Check Firestore security rules.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const startNewEvent = () => {
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    setDate(toDateKey(new Date()));
    setTime('');
    setType(eventTypes[3]);
    setIsPublic(false);
    setShowForm((current) => !current);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <div>
          <p className="text-sm text-slate-500">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
          <p className="text-lg font-semibold text-slate-900">{events.length} visible events</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button aria-label="Previous month" title="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m12 4-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setMonth(new Date())} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Today</button>
          <button aria-label="Next month" title="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m8 4 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={startNewEvent} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">+ Add event</button>
        </div>
      </div>

      {message ? <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p> : null}

      {showForm ? (
        <form onSubmit={handleSaveEvent} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{editingEventId ? 'Edit event' : 'New event'}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{editingEventId ? 'Update calendar event' : 'Add to calendar'}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Title
              <input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" placeholder="e.g. Science fair" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Date
              <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Time (optional)
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Type
              <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500">
                {eventTypes.map((eventType) => <option key={eventType}>{eventType}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Notes (optional)
              <textarea maxLength={500} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500" />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-slate-700">Who can see this?</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-2xl border p-4 ${!isPublic ? 'border-sky-300 bg-sky-50' : 'border-slate-200'}`}>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <input type="radio" name="event-privacy" checked={!isPublic} onChange={() => setIsPublic(false)} />
                    Private — only me
                  </span>
                  <span className="mt-1 block pl-6 text-xs text-slate-500">Visible only in your calendar.</span>
                </label>
                <label className={`cursor-pointer rounded-2xl border p-4 ${isPublic ? 'border-sky-300 bg-sky-50' : 'border-slate-200'}`}>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <input type="radio" name="event-privacy" checked={isPublic} onChange={() => setIsPublic(true)} />
                    Public — class members
                  </span>
                  <span className="mt-1 block pl-6 text-xs text-slate-500">Visible to signed-in members who can access the class.</span>
                </label>
              </div>
            </fieldset>
          </div>
          {!user ? <p className="mt-4 text-sm text-amber-800">Sign in with Google before saving an event.</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingEventId(null); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={saving || !user} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : editingEventId ? 'Save changes' : 'Save event'}</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.65fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:p-6">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:gap-2">
            {weekDays.map((day) => <div key={day} className="py-2">{day}</div>)}
          </div>
          {loading ? (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100 sm:h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map(({ date: cellDate, inMonth }) => {
                const key = toDateKey(cellDate);
                const dayEvents = events.filter((item) => item.date === key);
                const today = key === toDateKey(new Date());
                return (
                  <div key={key} className={`min-h-20 rounded-xl border p-1.5 sm:min-h-24 sm:rounded-2xl sm:p-2 ${inMonth ? 'border-slate-200 bg-slate-50' : 'border-transparent bg-slate-50/50'} ${today ? 'ring-2 ring-sky-400' : ''}`}>
                    <span className={`text-xs font-medium ${inMonth ? 'text-slate-700' : 'text-slate-300'}`}>{cellDate.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((item) => (
                        <div key={item.id} title={`${item.title}${item.isPublic ? ' · Public' : ' · Private'}`} className={`truncate rounded px-1 py-1 text-[9px] font-semibold sm:px-1.5 sm:text-[10px] ${item.isPublic ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>
                          {item.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 ? <p className="text-[9px] text-slate-500">+{dayEvents.length - 2} more</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Your schedule</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Upcoming</h2>
          <div className="mt-4 space-y-3">
            {upcomingEvents.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}{item.time ? ` · ${item.time}` : ''}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.isPublic ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>{item.isPublic ? 'Class' : 'Private'}</span>
                </div>
                {item.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p> : null}
                {user?.uid === item.createdBy ? (
                  <div className="mt-3 flex justify-end gap-2 border-t border-slate-200 pt-3">
                    <button type="button" onClick={() => handleEditEvent(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50">Edit</button>
                    <button type="button" onClick={() => handleDeleteEvent(item)} disabled={deletingEventId === item.id} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{deletingEventId === item.id ? 'Deleting…' : 'Delete'}</button>
                  </div>
                ) : null}
              </article>
            ))}
            {!loading && upcomingEvents.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No upcoming events yet.</p> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
