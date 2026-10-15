import { NextRequest, NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { createHomeworkInputSchema } from '@/lib/validation';
import { getAuthorizedUser, isAuthorizedRole } from '@/lib/server-auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json({
      message: 'Firebase admin is not configured yet. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to test Firestore-backed homework data.',
      items: [],
    });
  }

  try {
    const snapshot = await db.collection('homework').limit(20).get();
    const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error', items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Provide a valid Firebase ID token in the Authorization header.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = createHomeworkInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid homework payload.', issues: parsed.error.issues }, { status: 422 });
  }

  const role = user.role || 'STUDENT';
  if (!isAuthorizedRole(user.uid, 'CLASS_PRESIDENT', role)) {
    return NextResponse.json({ error: 'Forbidden. Only class presidents and teachers can create homework.' }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({
      error: 'Firebase admin is not configured. Homework creation cannot be saved until the server environment variables are set.',
    }, { status: 503 });
  }

  const now = new Date().toISOString();
  const item = {
    ...parsed.data,
    attachmentUrls: body.attachmentUrls || [],
    createdBy: user.uid,
    createdAt: now,
    updatedAt: now,
    archived: false,
  };

  const docRef = await db.collection('homework').add(item);

  return NextResponse.json({ id: docRef.id, ...item }, { status: 201 });
}
