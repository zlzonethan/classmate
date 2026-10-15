import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef5ff_32%,_#f8fafc_100%)] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 rounded-full border border-slate-200 bg-white/80 px-5 py-3 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-sm font-bold text-white">C</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-sky-600">Classmate</p>
              <h1 className="text-lg font-semibold text-slate-900">Shared classroom platform</h1>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <Link href="/homework" className="hover:text-slate-900">Homework</Link>
            <Link href="/calendar" className="hover:text-slate-900">Calendar</Link>
            <Link href="/auth" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 hover:bg-slate-100">Sign in</Link>
          </nav>
        </header>

        <section className="grid gap-8 pb-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">AI-powered classroom</span>
            <h2 className="mt-5 text-5xl font-black tracking-tight text-slate-950 md:text-6xl">Keep the whole class on track.</h2>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Review homework, track deadlines, submit evidence, and celebrate class progress with a polished shared workspace built for students and teachers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">Open dashboard</Link>
              <Link href="/auth" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">Teacher login</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
              <span>Homework tracking</span>
              <span>Class announcements</span>
              <span>AI evidence checks</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Today</p>
                <h3 className="text-2xl font-bold text-slate-900">Tuesday</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">On track</span>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Algebra worksheet', value: 'Due tomorrow', color: 'bg-sky-500' },
                { title: 'Biology quiz', value: '9:15 AM', color: 'bg-emerald-500' },
                { title: 'History essay draft', value: 'Friday', color: 'bg-violet-500' },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`block h-3 w-3 rounded-full ${item.color}`} />
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.value}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Info</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
