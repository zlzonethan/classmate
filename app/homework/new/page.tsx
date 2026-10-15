import Link from 'next/link';
import { HomeworkForm } from '@/components/homework-form';

export default function NewHomeworkPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Assignments</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Homework workspace</h1>
          </div>
          <Link href="/homework" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Back to list
          </Link>
        </div>

        <HomeworkForm />
      </div>
    </main>
  );
}
