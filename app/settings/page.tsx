import { ClassSettingsPage } from '@/components/class-settings';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';

export default function SettingsPage() {
  return (
    <DashboardShell navItems={getAppNavigation('settings')}>
      <div className="space-y-5">
        <PageHeader title="Class settings" description="For the class president and teacher." />
        <ClassSettingsPage />
      </div>
    </DashboardShell>
  );
}
