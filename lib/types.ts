export type UserRole = 'STUDENT' | 'CLASS_PRESIDENT' | 'TEACHER';

export type HomeworkRecord = {
  id?: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  attachmentUrls?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
};

export type HomeworkCompletion = {
  completed: boolean;
  completedAt?: string;
  updatedAt?: string;
};

export type VerificationStatus = 'PENDING' | 'AI_PROCESSING' | 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' | 'FAILED';

export type AiVerificationSubmission = {
  assignmentId: string;
  studentUid: string;
  status: VerificationStatus;
  createdAt: string;
  reason?: string;
  needsHumanReview?: boolean;
};
