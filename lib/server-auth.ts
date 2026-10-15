import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function getAuthorizedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

export function isAuthorizedRole(uid: string | undefined, role: 'STUDENT' | 'CLASS_PRESIDENT' | 'TEACHER', userRole?: string) {
  if (!uid) return false;
  if (!userRole) return role === 'STUDENT';
  if (role === 'STUDENT') return true;
  if (role === 'CLASS_PRESIDENT') return userRole === 'CLASS_PRESIDENT' || userRole === 'TEACHER';
  if (role === 'TEACHER') return userRole === 'TEACHER';
  return false;
}
