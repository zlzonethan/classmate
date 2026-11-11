'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { roleLabel, useCurrentUser } from '@/lib/use-current-user';

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

function Avatar({ name, photoURL }: { name: string; photoURL: string }) {
  if (photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700">
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-0.5">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={item.active ? 'page' : undefined}
          className={`block rounded-md px-3 py-2 text-[15px] ${
            item.active ? 'bg-accent-50 font-semibold text-accent-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Account({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role, displayName, photoURL, loading, configured } = useCurrentUser();

  if (loading) return <p className="px-3 text-sm text-slate-400">…</p>;

  if (!user) {
    return (
      <div className="space-y-2 px-1">
        {!configured ? <p className="text-xs text-slate-500">Firebase isn’t connected, so you’re seeing sample data.</p> : null}
        <Link href="/auth" onClick={onNavigate} className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/profile" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-slate-100">
        <Avatar name={displayName} photoURL={photoURL} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-900">{displayName}</span>
          <span className="block text-xs text-slate-500">{roleLabel(role)}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => {
          const auth = getFirebaseAuth();
          if (auth) void signOut(auth);
          onNavigate?.();
        }}
        className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100"
      >
        Sign out
      </button>
    </div>
  );
}

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navItems.find((item) => item.active);

  return (
    <div className="min-h-screen lg:flex">
      {/* Phone and tablet: a top bar with a menu. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Room 2A{current ? <span className="font-normal text-slate-500"> · {current.label}</span> : null}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="btn btn-sm"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen ? (
          <div id="mobile-menu" className="space-y-3 border-t border-slate-200 px-3 py-3">
            <NavLinks navItems={navItems} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-slate-200 pt-3">
              <Account onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}
      </header>

      {/* Desktop: a fixed sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
        <Link href="/dashboard" className="mb-5 block px-3">
          <span className="block text-lg font-semibold text-slate-900">Room 2A</span>
          <span className="block text-xs text-slate-500">Classmate</span>
        </Link>
        <NavLinks navItems={navItems} />
        <div className="mt-auto border-t border-slate-200 pt-3">
          <Account />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
