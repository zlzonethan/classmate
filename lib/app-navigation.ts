export function getAppNavigation(activePage: string) {
  return [
    { label: 'Home', href: '/dashboard', active: activePage === 'dashboard' },
    { label: 'Homework', href: '/homework', active: activePage === 'homework' },
    { label: 'Calendar', href: '/calendar', active: activePage === 'calendar' },
    { label: 'Announcements', href: '/announcements', active: activePage === 'announcements' },
    { label: 'Suggestion box', href: '/suggestions', active: activePage === 'suggestions' },
    { label: 'Leaderboard', href: '/leaderboard', active: activePage === 'leaderboard' },
  ];
}
