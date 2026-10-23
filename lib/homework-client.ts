import { collection, getDocs } from 'firebase/firestore';
import type { HomeworkRecord } from '@/lib/firestore-schema';
import { getFirebaseDb } from '@/lib/firebase';

export async function getClassHomework(): Promise<HomeworkRecord[]> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not configured, so assignments cannot be loaded.');
  }

  const snapshot = await getDocs(collection(db, 'homework'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as HomeworkRecord));
}
