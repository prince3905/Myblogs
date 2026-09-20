/**
 * Production-Grade In-Memory IP Rate Limiter
 * Protects public API endpoints from bot abuse, rogue scrapers & DDoS flooding
 */
const ipStore = new Map();

// Configuration: 180 requests per minute per IP
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 180;

// Periodic cleanup of expired IP records every 5 minutes to keep memory permanently under 1MB
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipStore.entries()) {
    if (now - data.startTime > WINDOW_MS * 2) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

function publicApiRateLimiter(req, res, next) {
  // Only protect /api routes (ignore static assets, sitemap, robots)
  if (!req.path.startsWith('/api') && !req.originalUrl.startsWith('/api')) {
    return next();
  }

  // Exempt internal health checks
  if (req.path === '/api/health' || req.originalUrl === '/api/health') {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();

  let ipRecord = ipStore.get(clientIp);

  if (!ipRecord || now - ipRecord.startTime > WINDOW_MS) {
    ipRecord = { count: 1, startTime: now };
    ipStore.set(clientIp, ipRecord);
  } else {
    ipRecord.count++;
  }

  // Inject rate limit status headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - ipRecord.count));

  if (ipRecord.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[Bot Defense Rate-Limit] IP ${clientIp} exceeded threshold (${ipRecord.count} req/min). Request blocked.`);
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Excessive automated requests are temporarily paused for security. Please retry in 1 minute.',
      retryAfterSeconds: Math.ceil((ipRecord.startTime + WINDOW_MS - now) / 1000)
    });
  }

  next();
}

module.exports = publicApiRateLimiter;
