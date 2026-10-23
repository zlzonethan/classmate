export type UserRole = 'STUDENT' | 'CLASS_PRESIDENT' | 'TEACHER';

export interface SubjectDefinition {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  timezone: string;
  classCode: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    defaultAiVerificationEnabled: boolean;
    weeklyChallengeGoal: number;
    xpPerApprovedHomework: number;
    earlyCompletionBonusXp: number;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  status?: string;
  role: UserRole;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkRecord {
  id?: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  attachmentUrls: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HomeworkCompletion {
  completed: boolean;
  completedAt?: string;
  updatedAt?: string;
}

export interface TestRecord {
  id?: string;
  title: string;
  subjectId: string;
  testDate: string;
  testRange?: string;
  location?: string;
  notes?: string;
  attachmentUrls: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface AnnouncementRecord {
  id?: string;
  title: string;
  content: string;
  pinned: boolean;
  attachmentUrls: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface EventRecord {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface XPTransaction {
  id?: string;
  uid: string;
  homeworkId?: string;
  submissionId?: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface AIUsageRecord {
  dateKey: string;
  count: number;
  lastUpdatedAt: string;
}
