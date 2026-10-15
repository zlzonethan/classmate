import { z } from 'zod';

export const aiVerificationResultSchema = z.object({
  imageQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  assignmentMatch: z.enum(['unlikely_match', 'possible_match', 'likely_match']),
  workVisible: z.boolean(),
  completeness: z.enum(['incomplete', 'mostly_complete', 'complete']),
  result: z.enum(['approved', 'needs_review', 'rejected', 'failed']),
  reason: z.string().min(1).max(2000),
  needsHumanReview: z.boolean(),
});

export type AiVerificationResult = z.infer<typeof aiVerificationResultSchema>;

export const createHomeworkInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  subjectId: z.string().trim().min(1),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'dueDate must be an ISO date string',
  }),
  dueTime: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
