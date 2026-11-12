import { DashboardGreeting, RecentAnnouncements } from '@/components/dashboard-home';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkOverview } from '@/components/homework-overview';
import { getAppNavigation } from '@/lib/app-navigation';

export default function DashboardPage() {
  return (
    <DashboardShell navItems={getAppNavigation('dashboard')}>
      <div className="space-y-8">
        <DashboardGreeting />
        <HomeworkOverview />
        <RecentAnnouncements />
      </div>
    </DashboardShell>
  );
}
