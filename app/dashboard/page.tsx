import Link from 'next/link';
import { DashboardClient } from '@/components/dashboard-client';
import { DashboardShell } from '@/components/dashboard-shell';
import { HomeworkOverview } from '@/components/homework-overview';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
import { announcementFeed } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <DashboardShell navItems={getAppNavigation('dashboard')}>
      <div className="space-y-4">
        <DashboardClient />

        <PageHeader
          eyebrow="Your class at a glance"
          title="What needs your attention?"
          action={
            <Link href="/homework/new" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
              + New homework
            </Link>
          }
        />

        <HomeworkOverview />

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Class updates</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Announcements</h2>
              </div>
              <Link href="/announcements" className="text-sm font-medium text-sky-600 hover:text-sky-700">All posts</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {announcementFeed.slice(0, 2).map((item) => (
                <article key={item.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    {item.pinned ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Pinned</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{item.content}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link href="/calendar" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft transition hover:border-sky-200 hover:bg-sky-50">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Schedule</p>
              <p className="mt-1 font-semibold text-slate-900">Calendar</p>
              <p className="mt-1 text-sm text-slate-500">Class events and private reminders</p>
            </Link>
            <Link href="/leaderboard" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft transition hover:border-sky-200 hover:bg-sky-50">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Class progress</p>
              <p className="mt-1 font-semibold text-slate-900">Leaderboard</p>
              <p className="mt-1 text-sm text-slate-500">See how the class is progressing</p>
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
