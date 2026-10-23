import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkList } from '@/components/homework-list';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

export default function HomeworkPage() {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Assignments"
          title="Homework"
          description="Keep track of what is due next."
          action={
            <Link href="/homework/new" className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              + New assignment
            </Link>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All assignments</h2>
              <p className="mt-1 text-sm text-slate-500">Browse assignments by subject and deadline.</p>
            </div>
          </div>
          <HomeworkList />
        </section>
      </div>
    </DashboardShell>
  );
}
