'use client';

import { FormEvent, useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

const initialValues = {
  title: '',
  description: '',
  subjectId: 'math',
  dueDate: '',
  dueTime: '20:00',
  priority: 'medium',
};

export function HomeworkForm() {
  const [form, setForm] = useState(initialValues);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof initialValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setStatus({
        type: 'error',
        message: 'Firebase client configuration is missing. Add frontend Firebase settings to enable form submission.',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setStatus({ type: 'error', message: 'Sign in with Firebase before creating homework.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, attachmentUrls: [] }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create homework.');
      }

      setStatus({ type: 'success', message: `Homework created successfully: ${payload.title || form.title}` });
      setForm(initialValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error creating homework.';
      setStatus({ type: 'error', message });
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            placeholder="Algebra worksheet"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            className="min-h-[112px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            placeholder="Complete pages 42–43 and show all work."
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
          <select
            value={form.subjectId}
            onChange={(event) => updateField('subjectId', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="math">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            <option value="history">History</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <select
            value={form.priority}
            onChange={(event) => updateField('priority', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => updateField('dueDate', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due time</label>
          <input
            type="time"
            value={form.dueTime}
            onChange={(event) => updateField('dueTime', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
          />
        </div>
      </div>

      {status ? (
        <div
          className={`mt-5 rounded-xl border px-3 py-2 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-sky-200 bg-sky-50 text-sky-700'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Creating...' : 'Save homework'}
      </button>
    </form>
  );
}
