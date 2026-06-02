type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();

// Prune entries older than 5 minutes to avoid unbounded memory growth
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60_000) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 5 * 60_000) store.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowSecs: number): boolean {
  maybePrune();
  const now = Date.now();
  const windowMs = windowSecs * 1_000;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}
