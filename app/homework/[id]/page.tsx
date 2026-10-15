import Link from 'next/link';

const detail = {
  title: 'Algebra worksheet',
  subject: 'Mathematics',
  dueDate: 'Tomorrow',
  description: 'Complete pages 42–43 and show all steps for every problem. Submit a clear photo of your work for AI verification.',
  status: 'AI review',
  xp: 13,
  evidence: 'Image quality: Good · Assignment match: Likely match · Visible work: Yes',
};

export default function HomeworkDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/homework" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            ← Back to homework
          </Link>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{detail.status}</span>
        </div>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{detail.subject}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{detail.title}</h1>
            </div>
            <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">+{detail.xp} XP</div>
          </div>

          <p className="mb-6 text-slate-600">{detail.description}</p>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Due</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{detail.dueDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Assignment range</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Pages 42–43</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-semibold text-slate-900">AI homework check</h2>
            <p className="mt-3 text-slate-600">{detail.evidence}</p>
            <div className="mt-5 flex items-center gap-3">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Upload evidence</button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Request manual review</button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Evidence status: {params.id ? `Submission ${params.id.slice(0, 6)} is awaiting verification.` : 'Submission pending verification.'}
          </div>
        </article>
      </div>
    </main>
  );
}
