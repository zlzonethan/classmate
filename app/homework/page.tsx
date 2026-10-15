import Link from 'next/link';
import { HomeworkList } from '@/components/homework-list';

export default function HomeworkPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Assignments</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Homework</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Filter</button>
            <Link href="/homework/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+ New assignment</Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {['All subjects', 'Mathematics', 'Science', 'English', 'History'].map((filter) => (
            <button key={filter} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === 'All subjects' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
              {filter}
            </button>
          ))}
        </div>

        <HomeworkList />
      </div>
    </main>
  );
}
