import { NextRequest, NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { calendarEvents } from '@/lib/mock-data';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuthorizedUser } from '@/lib/server-auth';

const fallbackEvents = calendarEvents.map((event) => ({
  id: event.id,
  title: event.title,
  description: event.subject,
  date: event.date,
  time: event.type,
  color: event.color,
  subject: event.subject,
  type: event.type,
  isPublic: true,
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
}));

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Sign in to view calendar events.' }, { status: 401 });
  }

  const db = getAdminDb();

  if (!db) {
    return NextResponse.json(fallbackEvents);
  }

  try {
    const snapshot = await db
      .collection('events')
      .orderBy('date', 'asc')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(fallbackEvents);
    }

    const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description || '',
        date: data.date,
        time: data.time || '',
        color: data.color || '#3b82f6',
        subject: data.subject || 'Class',
        type: data.type || 'Event',
        createdBy: data.createdBy || 'system',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        archived: !!data.archived,
        isPublic: data.isPublic === true,
      };
    }).filter((item) => item.isPublic || item.createdBy === user.uid);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to load calendar events:', error);
    return NextResponse.json({ error: 'Failed to load calendar events.' }, { status: 500 });
  }
}
