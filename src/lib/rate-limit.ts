const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(token: string): {
  allowed: boolean;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const bucket = tokenBuckets.get(token);

  if (!bucket || now - bucket.lastRefill > WINDOW_MS) {
    tokenBuckets.set(token, { tokens: RATE_LIMIT - 1, lastRefill: now });
    return { allowed: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }

  if (bucket.tokens <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reset: bucket.lastRefill + WINDOW_MS,
    };
  }

  bucket.tokens -= 1;
  return {
    allowed: true,
    remaining: bucket.tokens,
    reset: bucket.lastRefill + WINDOW_MS,
  };
}
