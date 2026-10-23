import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

const detail = {
  title: 'Algebra worksheet',
  subject: 'Mathematics',
  dueDate: 'Tomorrow',
  description: 'Complete pages 42–43 and show all steps for every problem. Submit a clear photo of your work for AI verification.',
  status: 'AI review',
  xp: 13,
  evidence: 'Image quality: Good · Assignment match: Likely match · Visible work: Yes',
};

export default function HomeworkDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow={detail.subject}
          title={detail.title}
          description={detail.description}
          action={
            <Link href="/homework" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← Homework
            </Link>
          }
        />

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{detail.status}</span>
            <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+{detail.xp} XP</span>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Due date</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{detail.dueDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Assignment range</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Pages 42–43</p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Submission</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">AI homework check</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{detail.evidence}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Upload evidence</button>
              <button className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">Request manual review</button>
            </div>
          </section>

          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            Evidence status: {params.id ? `Submission ${params.id.slice(0, 6)} is awaiting verification.` : 'Submission pending verification.'}
          </p>
        </article>
      </div>
    </DashboardShell>
  );
}
