import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json({
      id: 'demo-class',
      name: 'Class 2A',
      timezone: 'Asia/Seoul',
      classCode: '2A-2026',
      settings: {
        defaultAiVerificationEnabled: true,
        weeklyChallengeGoal: 200,
        xpPerApprovedHomework: 10,
        earlyCompletionBonusXp: 3,
      },
      message: 'Firebase Admin is not configured yet; this is the default class profile used for local scaffolding.',
    });
  }

  try {
    const snapshot = await db.collection('classes').doc('default').get();

    if (!snapshot.exists) {
      return NextResponse.json({
        id: 'default',
        name: 'Class 2A',
        timezone: 'Asia/Seoul',
        classCode: '2A-2026',
        settings: {
          defaultAiVerificationEnabled: true,
          weeklyChallengeGoal: 200,
          xpPerApprovedHomework: 10,
          earlyCompletionBonusXp: 3,
        },
      });
    }

    return NextResponse.json({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
