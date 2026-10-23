export const quickStats = [
  { label: 'Homework done', value: '18/24', change: '+4 this week' },
  { label: 'XP earned', value: '1,280', change: '+120 today' },
  { label: 'Class goal', value: '72%', change: 'Need 28 more' },
];

export const dashboardCards = [
  { label: 'Weekly challenge', value: '520 / 800', progress: 65 },
  { label: 'Team battle', value: '4th place', progress: 72 },
  { label: 'Readiness', value: '83%', progress: 83 },
  { label: 'Announcements', value: '3 new', progress: 38 },
];

export const tomorrowItems = [
  { title: 'Algebra worksheet', subject: 'Mathematics', color: '#3b82f6', meta: 'Pages 42–43 · Due tomorrow', time: '8:00 PM', kind: 'Homework' },
  { title: 'Biology quiz', subject: 'Science', color: '#22c55e', meta: 'Chapter 5 review · 9:15 AM', time: '9:15 AM', kind: 'Test' },
  { title: 'School event', subject: 'Campus', color: '#f59e0b', meta: 'Volunteer fair · 12:30 PM', time: '12:30 PM', kind: 'Event' },
];

export const upcomingItems = [
  { title: 'Algebra worksheet', subject: 'Mathematics', color: '#3b82f6', meta: 'Pages 42–43 · Due tomorrow', time: '8:00 PM' },
  { title: 'Lab report draft', subject: 'Science', color: '#22c55e', meta: 'Evidence check · Due 8:15 PM', time: '8:15 PM' },
  { title: 'Essay outline', subject: 'English', color: '#8b5cf6', meta: 'Paragraph plan · Due tomorrow', time: '9:00 PM' },
  { title: 'History quiz', subject: 'History', color: '#f97316', meta: 'Chapter 5 · Friday', time: 'Friday' },
];

export const demoAssignments = [
  {
    id: 'demo-algebra',
    title: 'Algebra worksheet',
    subjectId: 'Mathematics',
    dueDate: '2026-10-17',
    dueTime: '20:00',
    priority: 'high' as const,
    description: 'Pages 42–43',
  },
  {
    id: 'demo-lab-report',
    title: 'Lab report draft',
    subjectId: 'Science',
    dueDate: '2026-10-17',
    dueTime: '20:15',
    priority: 'medium' as const,
    description: 'Upload your evidence check',
  },
  {
    id: 'demo-essay-outline',
    title: 'Essay outline',
    subjectId: 'English',
    dueDate: '2026-10-17',
    dueTime: '21:00',
    priority: 'medium' as const,
    description: 'Prepare a paragraph plan',
  },
  {
    id: 'demo-history-quiz',
    title: 'History quiz',
    subjectId: 'History',
    dueDate: '2026-10-20',
    dueTime: '',
    priority: 'low' as const,
    description: 'Review Chapter 5',
  },
];

export const demoLeaderboard = [
  { uid: 'demo-1', displayName: 'Hana Kim', xp: 1280, completed: 18 },
  { uid: 'demo-2', displayName: 'Jisoo Park', xp: 1140, completed: 16 },
  { uid: 'demo-3', displayName: 'Minjun Lee', xp: 980, completed: 14 },
  { uid: 'demo-4', displayName: 'You', xp: 860, completed: 12 },
  { uid: 'demo-5', displayName: 'Yuna Choi', xp: 740, completed: 11 },
];

export const recentActivity = [
  { id: 1, title: 'History quiz added', description: 'Chapter 5 review unlocked', time: '2h ago' },
  { id: 2, title: 'AI verification approved', description: 'English homework photo reviewed', time: '5h ago' },
  { id: 3, title: 'Class announcement pinned', description: 'School trip update was shared', time: '1d ago' },
  { id: 4, title: 'New team challenge', description: 'Complete 200 eligible XP this week', time: '2d ago' },
];

export const announcementFeed = [
  {
    slug: 'important-schedule-update',
    title: 'Important schedule update',
    content: 'Project presentation times are moving to Thursday to accommodate the lab trip. Please mark the revised time in your calendar and bring your printed outline to class.',
    pinned: true,
    meta: 'Posted 2 hours ago · Class President',
  },
  {
    slug: 'midterm-review-session',
    title: 'Midterm review session',
    content: 'The English review session will be held in the library after school this Wednesday. Students who want feedback on their essay draft can bring a printed outline.',
    pinned: false,
    meta: 'Posted yesterday · Teacher',
  },
  {
    slug: 'class-goal-reminder',
    title: 'Class goal reminder',
    content: 'We are 72% of the way to this week’s team challenge. Keep the momentum going and check the reward board after the next homework upload.',
    pinned: false,
    meta: 'Posted 2 days ago · Class President',
  },
];

export const calendarEvents = [
  { id: 'event-1', date: '2026-10-15', title: 'Math quiz', subject: 'Mathematics', color: '#3b82f6', type: 'Test' },
  { id: 'event-2', date: '2026-10-16', title: 'Science lab', subject: 'Science', color: '#22c55e', type: 'Event' },
  { id: 'event-3', date: '2026-10-17', title: 'Essay draft due', subject: 'English', color: '#8b5cf6', type: 'Homework' },
  { id: 'event-4', date: '2026-10-18', title: 'History review', subject: 'History', color: '#f97316', type: 'Reminder' },
  { id: 'event-5', date: '2026-10-20', title: 'Team challenge', subject: 'Class goal', color: '#10b981', type: 'Goal' },
];
