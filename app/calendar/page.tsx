import { DashboardShell } from '@/components/dashboard-shell';
import { CalendarClient } from '@/components/calendar-client';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

export default function CalendarPage() {
  return (
    <DashboardShell navItems={getAppNavigation('calendar')}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Schedule"
          title="Calendar"
          description="Plan class events and keep your personal reminders private."
        />
        <CalendarClient />
      </div>
    </DashboardShell>
  );
}
