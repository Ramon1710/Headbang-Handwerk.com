const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

const requestBuckets = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(nowMs: number) {
  for (const [key, entry] of requestBuckets.entries()) {
    if (nowMs - entry.windowStartedAt >= WINDOW_MS) {
      requestBuckets.delete(key);
    }
  }
}

function normalizeIp(candidate: string) {
  return candidate.trim().slice(0, 80) || 'unknown';
}

export function getEventSponsoringRequestRateLimitKey(input: {
  eventId: string;
  forwardedFor?: string | null;
  realIp?: string | null;
  userAgent?: string | null;
}) {
  const forwarded = String(input.forwardedFor || '').split(',')[0] || '';
  const ip = normalizeIp(forwarded || String(input.realIp || ''));
  const userAgent = String(input.userAgent || '').trim().slice(0, 120) || 'unknown-agent';
  return `${input.eventId}:${ip}:${userAgent}`;
}

export function consumeEventSponsoringRequestRateLimit(key: string, now = Date.now()) {
  cleanupExpiredEntries(now);
  const existing = requestBuckets.get(key);

  if (!existing || now - existing.windowStartedAt >= WINDOW_MS) {
    requestBuckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true as const, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false as const, remaining: 0 };
  }

  existing.count += 1;
  requestBuckets.set(key, existing);
  return { allowed: true as const, remaining: MAX_REQUESTS_PER_WINDOW - existing.count };
}
