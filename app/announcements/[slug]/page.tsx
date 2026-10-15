import Link from 'next/link';
import { announcementFeed } from '@/lib/mock-data';

export default function AnnouncementDetailPage({ params }: { params: { slug: string } }) {
  const item = announcementFeed.find((entry) => entry.slug === params.slug) ?? announcementFeed[0];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/announcements" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            ← Back to announcements
          </Link>
          {item.pinned ? <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Pinned</span> : null}
        </div>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Announcement</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{item.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{item.meta}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base leading-8 text-slate-700">{item.content}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Audience', value: 'All students' },
              { label: 'Status', value: item.pinned ? 'Pinned' : 'Active' },
              { label: 'Updated', value: 'Today' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
