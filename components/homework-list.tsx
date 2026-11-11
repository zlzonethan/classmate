'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, runTransaction, where, writeBatch } from 'firebase/firestore';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { getClassHomework } from '@/lib/homework-client';
import { formatDue } from '@/lib/format';

type HomeworkEvidence = {
  id: string;
  name: string;
  dataUrl: string;
};

type HomeworkSubmission = {
  id: string;
  uid: string;
  studentName: string;
  homeworkId: string;
  homeworkTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  evidence: HomeworkEvidence[];
};

type HomeworkEditValues = {
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
};

const subjectLabels: Record<string, string> = {
  math: 'Mathematics',
  science: 'Science',
  english: 'English',
  history: 'History',
  spanish: 'Spanish',
};

function getSubjectName(subjectId: string) {
  return subjectLabels[subjectId.toLowerCase()] || subjectId;
}

async function loadEvidence(db: NonNullable<ReturnType<typeof getFirebaseDb>>, submissionId: string): Promise<HomeworkEvidence[]> {
  const snapshot = await getDocs(collection(db, 'homeworkSubmissions', submissionId, 'evidence'));
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: item.data().name,
    dataUrl: item.data().dataUrl,
  }));
}

export function HomeworkList() {
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [user, setUser] = useState<User | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<HomeworkEditValues | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured, so assignments cannot be loaded.');
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase authentication is unavailable.');
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      setSignedIn(Boolean(user));
      setUser(user);
      setLoading(true);
      setError(null);
      if (!user) {
        setItems([]);
        setSubmissions([]);
        setCanReview(false);
        setLoading(false);
        return;
      }
      try {
        const db = getFirebaseDb();
        if (!db) throw new Error('Firebase is not configured.');
        const [records, profile] = await Promise.all([
          getClassHomework(),
          getDoc(doc(db, 'users', user.uid)),
        ]);
        setItems(records.filter((item) => !item.archived).sort((a, b) =>
          `${a.dueDate}T${a.dueTime || '23:59'}`.localeCompare(`${b.dueDate}T${b.dueTime || '23:59'}`),
        ));
        const reviewer = ['CLASS_PRESIDENT', 'TEACHER'].includes(profile.data()?.role || '');
        setCanReview(reviewer);
        const submissionQuery = reviewer
          ? query(collection(db, 'homeworkSubmissions'), where('status', '==', 'PENDING'))
          : query(collection(db, 'homeworkSubmissions'), where('uid', '==', user.uid));
        const submissionSnapshot = await getDocs(submissionQuery);
        const ownSnapshot = reviewer
          ? await getDocs(query(collection(db, 'homeworkSubmissions'), where('uid', '==', user.uid)))
          : null;
        const allSubmissions = new Map([...submissionSnapshot.docs, ...(ownSnapshot?.docs || [])].map((submission) => [submission.id, submission]));
        setSubmissions(await Promise.all(Array.from(allSubmissions.values()).map(async (submission) => ({
          id: submission.id,
          uid: submission.data().uid,
          studentName: submission.data().studentName || submission.data().uid,
          homeworkId: submission.data().homeworkId,
          homeworkTitle: submission.data().homeworkTitle,
          status: submission.data().status,
          createdAt: submission.data().createdAt,
          evidence: await loadEvidence(db, submission.id),
        }))));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load class assignments.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const subjects = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => getSubjectName(item.subjectId))))], [items]);
  const visibleItems = selectedSubject === 'All'
    ? items
    : items.filter((item) => getSubjectName(item.subjectId) === selectedSubject);
  const pendingSubmissions = submissions.filter((submission) =>
    submission.status === 'PENDING' && submission.uid !== user?.uid,
  );

  const startEditingHomework = (homework: HomeworkRecord) => {
    if (!homework.id) return;
    setEditingHomeworkId(homework.id);
    setEditValues({
      title: homework.title,
      description: homework.description,
      subjectId: homework.subjectId,
      dueDate: homework.dueDate,
      dueTime: homework.dueTime || '',
      priority: homework.priority,
    });
    setActionError('');
    setActionMessage('');
  };

  const saveHomeworkEdits = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !editingHomeworkId || !editValues) return;
    const db = getFirebaseDb();
    if (!db) {
      setActionError('Firebase is not configured.');
      return;
    }
    const title = editValues.title.trim();
    const description = editValues.description.trim();
    const subjectId = editValues.subjectId.trim().slice(0, 40);
    if (!title || !description || !subjectId || !editValues.dueDate) {
      setActionError('Complete the title, description, subject, and due date.');
      return;
    }

    setSubmittingId(editingHomeworkId);
    setActionError('');
    setActionMessage('');
    try {
      const homeworkRef = doc(db, 'homework', editingHomeworkId);
      const calendarRef = doc(db, 'events', `homework_${editingHomeworkId}`);
      const calendarSnapshot = await getDoc(calendarRef);
      const subjectSnapshot = await getDocs(query(collection(db, 'subjects'), where('archived', '==', false)));
      const now = new Date().toISOString();
      const updatedHomework = {
        title,
        description,
        subjectId,
        dueDate: editValues.dueDate,
        dueTime: editValues.dueTime,
        priority: editValues.priority,
        updatedAt: now,
      };
      const batch = writeBatch(db);
      batch.update(homeworkRef, updatedHomework);
      if (!subjectSnapshot.docs.some((subject) => subject.data().name?.toLowerCase() === subjectId.toLowerCase())) {
        batch.set(doc(collection(db, 'subjects')), {
          name: subjectId,
          color: '#0ea5e9',
          archived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
        });
      }
      batch.set(calendarRef, {
        title: `Homework: ${title}`.slice(0, 100),
        description: `${subjectId} assignment due ${editValues.dueDate}. ${description}`.slice(0, 500),
        date: editValues.dueDate,
        time: editValues.dueTime,
        type: 'Homework',
        isPublic: true,
        createdBy: calendarSnapshot.exists() ? calendarSnapshot.data().createdBy : user.uid,
        homeworkId: editingHomeworkId,
        createdAt: calendarSnapshot.exists() ? calendarSnapshot.data().createdAt : now,
        updatedAt: now,
        archived: false,
      });
      await batch.commit();
      setItems((current) => current.map((item) => item.id === editingHomeworkId
        ? { ...item, ...updatedHomework }
        : item));
      setEditingHomeworkId(null);
      setEditValues(null);
      setActionMessage('Homework and its public calendar due date were updated.');
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not update homework and its calendar event.');
    } finally {
      setSubmittingId(null);
    }
  };

  const deleteHomework = async (homework: HomeworkRecord) => {
    if (!user || !canReview || !homework.id) return;
    if (!window.confirm(`Delete "${homework.title}" and its public calendar event? This cannot be undone.`)) return;
    const db = getFirebaseDb();
    if (!db) {
      setActionError('Firebase is not configured.');
      return;
    }
    setSubmittingId(homework.id);
    setActionError('');
    setActionMessage('');
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'homework', homework.id));
      const calendarRef = doc(db, 'events', `homework_${homework.id}`);
      if ((await getDoc(calendarRef)).exists()) batch.delete(calendarRef);
      await batch.commit();
      setItems((current) => current.filter((item) => item.id !== homework.id));
      setSubmissions((current) => current.filter((submission) => submission.homeworkId !== homework.id));
      if (editingHomeworkId === homework.id) {
        setEditingHomeworkId(null);
        setEditValues(null);
      }
      setActionMessage('Homework and its public calendar event were deleted.');
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Could not delete homework and its calendar event.');
    } finally {
      setSubmittingId(null);
    }
  };

  const reviewSubmission = async (submission: HomeworkSubmission, decision: 'APPROVED' | 'REJECTED') => {
    if (!user || !canReview) return;
    const db = getFirebaseDb();
    if (!db) {
      setActionError('Firebase is not configured.');
      return;
    }
    setSubmittingId(submission.id);
    setActionError('');
    setActionMessage('');
    try {
      await runTransaction(db, async (transaction) => {
        const submissionRef = doc(db, 'homeworkSubmissions', submission.id);
        const current = await transaction.get(submissionRef);
        if (!current.exists() || current.data().status !== 'PENDING') {
          throw new Error('This submission has already been reviewed.');
        }
        const now = new Date().toISOString();
        transaction.update(submissionRef, {
          status: decision,
          reviewedBy: user.uid,
          reviewedAt: now,
        });
        if (decision === 'APPROVED') {
          transaction.set(doc(db, 'xpTransactions', submission.id), {
            uid: current.data().uid,
            homeworkId: current.data().homeworkId,
            submissionId: submission.id,
            amount: 10,
            reason: 'Approved homework completion',
            createdAt: now,
          });
        }
      });
      setActionMessage(decision === 'APPROVED' ? 'Approved. 10 XP has been awarded.' : 'Submission rejected. The student can submit it again.');
      await refreshSubmissions(user, true);
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : 'Could not review this submission.');
    } finally {
      setSubmittingId(null);
    }
  };

  const refreshSubmissions = async (currentUser: User, reviewer: boolean) => {
    const db = getFirebaseDb();
    if (!db) return;
    const submissionQuery = reviewer
      ? query(collection(db, 'homeworkSubmissions'), where('status', '==', 'PENDING'))
      : query(collection(db, 'homeworkSubmissions'), where('uid', '==', currentUser.uid));
    const snapshot = await getDocs(submissionQuery);
    const ownSnapshot = reviewer
      ? await getDocs(query(collection(db, 'homeworkSubmissions'), where('uid', '==', currentUser.uid)))
      : null;
    const allSubmissions = new Map([...snapshot.docs, ...(ownSnapshot?.docs || [])].map((submission) => [submission.id, submission]));
    setSubmissions(await Promise.all(Array.from(allSubmissions.values()).map(async (submission) => ({
      id: submission.id,
      uid: submission.data().uid,
      studentName: submission.data().studentName || submission.data().uid,
      homeworkId: submission.data().homeworkId,
      homeworkTitle: submission.data().homeworkTitle,
      status: submission.data().status,
      createdAt: submission.data().createdAt,
      evidence: await loadEvidence(db, submission.id),
    }))));
  };

  if (loading) {
    return <p className="text-slate-500">Loading homework…</p>;
  }

  if (error) {
    return <p role="alert" className="note note-error">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {actionError ? <p role="alert" className="note note-error">{actionError}</p> : null}
      {actionMessage ? <p role="status" className="note note-ok">{actionMessage}</p> : null}

      {editingHomeworkId && editValues ? (
        <form onSubmit={saveHomeworkEdits} className="panel space-y-4 border-accent-300">
          <h2 className="text-xl font-semibold text-slate-900">Edit homework</h2>
          <label className="label">
            Title
            <input value={editValues.title} onChange={(event) => setEditValues({ ...editValues, title: event.target.value })} maxLength={120} required className="mt-1.5 input" />
          </label>
          <label className="label">
            Description
            <textarea value={editValues.description} onChange={(event) => setEditValues({ ...editValues, description: event.target.value })} maxLength={5000} rows={4} required className="mt-1.5 input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              Subject
              <input value={editValues.subjectId} onChange={(event) => setEditValues({ ...editValues, subjectId: event.target.value })} maxLength={40} required className="mt-1.5 input" />
            </label>
            <label className="label">
              Priority
              <select value={editValues.priority} onChange={(event) => setEditValues({ ...editValues, priority: event.target.value as HomeworkEditValues['priority'] })} className="mt-1.5 input">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
            <label className="label">
              Due date
              <input type="date" value={editValues.dueDate} onChange={(event) => setEditValues({ ...editValues, dueDate: event.target.value })} required className="mt-1.5 input" />
            </label>
            <label className="label">
              Due time
              <input type="time" value={editValues.dueTime} onChange={(event) => setEditValues({ ...editValues, dueTime: event.target.value })} className="mt-1.5 input" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submittingId === editingHomeworkId} className="btn btn-primary">{submittingId === editingHomeworkId ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={() => { setEditingHomeworkId(null); setEditValues(null); }} className="btn">Cancel</button>
          </div>
        </form>
      ) : null}

      {canReview && pendingSubmissions.length > 0 ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-slate-900">Waiting for your review ({pendingSubmissions.length})</h2>
          <ul className="mt-3 space-y-3">
            {pendingSubmissions.map((submission) => (
              <li key={submission.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{submission.studentName}</p>
                    <p className="text-sm text-slate-600">{submission.homeworkTitle}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={submittingId === submission.id} onClick={() => void reviewSubmission(submission, 'APPROVED')} className="btn btn-primary">Approve (+10 XP)</button>
                    <button type="button" disabled={submittingId === submission.id} onClick={() => void reviewSubmission(submission, 'REJECTED')} className="btn btn-danger">Reject</button>
                  </div>
                </div>
                {submission.evidence.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.evidence.map((file) => (
                      <a key={file.id} href={file.dataUrl} target="_blank" rel="noreferrer" title={`Open ${file.name}`}>
                        <NextImage src={file.dataUrl} alt={file.name} width={96} height={96} unoptimized className="h-24 w-24 rounded-md border border-slate-200 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-amber-800">No photo attached.</p>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!signedIn ? (
        <p className="note note-info">
          <Link href="/auth" className="font-medium underline">Sign in</Link> to see your class homework.
        </p>
      ) : items.length === 0 ? (
        <p className="panel text-center text-slate-600">No homework has been posted yet.</p>
      ) : (
        <section className="panel">
          {subjects.length > 2 ? (
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by subject">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setSelectedSubject(subject)}
                  aria-pressed={selectedSubject === subject}
                  className={`rounded-md px-2.5 py-1.5 text-sm ${selectedSubject === subject ? 'bg-slate-800 font-medium text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {subject}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="divide-y divide-slate-200">
            {visibleItems.map((item) => {
              const due = formatDue(item.dueDate, item.dueTime);
              const submission = user && item.id
                ? submissions.find((entry) => entry.uid === user.uid && entry.homeworkId === item.id)
                : undefined;
              const href = `/homework/${item.id ?? encodeURIComponent(item.title)}`;
              return (
                <li key={item.id || item.title} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <Link href={href} className="font-medium text-slate-900 hover:underline">{item.title}</Link>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {getSubjectName(item.subjectId)}
                      <span className="text-slate-400"> · </span>
                      <span className={due.urgent ? 'font-medium text-red-700' : ''}>{due.label}</span>
                      {item.priority === 'high' ? <span className="chip ml-2 bg-red-50 text-red-700">Important</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {submission?.status === 'APPROVED' ? (
                      <span className="chip bg-emerald-50 text-emerald-800">Done</span>
                    ) : submission?.status === 'PENDING' ? (
                      <span className="chip bg-amber-50 text-amber-800">Waiting for review</span>
                    ) : (
                      <Link href={href} className="btn btn-sm">
                        {submission?.status === 'REJECTED' ? 'Rejected · resubmit' : 'Submit proof'}
                      </Link>
                    )}
                    {canReview && item.id ? (
                      <>
                        <button type="button" onClick={() => startEditingHomework(item)} className="btn btn-sm">Edit</button>
                        <button type="button" disabled={submittingId === item.id} onClick={() => void deleteHomework(item)} className="btn btn-danger btn-sm">Delete</button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
