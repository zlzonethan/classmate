'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { PageHeader } from '@/components/page-header';

type EvidenceImage = {
  id: string;
  name: string;
  dataUrl: string;
};

type Submission = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  evidence: EvidenceImage[];
};

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

async function getSubmissionEvidence(db: NonNullable<ReturnType<typeof getFirebaseDb>>, submissionId: string) {
  const evidenceSnapshot = await getDocs(collection(db, 'homeworkSubmissions', submissionId, 'evidence'));
  return evidenceSnapshot.docs.map((item) => ({
    id: item.id,
    name: item.data().name as string,
    dataUrl: item.data().dataUrl as string,
  }));
}

export function HomeworkDetailClient({ homeworkId }: { homeworkId: string }) {
  const [homework, setHomework] = useState<HomeworkRecord | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured, so homework details cannot be loaded.');
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase authentication is unavailable.');
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      setError('');
      setSubmission(null);
      try {
        const db = getFirebaseDb();
        if (!db) throw new Error('Firebase is not configured.');
        if (!currentUser) {
          setHomework(null);
          return;
        }
        const homeworkSnapshot = await getDoc(doc(db, 'homework', homeworkId));
        if (!homeworkSnapshot.exists() || homeworkSnapshot.data().archived) {
          throw new Error('This homework could not be found.');
        }
        setHomework({ id: homeworkSnapshot.id, ...homeworkSnapshot.data() } as HomeworkRecord);

        const submissionId = `${homeworkId}__${currentUser.uid}`;
        const submissionSnapshot = await getDoc(doc(db, 'homeworkSubmissions', submissionId));
        if (submissionSnapshot.exists()) {
          setSubmission({
            id: submissionSnapshot.id,
            status: submissionSnapshot.data().status,
            evidence: await getSubmissionEvidence(db, submissionSnapshot.id),
          });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load homework details.');
      } finally {
        setLoading(false);
      }
    });
  }, [homeworkId]);

  const submitEvidence = async () => {
    if (!user || !homework?.id) {
      setError('Sign in to submit homework evidence.');
      return;
    }
    if (files.length === 0 || files.length > 5 || files.some((file) => !file.type.startsWith('image/'))) {
      setError('Choose between 1 and 5 image files as evidence.');
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase is not configured.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const submissionId = `${homework.id}__${user.uid}`;
      const submissionRef = doc(db, 'homeworkSubmissions', submissionId);
      const existingEvidence = await getSubmissionEvidence(db, submissionId);
      if (existingEvidence.length + files.length > 5) {
        throw new Error('A submission can contain up to 5 photos in total.');
      }
      const newEvidence = await Promise.all(files.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name.slice(0, 120),
        dataUrl: await compressEvidenceImage(file),
      })));
      const now = new Date().toISOString();
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(submissionRef);
        if (existing.exists() && existing.data().status !== 'REJECTED') {
          throw new Error('This homework has already been submitted or approved.');
        }
        const evidenceIds: string[] = existing.exists() ? existing.data().evidenceIds || [] : [];
        const submissionData = {
          uid: user.uid,
          studentName: user.displayName || user.email || user.uid,
          homeworkId: homework.id,
          homeworkTitle: homework.title,
          status: 'PENDING',
          createdAt: existing.exists() ? existing.data().createdAt : now,
          updatedAt: now,
          evidenceIds: [...evidenceIds, ...newEvidence.map((item) => item.id)],
        };
        if (existing.exists()) {
          transaction.update(submissionRef, submissionData);
        } else {
          transaction.set(submissionRef, submissionData);
        }
        for (const evidence of newEvidence) {
          transaction.set(doc(db, 'homeworkSubmissions', submissionId, 'evidence', evidence.id), {
            uid: user.uid,
            name: evidence.name,
            dataUrl: evidence.dataUrl,
            createdAt: now,
          });
        }
      });
      setSubmission({ id: submissionId, status: 'PENDING', evidence: [...existingEvidence, ...newEvidence] });
      setFiles([]);
      setMessage('Photo evidence submitted. A class president or teacher will review it.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit homework evidence.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={homework?.subjectId || 'Class homework'}
        title={homework?.title || 'Homework details'}
        description={homework?.description || 'View the assignment and submit your completion evidence.'}
        action={
          <Link href="/homework" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ← Homework
          </Link>
        }
      />

      {loading ? <p className="rounded-2xl bg-white p-5 text-slate-500">Loading homework…</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</p> : null}
      {message ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">{message}</p> : null}
      {!loading && !user ? (
        <p className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-800">
          <Link href="/auth" className="font-semibold underline">Sign in</Link> to view your class homework and submit evidence.
        </p>
      ) : null}

      {homework && !loading ? (
        <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Due date</p>
              <p className="mt-2 font-semibold text-slate-900">{homework.dueDate}{homework.dueTime ? ` at ${homework.dueTime}` : ''}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Subject</p>
              <p className="mt-2 font-semibold text-slate-900">{homework.subjectId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Priority</p>
              <p className="mt-2 font-semibold capitalize text-slate-900">{homework.priority}</p>
            </div>
          </div>

          {homework.attachmentUrls?.length ? (
            <section>
              <h2 className="font-semibold text-slate-900">Assignment materials</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-sky-700">
                {homework.attachmentUrls.map((url) => (
                  <li key={url}><a href={url} target="_blank" rel="noreferrer" className="underline">{url}</a></li>
                ))}
              </ul>
            </section>
          ) : null}

          {!user ? (
            <p className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              <Link href="/auth" className="font-semibold underline">Sign in</Link> to submit your completed homework.
            </p>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Completion submission</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Submit photo evidence</h2>
                </div>
                {submission ? (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    submission.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>{submission.status}</span>
                ) : null}
              </div>
              {submission?.evidence.length ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {submission.evidence.map((evidence) => (
                    <a key={evidence.id} href={evidence.dataUrl} target="_blank" rel="noreferrer" className="w-32 text-sm text-sky-700 underline">
                      <NextImage src={evidence.dataUrl} alt={evidence.name} width={128} height={128} unoptimized className="mb-1 h-32 w-32 rounded-xl border border-slate-200 object-cover" />
                      <span className="line-clamp-2">{evidence.name}</span>
                    </a>
                  ))}
                </div>
              ) : null}
              {submission?.status === 'APPROVED' ? (
                <p className="mt-4 text-sm font-medium text-emerald-800">Your completion has been approved and 10 XP has been recorded.</p>
              ) : submission?.status === 'PENDING' ? (
                <p className="mt-4 text-sm text-amber-800">Your submission is waiting for a class president or teacher to review it.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {submission?.status === 'REJECTED' ? <p className="text-sm text-red-700">Please add new evidence and resubmit for review.</p> : null}
                  <label className="block text-sm font-medium text-slate-700">
                    Photos (up to 5 total, compressed before saving)
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => setFiles(Array.from(event.target.files || []))}
                      className="mt-2 block w-full text-sm"
                    />
                  </label>
                  {files.length ? <p className="text-sm text-slate-500">{files.length} photo(s) selected</p> : null}
                  <button type="button" onClick={() => void submitEvidence()} disabled={saving} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {saving ? 'Submitting…' : submission?.status === 'REJECTED' ? 'Resubmit evidence' : 'Submit for approval'}
                  </button>
                </div>
              )}
            </section>
          )}
        </article>
      ) : null}
    </div>
  );
}
