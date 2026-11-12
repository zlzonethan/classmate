'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
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
          // The class's own list (Class settings → Subjects) replaces the
          // starter list once it has any subjects, including hidden ones.
          const snapshot = await getDocs(collection(db, 'subjects'));
          const saved = snapshot.docs
            .map((item) => ({ id: item.id, name: String(item.data().name || ''), archived: Boolean(item.data().archived) }))
            .filter((item) => item.name);
          setSubjects(saved.length
            ? saved.filter((item) => !item.archived).sort((a, b) => a.name.localeCompare(b.name))
            : defaultSubjects);
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
    const subjectName = form.subjectId.trim().slice(0, 40);
    if (!subjectName) {
      setStatus({ type: 'error', message: 'Enter a subject name.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const existingSubject = subjects.find((subject) => subject.name.toLowerCase() === subjectName.toLowerCase());
      const savedSubjectName = existingSubject?.name || subjectName;
      if (!existingSubject) {
        const subjectRef = await addDoc(collection(db, 'subjects'), {
          name: subjectName,
          color: '#0ea5e9',
          archived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
        });
        setSubjects((current) => [...current, { id: subjectRef.id, name: subjectName }]);
      }
      const homeworkRef = doc(collection(db, 'homework'));
      const homeworkData = {
        ...form,
        subjectId: savedSubjectName,
        title: form.title.trim(),
        description: form.description.trim(),
        attachmentUrls: [],
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
        archived: false,
      };
      const batch = writeBatch(db);
      batch.set(homeworkRef, homeworkData);
      batch.set(doc(db, 'events', `homework_${homeworkRef.id}`), {
        title: `Homework: ${homeworkData.title}`.slice(0, 100),
        description: `${savedSubjectName} assignment due ${form.dueDate}. ${form.description.trim()}`.slice(0, 500),
        date: form.dueDate,
        time: form.dueTime,
        type: 'Homework',
        isPublic: true,
        createdBy: user.uid,
        homeworkId: homeworkRef.id,
        createdAt: now,
        updatedAt: now,
        archived: false,
      });
      await batch.commit();
      setStatus({ type: 'success', message: `Assignment published: ${form.title.trim()}` });
      setForm({ ...initialValues, subjectId: savedSubjectName });
    } catch (saveError) {
      setStatus({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Could not create homework. Check your class role and Firestore rules.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="panel">
      {!loading && !user ? <p className="mb-5 note note-info">Sign in with Google to publish an assignment.</p> : null}
      {!loading && user && !canManage ? <p className="mb-5 note note-warn">Class assignments can be published by the class president or a teacher. Ask your class administrator to set your role.</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label mb-1.5">Title</label>
          <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="input" placeholder="Algebra worksheet" required />
        </div>
        <div className="md:col-span-2">
          <label className="label mb-1.5">Description</label>
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="min-h-[112px] input" placeholder="Complete pages 42–43 and show all work." required />
        </div>

        <div>
          <label className="label mb-1.5">Subject</label>
          <input
            value={form.subjectId}
            onChange={(event) => updateField('subjectId', event.target.value)}
            list="class-subject-options"
            maxLength={40}
            placeholder="Choose or type a subject, e.g. Korean"
            className="input"
            required
          />
          <datalist id="class-subject-options">
            {subjects.map((subject) => <option key={subject.id} value={subject.name} />)}
          </datalist>
          <p className="mt-1.5 text-sm text-slate-500">Pick a suggestion or type any subject. New subjects are saved for the class when you publish.</p>
        </div>
        <div>
          <label className="label mb-1.5">Priority</label>
          <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} className="input">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label mb-1.5">Due date</label>
          <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} className="input" required />
        </div>
        <div>
          <label className="label mb-1.5">Due time</label>
          <input type="time" value={form.dueTime} onChange={(event) => updateField('dueTime', event.target.value)} className="input" />
        </div>
      </div>

      {status ? <div role={status.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-md border px-3 py-2 text-sm ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-accent-200 bg-accent-50 text-accent-700'}`}>{status.message}</div> : null}

      <button type="submit" disabled={isSubmitting || loading || !user || !canManage} className="mt-6 w-full btn btn-primary">
        {isSubmitting ? 'Saving…' : 'Publish assignment'}
      </button>
    </form>
  );
}
