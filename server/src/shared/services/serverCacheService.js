/**
 * High-Performance Live Server Cache & Optimization Service
 * Provides instant in-memory API caching, HTTP Cache-Control headers,
 * and smart cache invalidation for maximum PageSpeed scores.
 */

class ServerCacheService {
  constructor() {
    this.cache = new Map();
    this.isHighSpeedModeEnabled = true;
    this.defaultTtlMs = 60 * 1000; // 60 seconds TTL
    this.stats = { hits: 0, misses: 0, purges: 0 };
  }

  // Middleware for public GET API endpoints
  apiCacheMiddleware() {
    return (req, res, next) => {
      // Only cache GET requests when High-Speed Mode is active
      if (!this.isHighSpeedModeEnabled || req.method !== 'GET') {
        return next();
      }

      // Do not cache authenticated admin requests or live alerts endpoint (needs instant real-time freshness)
      if (req.headers.authorization || req.path.startsWith('/api/admin') || req.path.includes('/live-alerts')) {
        return next();
      }

      const cacheKey = req.originalUrl || req.url;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiresAt) {
        this.stats.hits++;
        res.setHeader('X-Server-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
        return res.status(cached.status).json(cached.data);
      }

      this.stats.misses++;
      res.setHeader('X-Server-Cache', 'MISS');

      // Intercept res.json to store response in memory
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.cache.set(cacheKey, {
            status: res.statusCode,
            data: body,
            expiresAt: Date.now() + this.defaultTtlMs
          });
        }
        return originalJson(body);
      };

      next();
    };
  }

  // Static Asset Caching Middleware (CSS, JS, WebP, Images, Fonts)
  staticAssetCacheMiddleware() {
    return (req, res, next) => {
      const url = req.path || '';
      if (url.startsWith('/assets/') || /\.(webp|png|jpg|jpeg|gif|svg|woff2|woff|ttf|css|js)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
      }
      next();
    };
  }

  // Purge all API caches instantly (called on new post / job alert update)
  purgeApiCache() {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.purges++;
    console.log(`[ServerCache] Purged ${count} API response cache entries. Fresh data ready!`);
    return count;
  }

  // Enable/Disable High-Speed Engine
  setHighSpeedMode(enabled = true) {
    this.isHighSpeedModeEnabled = enabled;
    if (!enabled) {
      this.purgeApiCache();
    }
    console.log(`[ServerCache] High-Speed Performance Engine is now ${enabled ? 'ENABLED ⚡' : 'DISABLED'}`);
    return this.isHighSpeedModeEnabled;
  }

  getStats() {
    return {
      enabled: this.isHighSpeedModeEnabled,
      entriesCount: this.cache.size,
      stats: this.stats
    };
  }
}

const serverCacheService = new ServerCacheService();
module.exports = serverCacheService;
