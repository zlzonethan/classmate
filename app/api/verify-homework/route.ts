import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel, isAiVerificationEnabled, AI_VERIFICATION_LIMIT_PER_DAY } from '@/lib/ai';
import { aiVerificationResultSchema } from '@/lib/validation';

const usageByDay = new Map<string, number>();

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function recordAiUsage() {
  const today = getTodayKey();
  const current = usageByDay.get(today) ?? 0;
  usageByDay.set(today, current + 1);
  return current + 1;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = aiVerificationResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Malformed AI verification response.', issues: parsed.error.issues }, { status: 422 });
  }

  const today = getTodayKey();
  const currentChecks = usageByDay.get(today) ?? 0;

  if (!isAiVerificationEnabled()) {
    return NextResponse.json(
      {
        status: 'FAILED',
        message: 'AI verification is temporarily unavailable because the Gemini API key is not configured.',
        ai: {
          configured: false,
          dailyLimit: AI_VERIFICATION_LIMIT_PER_DAY,
          usedToday: currentChecks,
          model: getGeminiModel(),
        },
      },
      { status: 503 }
    );
  }

  if (currentChecks >= AI_VERIFICATION_LIMIT_PER_DAY) {
    return NextResponse.json(
      {
        status: 'FAILED',
        message: 'The daily AI verification limit has been reached. Please try again tomorrow or request manual review.',
        ai: {
          configured: true,
          dailyLimit: AI_VERIFICATION_LIMIT_PER_DAY,
          usedToday: currentChecks,
          model: getGeminiModel(),
        },
      },
      { status: 429 }
    );
  }

  const nextCount = recordAiUsage();
  const result = parsed.data;

  return NextResponse.json({
    status: result.result,
    message: result.reason,
    needsHumanReview: result.needsHumanReview,
    ai: {
      configured: true,
      dailyLimit: AI_VERIFICATION_LIMIT_PER_DAY,
      usedToday: nextCount,
      model: getGeminiModel(),
    },
  });
}
