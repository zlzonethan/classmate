'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useClassSettings } from '@/lib/class-settings';
import { getFirebaseAuth } from '@/lib/firebase';
import type { NavIcon, NavItem } from '@/lib/app-navigation';
import { roleLabel, useCurrentUser } from '@/lib/use-current-user';

export type { NavItem };

const iconPaths: Record<NavIcon, string> = {
  home: 'M3.5 9.5 10 4l6.5 5.5V16a1 1 0 0 1-1 1H12v-4.5H8V17H4.5a1 1 0 0 1-1-1V9.5Z',
  homework: 'M5 3.5h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1ZM7 7.5h6M7 10.5h6M7 13.5h3.5',
  calendar: 'M4.5 5h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3.5 8.5h13M7 3v3.5M13 3v3.5',
  announcements: 'M4 8v4h2.5L12 15.5v-11L6.5 8H4ZM15 7.5a3.5 3.5 0 0 1 0 5',
  suggestions: 'M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  leaderboard: 'M4 16.5V11h3v5.5M8.5 16.5V7h3v9.5M13 16.5V9.5h3v7M3 16.5h14',
  settings: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7',
};

function Icon({ name }: { name: NavIcon }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] shrink-0">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={item.active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[15px] transition-colors ${
        item.active ? 'bg-accent-50 font-medium text-accent-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={item.active ? 'text-accent-600' : 'text-slate-400'}><Icon name={item.icon} /></span>
      {item.label}
    </Link>
  );
}

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  const { isStaff } = useCurrentUser();
  const main = navItems.filter((item) => !item.staffOnly);
  const staff = isStaff ? navItems.filter((item) => item.staffOnly) : [];

  return (
    <nav aria-label="Main" className="space-y-4">
      <div className="space-y-0.5">
        {main.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
      </div>
      {staff.length ? (
        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-xs font-medium text-slate-500">For class staff</p>
          {staff.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
        </div>
      ) : null}
    </nav>
  );
}

function Account({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role, displayName, photoURL, loading, configured } = useCurrentUser();

  if (loading) return <div className="h-12" />;

  if (!user) {
    return (
      <div className="space-y-2 px-1">
        {!configured ? <p className="text-xs text-slate-500">Firebase isn’t connected, so you’re seeing sample data.</p> : null}
        <Link href="/auth" onClick={onNavigate} className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 hover:bg-slate-100">
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
        className="shrink-0 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
  const { settings } = useClassSettings();
  const pathname = usePathname();
  const current = navItems.find((item) => item.active);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Phone and tablet: a top bar with a menu. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="min-w-0 truncate font-semibold text-slate-900">
            {settings.name}{current ? <span className="font-normal text-slate-500"> · {current.label}</span> : null}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="btn btn-sm shrink-0"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen ? (
          <div id="mobile-menu" className="max-h-[calc(100vh-3.5rem)] space-y-3 overflow-y-auto border-t border-slate-200 px-3 py-3">
            <NavLinks navItems={navItems} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-slate-200 pt-3">
              <Account onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}
      </header>

      {/* Desktop: a fixed sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-600 text-sm font-semibold text-white">
            {settings.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold leading-tight text-slate-900">{settings.name}</span>
            <span className="block text-xs text-slate-500">Classmate</span>
          </span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks navItems={navItems} />
        </div>
        <div className="mt-3 border-t border-slate-200 pt-3">
          <Account />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
