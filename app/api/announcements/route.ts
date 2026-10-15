import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { announcementFeed } from '@/lib/mock-data';
import { getAdminDb } from '@/lib/firebase-admin';

const fallbackAnnouncements = announcementFeed.map((item) => ({
  id: item.slug,
  slug: item.slug,
  title: item.title,
  content: item.content,
  pinned: item.pinned,
  attachmentUrls: [],
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  meta: item.meta,
}));

export async function GET() {
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json(fallbackAnnouncements);
  }

  try {
    const snapshot = await db
      .collection('announcements')
      .orderBy('pinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(fallbackAnnouncements);
    }

    const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        title: data.title,
        content: data.content,
        pinned: !!data.pinned,
        attachmentUrls: data.attachmentUrls || [],
        createdBy: data.createdBy || 'system',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        archived: !!data.archived,
        meta: data.meta || `${data.createdBy ? 'Shared by ' + data.createdBy : 'Shared'} · ${new Date(data.createdAt || Date.now()).toLocaleDateString()}`,
      };
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json(fallbackAnnouncements, { status: 200 });
  }
}
