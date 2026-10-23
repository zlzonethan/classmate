'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

type Subject = {
  id: string;
  name: string;
};

const defaultSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics' },
  { id: 'science', name: 'Science' },
  { id: 'english', name: 'English' },
  { id: 'history', name: 'History' },
  { id: 'spanish', name: 'Spanish' },
];

type HomeworkFormValues = {
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
};

const initialValues: HomeworkFormValues = {
  title: '',
  description: '',
  subjectId: '',
  dueDate: '',
  dueTime: '20:00',
  priority: 'medium' as const,
};

export function HomeworkForm() {
  const [form, setForm] = useState(initialValues);
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [newSubject, setNewSubject] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      try {
        const db = getFirebaseDb();
        if (!db) throw new Error('Firebase is not configured.');
        if (currentUser) {
          const profile = await getDoc(doc(db, 'users', currentUser.uid));
          setRole(profile.data()?.role || 'STUDENT');
          const snapshot = await getDocs(query(collection(db, 'subjects'), where('archived', '==', false)));
          const savedSubjects = snapshot.docs.map((item) => ({ id: item.id, name: item.data().name as string }));
          setSubjects([...defaultSubjects, ...savedSubjects.filter((item) => !defaultSubjects.some((fallback) => fallback.name.toLowerCase() === item.name?.toLowerCase()))]);
        } else {
          setRole('STUDENT');
          setSubjects(defaultSubjects);
        }
      } catch (loadError) {
        setStatus({ type: 'error', message: loadError instanceof Error ? loadError.message : 'Could not load subjects.' });
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!form.subjectId && subjects.length) {
      setForm((current) => ({ ...current, subjectId: subjects[0].name }));
    }
  }, [form.subjectId, subjects]);

  const canManage = role === 'CLASS_PRESIDENT' || role === 'TEACHER';

  const updateField = (field: keyof HomeworkFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addSubject = async (event: FormEvent) => {
    event.preventDefault();
    const name = newSubject.trim().slice(0, 40);
    if (!name || !user || !canManage) return;
    if (subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())) {
      setStatus({ type: 'error', message: 'That subject already exists.' });
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setStatus({ type: 'error', message: 'Firebase is not configured.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    try {
      const now = new Date().toISOString();
      const subjectRef = await addDoc(collection(db, 'subjects'), {
        name,
        color: '#0ea5e9',
        archived: false,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      });
      setSubjects((current) => [...current, { id: subjectRef.id, name }]);
      setForm((current) => ({ ...current, subjectId: name }));
      setNewSubject('');
      setStatus({ type: 'success', message: `${name} was added to the class subjects.` });
    } catch (saveError) {
      setStatus({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Could not add this subject.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!user) {
      setStatus({ type: 'error', message: 'Sign in before creating an assignment.' });
      return;
    }
    if (!canManage) {
      setStatus({ type: 'error', message: 'Only class presidents and teachers can publish class assignments.' });
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setStatus({ type: 'error', message: 'Firebase is not configured.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'homework'), {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        attachmentUrls: [],
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
        archived: false,
      });
      setStatus({ type: 'success', message: `Assignment published: ${form.title.trim()}` });
      setForm({ ...initialValues, subjectId: subjects[0]?.name || '' });
    } catch (saveError) {
      setStatus({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Could not create homework. Check your class role and Firestore rules.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Create assignment</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">New homework</h2>
      </div>

      {!loading && !user ? <p className="mb-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-800">Sign in with Google to publish an assignment.</p> : null}
      {!loading && user && !canManage ? <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Class assignments can be published by the class president or a teacher. Ask your class administrator to set your role.</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500" placeholder="Algebra worksheet" required />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="min-h-[112px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500" placeholder="Complete pages 42–43 and show all work." required />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
          <select value={form.subjectId} onChange={(event) => updateField('subjectId', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500" required>
            {subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
          <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due time</label>
          <input type="time" value={form.dueTime} onChange={(event) => updateField('dueTime', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500" />
        </div>
      </div>

      {canManage ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Add a class subject</p>
          <p className="mt-1 text-xs text-slate-500">Saved for the whole class and available in future assignments.</p>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="new-class-subject">Subject name</label>
            <input id="new-class-subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} maxLength={40} placeholder="e.g. Korean" className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-500" />
            <button type="button" onClick={addSubject} disabled={isSubmitting || !newSubject.trim()} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Add subject</button>
          </div>
        </div>
      ) : null}

      {status ? <div role={status.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-3 py-2 text-sm ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>{status.message}</div> : null}

      <button type="submit" disabled={isSubmitting || loading || !user || !canManage} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70">
        {isSubmitting ? 'Saving…' : 'Publish assignment'}
      </button>
    </form>
  );
}
