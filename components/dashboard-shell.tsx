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

const iconPaths: Record<NavIcon | 'more', string> = {
  home: 'M3.5 9.5 10 4l6.5 5.5V16a1 1 0 0 1-1 1H12v-4.5H8V17H4.5a1 1 0 0 1-1-1V9.5Z',
  homework: 'M5 3.5h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1ZM7 7.5h6M7 10.5h6M7 13.5h3.5',
  calendar: 'M4.5 5h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3.5 8.5h13M7 3v3.5M13 3v3.5',
  announcements: 'M4 8v4h2.5L12 15.5v-11L6.5 8H4ZM15 7.5a3.5 3.5 0 0 1 0 5',
  suggestions: 'M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  leaderboard: 'M4 16.5V11h3v5.5M8.5 16.5V7h3v9.5M13 16.5V9.5h3v7M3 16.5h14',
  more: 'M4.5 10h.01M10 10h.01M15.5 10h.01',
  settings: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7',
};

function Icon({ name }: { name: NavIcon | 'more' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth={name === 'more' ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ name, photoURL }: { name: string; photoURL: string }) {
  if (photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-paper">
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
      className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 text-[15px] transition-colors ${
        item.active
          ? 'border-accent-600 font-semibold text-slate-900'
          : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      <span className={item.active ? 'text-accent-600' : 'text-slate-400'}><Icon name={item.icon} /></span>
      {item.label}
    </Link>
  );
}

function NavLinks({ items, staffItems, onNavigate }: { items: NavItem[]; staffItems: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-6">
      {items.length ? (
        <div>{items.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}</div>
      ) : null}
      {staffItems.length ? (
        <div>
          <p className="px-3 pb-1 text-xs font-medium text-slate-500">For class staff</p>
          {staffItems.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
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
      <div className="space-y-2">
        {!configured ? <p className="text-xs text-slate-500">Firebase isn’t connected, so you’re seeing sample data.</p> : null}
        <Link href="/auth" onClick={onNavigate} className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/profile" onClick={onNavigate} className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 hover:bg-slate-50">
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
        className="min-h-[44px] shrink-0 rounded-md px-2 text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}

/** The four pages a student opens most sit in the phone tab bar; the rest go under More. */
const TAB_COUNT = 4;

function TabBar({ tabs, moreActive, moreOpen, onMore }: { tabs: NavItem[]; moreActive: boolean; moreOpen: boolean; onMore: () => void }) {
  const tabClass = (active: boolean) =>
    `flex h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 text-[11px] ${
      active ? 'border-accent-600 font-semibold text-slate-900' : 'border-transparent text-slate-500'
    }`;

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-300 bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
      {tabs.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item.active && !moreOpen ? 'page' : undefined} className={tabClass(Boolean(item.active) && !moreOpen)}>
          <Icon name={item.icon} />
          {item.short || item.label}
        </Link>
      ))}
      <button type="button" onClick={onMore} aria-expanded={moreOpen} aria-controls="more-menu" className={tabClass(moreActive || moreOpen)}>
        <Icon name="more" />
        More
      </button>
    </nav>
  );
}

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { settings } = useClassSettings();
  const { user, isStaff, displayName, photoURL, loading } = useCurrentUser();
  const pathname = usePathname();

  const main = navItems.filter((item) => !item.staffOnly);
  const staff = isStaff ? navItems.filter((item) => item.staffOnly) : [];
  const tabs = main.slice(0, TAB_COUNT);
  const overflow = main.slice(TAB_COUNT);
  const moreActive = !tabs.some((item) => item.active);

  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Phone and tablet: the class name on top, tabs within thumb reach at the bottom. */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-300 bg-paper px-4 lg:hidden">
        <Link href="/dashboard" className="title min-w-0 truncate text-lg">{settings.name}</Link>
        {loading ? null : user ? (
          <Link href="/profile" aria-label="Your profile" className="flex h-11 w-11 shrink-0 items-center justify-end">
            <Avatar name={displayName} photoURL={photoURL} />
          </Link>
        ) : (
          <Link href="/auth" className="btn btn-primary btn-sm shrink-0">Sign in</Link>
        )}
      </header>

      {moreOpen ? (
        <div className="lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-20 bg-slate-900/40" />
          <div id="more-menu" className="fixed inset-x-0 bottom-14 z-30 mb-[env(safe-area-inset-bottom)] max-h-[70vh] space-y-4 overflow-y-auto border-t-2 border-slate-900 bg-paper px-4 py-4">
            <NavLinks items={overflow} staffItems={staff} onNavigate={() => setMoreOpen(false)} />
            <div className="border-t border-slate-300 pt-4">
              <Account onNavigate={() => setMoreOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <TabBar tabs={tabs} moreActive={moreActive} moreOpen={moreOpen} onMore={() => setMoreOpen((open) => !open)} />

      {/* Desktop: a fixed sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-300 px-4 py-8 lg:flex">
        <Link href="/dashboard" className="mb-8 block px-3">
          <span className="title block truncate text-2xl leading-tight">{settings.name}</span>
          <span className="mt-1 block text-xs text-slate-500">Classmate</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks items={main} staffItems={staff} />
        </div>
        <div className="mt-4 border-t border-slate-300 pt-4">
          <Account />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-10 lg:px-12 lg:pb-16 lg:pt-12">
        <div className="max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
