import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { SuggestionBox } from '@/components/suggestion-box';
import { getAppNavigation } from '@/lib/app-navigation';

export default function SuggestionsPage() {
  return (
    <DashboardShell navItems={getAppNavigation('suggestions')}>
      <div className="space-y-5">
        <PageHeader
          title="Suggestion box"
          description="Tell the class president and teacher what could be better. Nobody else can read it."
        />
        <SuggestionBox />
      </div>
    </DashboardShell>
  );
}
