export function getAppNavigation(activePage: string) {
  return [
    { label: 'Dashboard', href: '/dashboard', active: activePage === 'dashboard' },
    { label: 'Homework', href: '/homework', active: activePage === 'homework' },
    { label: 'Calendar', href: '/calendar', active: activePage === 'calendar' },
    { label: 'Announcements', href: '/announcements', active: activePage === 'announcements' },
    { label: 'Leaderboard', href: '/leaderboard', active: activePage === 'leaderboard' },
    { label: 'Profile & stats', href: '/profile', active: activePage === 'profile' },
  ];
}
