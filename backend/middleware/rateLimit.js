// Lightweight in-memory rate limiter (no external dependency).
// Suitable for a single-process deployment; for multi-instance use a shared
// store (e.g. Redis) instead. Keyed by client IP + a per-route bucket name.

const buckets = new Map();

// Periodically purge expired entries so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

/**
 * @param {object} opts
 * @param {number} opts.windowMs  Time window in milliseconds
 * @param {number} opts.max       Max requests allowed per window
 * @param {string} opts.bucket    Logical name so different routes don't share counters
 * @param {string} [opts.message] Error message returned on limit
 */
const rateLimit = ({ windowMs, max, bucket, message }) => (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  let entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: message || 'Too many requests. Please try again later.',
      retryAfter
    });
  }

  next();
};

module.exports = rateLimit;
