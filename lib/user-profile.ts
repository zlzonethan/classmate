export const DEFAULT_CLASS_ID = 'default';

export type UserRole = 'STUDENT' | 'CLASS_PRESIDENT' | 'TEACHER';

export function buildDefaultUserProfile({
  uid,
  email,
  displayName,
  classId = DEFAULT_CLASS_ID,
  role = 'STUDENT',
}: {
  uid: string;
  email: string;
  displayName?: string;
  classId?: string;
  role?: UserRole;
}) {
  return {
    uid,
    displayName: displayName || email.split('@')[0] || 'Student',
    email,
    role,
    classId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
