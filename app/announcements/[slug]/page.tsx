import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeader } from '@/components/page-header';
import { getAppNavigation } from '@/lib/app-navigation';
import { announcementFeed } from '@/lib/mock-data';

export default function AnnouncementDetailPage({ params }: { params: { slug: string } }) {
  const item = announcementFeed.find((entry) => entry.slug === params.slug) ?? announcementFeed[0];

  return (
    <DashboardShell navItems={getAppNavigation('announcements')}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Class announcement"
          title={item.title}
          description={item.meta}
          action={
            <Link href="/announcements" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← All announcements
            </Link>
          }
        />
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:p-8">
          {item.pinned ? <span className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Pinned</span> : null}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
            <p className="text-base leading-8 text-slate-700">{item.content}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Audience', value: 'All students' },
              { label: 'Status', value: item.pinned ? 'Pinned' : 'Active' },
              { label: 'Updated', value: 'Today' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </DashboardShell>
  );
}
