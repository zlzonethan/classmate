import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { getAppNavigation } from '@/lib/app-navigation';
import { demoLeaderboard } from '@/lib/mock-data';

export default function LeaderboardPage() {
  return (
    <DashboardShell navItems={getAppNavigation('leaderboard')}>
      <main className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Room 2A</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Class leaderboard</h1>
              <p className="mt-2 text-slate-500">Celebrate progress and effort across your class.</p>
            </div>
            <Link href="/profile" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">My stats</Link>
          </div>

          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Preview leaderboard with sample data. Real class rankings will be shown when XP records are connected.
          </p>

          <ol className="mt-5 space-y-3">
            {demoLeaderboard.map((student, index) => (
              <li key={student.uid} className={`flex items-center gap-4 rounded-2xl border p-4 ${
                student.displayName === 'You' ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-800' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-500'
                }`}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{student.displayName}</p>
                  <p className="mt-1 text-sm text-slate-500">{student.completed} assignments completed</p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="block text-lg font-bold text-slate-900">{student.xp.toLocaleString()} XP</span>
                  <span className="text-xs text-slate-500">this term</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </DashboardShell>
  );
}
