import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
import { demoLeaderboard } from '@/lib/mock-data';

export default function LeaderboardPage() {
  return (
    <DashboardShell navItems={getAppNavigation('leaderboard')}>
      <div className="space-y-8">
        <PageHeader title="Leaderboard" description="10 XP for every homework that gets approved." />

        <p className="note note-warn">
          These are example names and scores. Real class rankings are not connected yet.
        </p>

        <section className="border-t-2 border-slate-900">
          <ol className="divide-y divide-slate-200">
            {demoLeaderboard.map((student, index) => (
              <li key={student.uid} className={`flex items-center gap-4 px-2 py-3 ${student.displayName === 'You' ? 'bg-accent-50' : ''}`}>
                <span className="w-6 shrink-0 text-center font-semibold tabular-nums text-slate-500">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{student.displayName}</p>
                  <p className="text-[15px] text-slate-600">{student.completed} homework done</p>
                </div>
                <p className="shrink-0 font-display text-lg font-bold tabular-nums text-slate-900">{student.xp.toLocaleString()} XP</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </DashboardShell>
  );
}
