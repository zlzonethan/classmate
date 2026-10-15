export const AI_VERIFICATION_LIMIT_PER_DAY = 50;
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export function isAiVerificationEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}
