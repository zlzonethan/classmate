import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkList } from '@/components/homework-list';
import { PageHeader } from '@/components/page-header';
import { StaffOnly } from '@/components/staff-only';
import { getAppNavigation } from '@/lib/app-navigation';

export default function HomeworkPage() {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <div className="space-y-8">
        <PageHeader
          title="Homework"
          description="Sorted by due date. Open one to read the details or submit your proof."
          action={
            <StaffOnly>
              <Link href="/homework/new" className="btn btn-primary">Add homework</Link>
            </StaffOnly>
          }
        />
        <HomeworkList />
      </div>
    </DashboardShell>
  );
}
