/**
 * In-memory rate limiter middleware
 * Uses a sliding window algorithm for rate limiting
 */

/**
 * Get client identifier from request
 * @param {import('express').Request} req 
 * @returns {string}
 */
const getClientKey = (req) => {
  // Try to get real IP from various headers (for proxied requests)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
};

/**
 * Create a rate limiter middleware
 * @param {object} options - Rate limiter options
 * @param {number} options.maxRequests - Maximum requests allowed in window (default: 100)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {string} options.message - Error message to send when rate limited
 * @param {boolean} options.skipFailedRequests - Don't count failed requests (default: false)
 * @param {function} options.keyGenerator - Custom function to generate client key
 * @param {function} options.skip - Function to skip rate limiting for certain requests
 * @returns {import('express').RequestHandler}
 */
export const createRateLimiter = (options = {}) => {
  const {
    maxRequests = 100,
    windowMs = 60000,
    message = 'Too many requests, please try again later',
    skipFailedRequests = false,
    keyGenerator = getClientKey,
    skip = null,
    headers = true
  } = options;

  // Store for tracking requests: Map<clientKey, { count: number, resetTime: number, timestamps: number[] }>
  const requestStore = new Map();

  // Cleanup old entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestStore.entries()) {
      if (now >= data.resetTime) {
        requestStore.delete(key);
      }
    }
  }, windowMs);

  // Prevent memory leak by allowing cleanup interval to be cleared
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // Skip rate limiting if skip function returns true
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create entry for this client
    let clientData = requestStore.get(key);

    if (!clientData || now >= clientData.resetTime) {
      // Create new window
      clientData = {
        count: 0,
        resetTime: now + windowMs,
        timestamps: []
      };
      requestStore.set(key, clientData);
    }

    // Clean old timestamps (sliding window)
    clientData.timestamps = clientData.timestamps.filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if rate limit exceeded
    if (clientData.timestamps.length >= maxRequests) {
      // Calculate retry after
      const oldestTimestamp = clientData.timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      if (headers) {
        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', String(Math.ceil(clientData.resetTime / 1000)));
        res.set('Retry-After', String(retryAfter));
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        message: message,
        retryAfter: retryAfter,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Track this request (will be counted at end if skipFailedRequests)
    if (skipFailedRequests) {
      res.on('finish', () => {
        // Only count successful requests (2xx status)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          clientData.timestamps.push(now);
          clientData.count++;
        }
      });
    } else {
      clientData.timestamps.push(now);
      clientData.count++;
    }

    // Set rate limit headers
    if (headers) {
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - clientData.timestamps.length)));
      res.set('X-RateLimit-Reset', String(Math.ceil(clientData.resetTime / 1000)));
    }

    next();
  };
};

/**
 * Pre-configured rate limiters for common use cases
 */

// General API rate limiter: 100 requests per minute
export const apiLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
  message: 'Too many API requests, please try again in a minute'
});

// Strict rate limiter for sensitive endpoints: 10 requests per minute
export const strictLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  message: 'Too many requests to this endpoint, please try again later'
});

// Auth rate limiter: 5 attempts per 15 minutes
export const authLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again in 15 minutes'
});

// Assessment submission limiter: 30 per hour
export const assessmentLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 60 * 1000,
  message: 'Too many assessment submissions, please try again later'
});

// Report generation limiter: 10 per hour (resource intensive)
export const reportLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many report generation requests, please try again later'
});

export default {
  createRateLimiter,
  apiLimiter,
  strictLimiter,
  authLimiter,
  assessmentLimiter,
  reportLimiter
};
