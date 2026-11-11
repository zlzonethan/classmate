'use client';

import type { ReactNode } from 'react';
import { useCurrentUser } from '@/lib/use-current-user';

/** Renders its children only for the class president and teachers. */
export function StaffOnly({ children }: { children: ReactNode }) {
  const { isStaff } = useCurrentUser();
  return isStaff ? <>{children}</> : null;
}
