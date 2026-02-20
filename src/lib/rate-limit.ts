const hits = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  hits.forEach((entry, key) => {
    if (now > entry.resetAt) hits.delete(key);
  });
}, 60_000);

// Allow Node process to exit even if timer is running
if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
  (cleanupTimer as NodeJS.Timeout).unref();
}

export function rateLimit(
  key: string,
  { maxRequests = 10, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: maxRequests - entry.count };
}

/**
 * Convenience wrapper for login rate limiting.
 * Allows 10 attempts per minute per IP.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const result = rateLimit(`login:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  return { allowed: result.ok, retryAfter: result.retryAfter };
}
