'use client';

import { useEffect, useState } from 'react';

type CalendarEvent = {
  id: string;
  title: string;
  subject: string;
  color: string;
  date: string;
  type: string;
};

const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayBlocks = Array.from({ length: 35 }, (_, index) => index + 1);

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch('/api/events', { cache: 'no-store' });
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Schedule</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Calendar</h1>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+ Add item</button>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-600 shadow-soft">Loading calendar…</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-soft md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">October</p>
                  <h2 className="text-2xl font-bold text-slate-900">2026</h2>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <button className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">Prev</button>
                  <button className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">Next</button>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-7 gap-3 text-center text-sm font-medium text-slate-500">
                {calendarDays.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {dayBlocks.map((day) => {
                  const event = events.find((entry) => Number(entry.date.slice(-2)) === day);
                  return (
                    <div key={day} className="flex h-24 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <span className="text-xs font-medium text-slate-500">{day}</span>
                      {event ? (
                        <span className="mt-auto rounded px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: event.color }}>
                          {event.title}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
                <h3 className="text-xl font-semibold text-slate-900">Upcoming</h3>
                <div className="mt-5 space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: event.color }} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{event.type}</span>
                      </div>
                      <p className="mt-2 font-semibold text-slate-900">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.subject}</p>
                      <p className="mt-1 text-xs text-slate-400">{event.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
                <h3 className="text-xl font-semibold text-slate-900">Quick add</h3>
                <div className="mt-4 grid gap-2">
                  {['Homework', 'Test', 'Reminder', 'Event'].map((item) => (
                    <button key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
                      + Add {item}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
