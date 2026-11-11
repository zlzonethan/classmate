export type NavIcon = 'home' | 'homework' | 'calendar' | 'announcements' | 'suggestions' | 'leaderboard' | 'settings';

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  active?: boolean;
  /** Only shown to the class president and teachers. */
  staffOnly?: boolean;
};

const pages: Omit<NavItem, 'active'>[] = [
  { label: 'Home', href: '/dashboard', icon: 'home' },
  { label: 'Homework', href: '/homework', icon: 'homework' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Announcements', href: '/announcements', icon: 'announcements' },
  { label: 'Suggestion box', href: '/suggestions', icon: 'suggestions' },
  { label: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard' },
  { label: 'Class settings', href: '/settings', icon: 'settings', staffOnly: true },
];

export function getAppNavigation(activePage: string): NavItem[] {
  return pages.map((page) => ({
    ...page,
    active: page.href === (activePage === 'dashboard' ? '/dashboard' : `/${activePage}`),
  }));
}
