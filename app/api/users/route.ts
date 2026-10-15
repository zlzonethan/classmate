import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuthorizedUser } from '@/lib/server-auth';
import { buildDefaultUserProfile } from '@/lib/user-profile';

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Provide a valid Firebase ID token.' }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({
      uid: user.uid,
      displayName: user.name || user.email || 'Student',
      email: user.email || '',
      role: 'STUDENT',
      classId: 'default',
      note: 'Firebase Admin is not configured yet; this is a safe local placeholder profile.',
    });
  }

  try {
    const snapshot = await db.collection('users').doc(user.uid).get();

    if (!snapshot.exists) {
      const profile = buildDefaultUserProfile({ uid: user.uid, email: user.email || '', displayName: user.name || user.email || 'Student' });
      await db.collection('users').doc(user.uid).set(profile);
      return NextResponse.json(profile);
    }

    return NextResponse.json(snapshot.data());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Provide a valid Firebase ID token.' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
  const requestedDisplayName = 'displayName' in body && typeof body.displayName === 'string'
    ? body.displayName.trim().slice(0, 100)
    : '';

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({
      uid: user.uid,
      displayName: requestedDisplayName || user.name || user.email || 'Student',
      email: user.email || '',
      role: 'STUDENT',
      classId: 'default',
      note: 'Firebase Admin is not configured yet; profile data is not persisted until server credentials are provided.',
    });
  }

  try {
    const profileRef = db.collection('users').doc(user.uid);
    const snapshot = await profileRef.get();
    const displayName = requestedDisplayName || user.name || user.email || 'Student';

    if (snapshot.exists) {
      const existing = snapshot.data()!;
      const profile = {
        ...existing,
        uid: user.uid,
        displayName,
        email: user.email || '',
        updatedAt: new Date().toISOString(),
      };
      await profileRef.update({
        displayName: profile.displayName,
        email: profile.email,
        updatedAt: profile.updatedAt,
      });
      return NextResponse.json(profile);
    }

    const profile = buildDefaultUserProfile({
      uid: user.uid,
      email: user.email || '',
      displayName,
    });
    await profileRef.create(profile);
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
