import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkForm } from '@/components/homework-form';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

export default function NewHomeworkPage() {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <div className="space-y-8">
        <PageHeader
          title="Add homework"
          description="It appears in everyone’s homework list and on the class calendar."
          action={<Link href="/homework" className="btn">Back to homework</Link>}
        />
        <HomeworkForm />
      </div>
    </DashboardShell>
  );
}
