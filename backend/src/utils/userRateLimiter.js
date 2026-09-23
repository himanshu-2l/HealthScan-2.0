/**
 * Unified User Rate Limiter across Express and Vercel Serverless
 * 
 * Supports:
 * 1. Redis / Upstash / Vercel KV if env configured
 * 2. Sliding window in-memory tracking per user UID or client IP
 * 3. Default: 20 requests per 60 seconds (matching aiProxyLimiter)
 */

const memoryStore = new Map();

// Periodic cleanup of stale sliding windows
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now - record.resetTime > 60000) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Check rate limit for a given key (user ID or IP)
 * 
 * @param {string} key - Identifier (e.g. `user:${uid}` or `ip:${ip}`)
 * @param {number} maxRequests - Maximum allowed requests in window (default 20)
 * @param {number} windowMs - Window duration in ms (default 60000 = 1 minute)
 * @returns {Promise<{ allowed: boolean, remaining: number, resetTime: number, retryAfter: number }>}
 */
export async function checkRateLimit(key, maxRequests = 20, windowMs = 60000) {
  const now = Date.now();

  // 1. Try Upstash / Vercel KV if environment variables are present
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `ratelimit:${key}`;
      // Execute Redis MULTI pipeline: INCR + TTL via Upstash REST API
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['TTL', redisKey]
        ])
      });

      if (pipelineRes.ok) {
        const [incrResult, ttlResult] = await pipelineRes.json();
        const currentCount = incrResult.result;
        let ttl = ttlResult.result;

        if (ttl === -1 || ttl === -2) {
          // Key newly created without TTL, set expiration
          await fetch(`${upstashUrl}/expire/${redisKey}/${Math.ceil(windowMs / 1000)}`, {
            headers: { Authorization: `Bearer ${upstashToken}` }
          });
          ttl = Math.ceil(windowMs / 1000);
        }

        const remaining = Math.max(0, maxRequests - currentCount);
        const resetTime = now + (ttl * 1000);
        const allowed = currentCount <= maxRequests;

        return {
          allowed,
          remaining,
          resetTime,
          retryAfter: allowed ? 0 : Math.max(1, ttl)
        };
      }
    } catch (e) {
      // Fall through to memory store if Redis unreachable
    }
  }

  // 2. Sliding window in-memory fallback
  let record = memoryStore.get(key);
  if (!record || now >= record.resetTime) {
    record = {
      timestamps: [],
      resetTime: now + windowMs
    };
    memoryStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.max(1, retryAfter)
    };
  }

  record.timestamps.push(now);
  const remaining = maxRequests - record.timestamps.length;
  return {
    allowed: true,
    remaining,
    resetTime: record.resetTime,
    retryAfter: 0
  };
}

/**
 * Enforce rate limit on an HTTP request/response object (works on Vercel and Express)
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {object} user - Authenticated user object
 * @param {number} maxRequests - Max requests (default 20)
 * @param {number} windowMs - Window in ms (default 60000)
 * @returns {Promise<boolean>} - True if request is allowed, false if rejected with 429
 */
export async function enforceRateLimit(req, res, user, maxRequests = 20, windowMs = 60000) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()) : (req.socket?.remoteAddress || 'unknown');
  const key = user?.uid ? `user:${user.uid}` : `ip:${ip}`;

  const result = await checkRateLimit(key, maxRequests, windowMs);

  // Set standard rate limit headers
  if (res.setHeader) {
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
  }

  if (!result.allowed) {
    if (res.setHeader) {
      res.setHeader('Retry-After', String(result.retryAfter));
    }
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many AI requests. Please wait a moment before trying again.',
      retryAfter: result.retryAfter
    });
    return false;
  }

  return true;
}

export function resetRateLimitStore() {
  memoryStore.clear();
}
