import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkForm } from '@/components/homework-form';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

export default function NewHomeworkPage() {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Assignments"
          title="Create homework"
          description="Share a clear task and due date with your class."
          action={
            <Link href="/homework" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to homework
            </Link>
          }
        />
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-8">
          <HomeworkForm />
        </section>
      </div>
    </DashboardShell>
  );
}
