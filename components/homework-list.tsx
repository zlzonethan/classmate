'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

export function HomeworkList() {
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState('guest');
  const [categories, setCategories] = useState(['Uncategorized', 'To do', 'In progress', 'Done']);
  const [assignmentCategories, setAssignmentCategories] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');

  const storageKey = `classmate:homework-categories:${uid}`;

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    return auth.onAuthStateChanged((user) => setUid(user?.uid || 'guest'));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setCategories(['Uncategorized', 'To do', 'In progress', 'Done']);
        setAssignmentCategories({});
        return;
      }
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || !('categories' in parsed) || !('assignments' in parsed)) {
        throw new Error('Saved category data has an invalid format.');
      }
      const data = parsed as { categories: unknown; assignments: unknown };
      const validCategories = Array.isArray(data.categories)
        ? data.categories.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      const validAssignments = data.assignments && typeof data.assignments === 'object' && !Array.isArray(data.assignments)
        ? Object.fromEntries(Object.entries(data.assignments).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
        : {};
      setCategories(Array.from(new Set(['Uncategorized', 'To do', 'In progress', 'Done', ...validCategories])));
      setAssignmentCategories(validAssignments);
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : 'Could not load personal categories.');
    }
  }, [storageKey]);

  const persistCategories = (nextCategories: string[], nextAssignmentCategories: Record<string, string>) => {
    setCategories(nextCategories);
    setAssignmentCategories(nextAssignmentCategories);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        categories: nextCategories,
        assignments: nextAssignmentCategories,
      }));
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : 'Could not save personal categories.');
    }
  };

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = newCategory.trim().slice(0, 30);
    if (!trimmed) return;
    if (categories.some((category) => category.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryMessage('That category already exists.');
      return;
    }
    persistCategories([...categories, trimmed], assignmentCategories);
    setNewCategory('');
    setCategoryMessage(`Added “${trimmed}”.`);
  };

  const assignCategory = (itemId: string, category: string) => {
    persistCategories(categories, { ...assignmentCategories, [itemId]: category });
  };

  useEffect(() => {
    async function loadHomework() {
      try {
        const response = await fetch('/api/homework', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load homework list.');
        }

        setItems(Array.isArray(payload.items) ? payload.items : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown load error');
      } finally {
        setLoading(false);
      }
    }

    loadHomework();
  }, []);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading homework...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-soft">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">My categories</p>
          <p className="mt-1 text-xs text-slate-500">Private to {uid === 'guest' ? 'this browser' : 'your account on this device'}.</p>
        </div>
        <form onSubmit={addCategory} className="flex gap-2">
          <label className="sr-only" htmlFor="new-homework-category">New category name</label>
          <input id="new-homework-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} maxLength={30} placeholder="Add a category" className="min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-500" />
          <button type="submit" className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add</button>
        </form>
      </div>
      {categoryMessage ? <p role="status" className="text-sm text-slate-500">{categoryMessage}</p> : null}

      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-soft">
          No homework assigned yet. Create the first assignment when ready.
        </div>
      ) : (
        items.map((item) => {
          const itemId = item.id || item.title;
          return (
            <article key={itemId} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <span className="text-sm font-medium text-slate-600">{item.subjectId}</span>
                  {assignmentCategories[itemId] ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">{assignmentCategories[itemId]}</span> : null}
                </div>
                <Link href={`/homework/${item.id ?? encodeURIComponent(item.title)}`} className="text-xl font-semibold text-slate-900 hover:text-sky-700">{item.title}</Link>
                <p className="mt-1 text-sm text-slate-500">Due {item.dueDate}{item.dueTime ? ` at ${item.dueTime}` : ''}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-medium text-slate-500">
                  My category
                  <select aria-label={`Personal category for ${item.title}`} value={assignmentCategories[itemId] || 'Uncategorized'} onChange={(event) => assignCategory(itemId, event.target.value)} className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{item.priority}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.archived ? 'Archived' : 'Active'}</span>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
