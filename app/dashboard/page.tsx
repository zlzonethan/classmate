import { DashboardClient } from '@/components/dashboard-client';
import { DashboardShell } from '@/components/dashboard-shell';
import { announcementFeed, dashboardCards, recentActivity, tomorrowItems, upcomingItems } from '@/lib/mock-data';

const navItems = [
  { label: 'Overview', href: '/dashboard', active: true },
  { label: 'Homework', href: '/homework' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Auth', href: '/auth' },
];

export default function DashboardPage() {
  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <DashboardClient />

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-soft md:p-6">
          <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Overview</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Class overview</h1>
            </div>
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">+ Quick add</button>
          </header>

          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-3xl font-bold text-slate-900">{item.value}</span>
                  <span className="text-xs font-medium text-emerald-600">{item.progress}%</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Tomorrow</h2>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Tue · 9:30 AM</span>
                </div>
                <div className="space-y-3">
                  {tomorrowItems.map((item) => (
                    <div key={item.title} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium text-slate-700">{item.subject}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.kind}</span>
                        <p className="mt-2 text-xs font-medium text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Upcoming</h2>
                  <span className="text-sm font-medium text-sky-600">Sorted by deadline</span>
                </div>
                <div className="space-y-3">
                  {upcomingItems.map((item) => (
                    <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium text-slate-600">{item.subject}</span>
                        </div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">Class announcements</h2>
                <div className="space-y-3">
                  {announcementFeed.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        {item.pinned ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">Pinned</span> : null}
                      </div>
                      <p className="text-sm text-slate-600">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">Recently updated</h2>
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
