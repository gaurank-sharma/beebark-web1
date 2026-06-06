// Dependency-free security hardening (no extra npm packages required).

// Recursively strip MongoDB operator keys ($...) and dotted keys from objects
// to prevent NoSQL/operator-injection via request payloads.
const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue; // drop dangerous keys
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  // req.query is a getter on some Express versions; mutate in place if possible
  if (req.query && typeof req.query === 'object') {
    try {
      const cleaned = sanitizeValue(req.query);
      for (const k of Object.keys(req.query)) delete req.query[k];
      Object.assign(req.query, cleaned);
    } catch (_) {
      /* query is read-only in this runtime; skip */
    }
  }
  next();
};

// Conservative security response headers (helmet-style, without the dependency).
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=(self)');
  res.removeHeader('X-Powered-By');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

module.exports = { sanitizeRequest, securityHeaders };
