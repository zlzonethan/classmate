'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, runTransaction, where, writeBatch } from 'firebase/firestore';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { getClassHomework } from '@/lib/homework-client';

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

async function compressEvidenceImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this image for upload.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length * 0.75 > 450 * 1024 && quality > 0.35) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length * 0.75 > 450 * 1024) {
      throw new Error(`${file.name} is too large after compression. Choose a smaller photo.`);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
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
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
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

  const submitForApproval = async (homework: HomeworkRecord) => {
    if (!user || !homework.id) return;
    const db = getFirebaseDb();
    if (!db) {
      setActionError('Firebase is not configured.');
      return;
    }
    const files = selectedFiles[homework.id] || [];
    if (files.length === 0) {
      setActionError('Attach at least one photo as proof before submitting.');
      return;
    }
    if (files.length > 5 || files.some((file) => !file.type.startsWith('image/'))) {
      setActionError('Attach up to 5 image files.');
      return;
    }
    setSubmittingId(homework.id);
    setActionError('');
    setActionMessage('');
    try {
      const submissionId = `${homework.id}__${user.uid}`;
      const submissionRef = doc(db, 'homeworkSubmissions', submissionId);
      const now = new Date().toISOString();
      const existingSnapshot = await getDoc(submissionRef);
      if (existingSnapshot.exists() && existingSnapshot.data().status !== 'REJECTED') {
        throw new Error('This homework has already been submitted or approved.');
      }
      const existingEvidence = await loadEvidence(db, submissionId);
      if (existingEvidence.length + files.length > 5) {
        throw new Error('A submission can contain up to 5 photos in total.');
      }
      const evidenceFiles = await Promise.all(files.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name.slice(0, 120),
        dataUrl: await compressEvidenceImage(file),
      })));
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(submissionRef);
        if (existing.exists() && existing.data().status !== 'REJECTED') {
          throw new Error('This homework has already been submitted or approved.');
        }
        const submission = {
          uid: user.uid,
          studentName: user.displayName || user.email || user.uid,
          homeworkId: homework.id,
          homeworkTitle: homework.title,
          status: 'PENDING' as const,
          createdAt: existing.exists() ? existing.data().createdAt : now,
          evidenceIds: [...(existing.exists() ? existing.data().evidenceIds || [] : []), ...evidenceFiles.map((file) => file.id)],
        };
        if (existing.exists()) {
          transaction.update(submissionRef, { ...submission, updatedAt: now });
        } else {
          transaction.set(submissionRef, { ...submission, updatedAt: now });
        }
        for (const file of evidenceFiles) {
          transaction.set(doc(db, 'homeworkSubmissions', submissionId, 'evidence', file.id), {
            uid: user.uid,
            name: file.name,
            dataUrl: file.dataUrl,
            createdAt: now,
          });
        }
      });
      setSelectedFiles((current) => ({ ...current, [homework.id!]: [] }));
      setActionMessage('Submitted for class president or teacher approval.');
      await refreshSubmissions(user, canReview);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Could not submit this homework for approval.';
      setActionError(message);
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
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading homework…</div>;
  }

  if (error) {
    return <div role="alert" className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-soft">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p> : null}
      {actionMessage ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{actionMessage}</p> : null}

      {editingHomeworkId && editValues ? (
        <form onSubmit={saveHomeworkEdits} className="space-y-4 rounded-3xl border border-sky-200 bg-white p-5 shadow-soft md:p-7">
          <h2 className="text-xl font-bold text-slate-900">Edit homework</h2>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input value={editValues.title} onChange={(event) => setEditValues({ ...editValues, title: event.target.value })} maxLength={120} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea value={editValues.description} onChange={(event) => setEditValues({ ...editValues, description: event.target.value })} maxLength={5000} rows={4} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Subject
              <input value={editValues.subjectId} onChange={(event) => setEditValues({ ...editValues, subjectId: event.target.value })} maxLength={40} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select value={editValues.priority} onChange={(event) => setEditValues({ ...editValues, priority: event.target.value as HomeworkEditValues['priority'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Due date
              <input type="date" value={editValues.dueDate} onChange={(event) => setEditValues({ ...editValues, dueDate: event.target.value })} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Due time
              <input type="time" value={editValues.dueTime} onChange={(event) => setEditValues({ ...editValues, dueTime: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submittingId === editingHomeworkId} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submittingId === editingHomeworkId ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={() => { setEditingHomeworkId(null); setEditValues(null); }} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
          </div>
        </form>
      ) : null}

      {canReview ? (
        <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-soft md:p-7">
          <h2 className="text-xl font-bold text-slate-900">Homework approval queue</h2>
          <p className="mt-1 text-sm text-slate-500">Review completion requests from students.</p>
          {pendingSubmissions.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no homework submissions waiting for approval.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{submission.homeworkTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{submission.studentName}</p>
                    {submission.evidence.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {submission.evidence.map((file) => (
                          <a key={file.id} href={file.dataUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-sky-700 underline">
                            <NextImage src={file.dataUrl} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    ) : <p className="mt-2 text-sm text-amber-700">No proof attached to this submission.</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={submittingId === submission.id} onClick={() => void reviewSubmission(submission, 'APPROVED')} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Approve · +10 XP</button>
                    <button type="button" disabled={submittingId === submission.id} onClick={() => void reviewSubmission(submission, 'REJECTED')} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {user && submissions.some((submission) => submission.uid === user.uid) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">My homework submissions</h2>
          <ul className="mt-3 space-y-2">
            {submissions.filter((submission) => submission.uid === user.uid).map((submission) => (
              <li key={submission.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-slate-700">{submission.homeworkTitle}</span>
                <span className={`font-semibold ${submission.status === 'APPROVED' ? 'text-emerald-700' : submission.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}`}>{submission.status}</span>
                {submission.evidence.map((file) => (
                  <a key={file.id} href={file.dataUrl} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2 text-sky-700 underline">
                    <NextImage src={file.dataUrl} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                    {file.name}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!signedIn ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-800">
          Sign in to see assignments shared with your class.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Filter assignments by subject">
          {subjects.map((subject) => (
            <button key={subject} type="button" onClick={() => setSelectedSubject(subject)} aria-pressed={selectedSubject === subject} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedSubject === subject ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {subject}
            </button>
          ))}
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-soft">
          {signedIn ? 'No class assignments yet.' : 'Sign in to view the class assignment list.'}
        </div>
      ) : (
        visibleItems.map((item) => {
          const itemId = item.id || item.title;
          return (
            <article key={itemId} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <span className="text-sm font-medium text-slate-600">{getSubjectName(item.subjectId)}</span>
                </div>
                <Link href={`/homework/${item.id ?? encodeURIComponent(item.title)}`} className="text-xl font-semibold text-slate-900 hover:text-sky-700">{item.title}</Link>
                <p className="mt-1 text-sm text-slate-500">Due {item.dueDate}{item.dueTime ? ` at ${item.dueTime}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${item.priority === 'high' ? 'bg-rose-50 text-rose-700' : item.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.priority}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.archived ? 'Archived' : 'Active'}</span>
                {canReview && item.id ? (
                  <>
                    <button type="button" onClick={() => startEditingHomework(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50">Edit</button>
                    <button type="button" disabled={submittingId === item.id} onClick={() => void deleteHomework(item)} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button>
                  </>
                ) : null}
                {user && item.id ? (() => {
                  const submission = submissions.find((entry) => entry.uid === user.uid && entry.homeworkId === item.id);
                  if (submission?.status === 'APPROVED') return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Approved</span>;
                  if (submission?.status === 'PENDING') return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Awaiting approval</span>;
                  return (
                    <div className="flex flex-col items-start gap-2">
                      <label className="text-xs font-medium text-slate-600">
                        Photo evidence (max 5 compressed images)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            setSelectedFiles((current) => ({ ...current, [item.id!]: Array.from(event.target.files || []) }));
                          }}
                          className="mt-1 block max-w-56 text-xs"
                        />
                      </label>
                      {selectedFiles[item.id]?.length ? <p className="text-xs text-slate-500">{selectedFiles[item.id].length} file(s) selected</p> : null}
                      <button type="button" disabled={submittingId === item.id} onClick={() => void submitForApproval(item)} className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{submittingId === item.id ? 'Uploading…' : submission?.status === 'REJECTED' ? 'Resubmit evidence' : 'Submit evidence for approval'}</button>
                    </div>
                  );
                })() : null}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
