import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkDetailClient } from '@/components/homework-detail-client';
import { getAppNavigation } from '@/lib/app-navigation';

export default function HomeworkDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardShell navItems={getAppNavigation('homework')}>
      <HomeworkDetailClient homeworkId={params.id} />
    </DashboardShell>
  );
}
