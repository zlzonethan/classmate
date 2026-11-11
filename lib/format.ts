/** Turns a due date into a short label such as "Due tomorrow · 20:00". */
export function formatDue(dueDate: string, dueTime?: string) {
  const date = new Date(`${dueDate}T${dueTime || '23:59'}:00`);
  if (Number.isNaN(date.getTime())) return { label: `Due ${dueDate}`, urgent: false };

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startOfDueDate.getTime() - startOfToday.getTime()) / 86400000);
  const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const label = days < 0
    ? `Overdue · ${day}`
    : days === 0
      ? 'Due today'
      : days === 1
        ? 'Due tomorrow'
        : `Due ${day}`;

  return { label: dueTime ? `${label} · ${dueTime}` : label, urgent: days <= 0 };
}

export function formatDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
