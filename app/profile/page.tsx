import { DashboardShell } from '@/components/dashboard-shell';
import { ProfileOverview } from '@/components/profile-overview';
import { getAppNavigation } from '@/lib/app-navigation';

export default function ProfilePage() {
  return (
    <DashboardShell navItems={getAppNavigation('profile')}>
      <ProfileOverview />
    </DashboardShell>
  );
}
