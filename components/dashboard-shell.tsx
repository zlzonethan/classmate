import Link from 'next/link';

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-sm font-bold text-white">C</div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Classmate</p>
              <h1 className="text-lg font-semibold">Room 2A</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  item.active ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Class goal</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">72%</p>
            <p className="mt-1 text-sm text-slate-600">Need 28 more points to level up.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
