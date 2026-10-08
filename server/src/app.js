const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const compression = require('compression');
const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const publicApiRateLimiter = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
require('./modules/posts/webstory.model');
const postRoutes = require('./modules/posts/post.routes');
const adminRoutes = require('./modules/posts/admin-post.routes');
const adminActivityRoutes = require('./modules/admin/admin.routes');
const commentRoutes = require('./modules/comments/comment.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const newsletterRoutes = require('./modules/newsletter/newsletter.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const pexelsRoutes = require('./modules/pexels/pexels.routes');
const adRoutes = require('./modules/ads/ad.routes');
const keywordRoutes = require('./modules/keywords/keyword.routes');
const liveAlertRoutes = require('./modules/liveAlerts/liveAlert.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const currentAffairsRoutes = require('./modules/currentAffairs/currentAffairs.routes');
const autoPublishRoutes = require('./modules/autoPublisher/multiCategory.routes');
const { geoTranslateMiddleware } = require('./shared/middleware/geoTranslate');
const { sitemap, robots, rssFeed, getHomepageData } = require('./modules/posts/post.controller');
const serverCacheService = require('./shared/services/serverCacheService');

const app = express();
app.set('trust proxy', true);
const publicPath = path.join(__dirname, '../public');

// Static asset HTTP Cache-Control header injection (max-age 1 year for static assets)
app.use(serverCacheService.staticAssetCacheMiddleware());

// Keep-Alive Connection Tuning Header Middleware (Prevents crawler socket hang-ups & timeouts)
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65');
  next();
});

// Helper to extract clean final slug from noisy or nested paths
const extractCleanSlug = (pathStr) => {
  const parts = (pathStr || '').split('/').filter(Boolean);
  const validParts = parts.filter(p => {
    const lower = p.toLowerCase();
    return lower !== 'blog' &&
           lower !== 'category' &&
           lower !== 'india' &&
           lower !== 'sarkari-jobs-exams' &&
           !lower.includes('sarkari-jobs') &&
           !lower.includes('digitalhomeblog.in') &&
           !lower.startsWith('http');
  });
  let raw = validParts.length > 0 ? validParts[validParts.length - 1] : '';
  // Strip trailing .html or .php if present
  raw = raw.replace(/\.(html?|php)$/i, '');
  return raw;
};

// 1. EXPRESS MIDDLEWARE: Nested Route & Domain Cleaner + Garbage URL 410 Guard
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.startsWith('/static')) {
    return next();
  }

  const rawUrl = req.originalUrl || req.url || '';
  let decodedUrl = '';
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch (e) {
    // Malformed URI encoding (e.g. invalid % sequence)
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>Resource permanently removed.</p>");
  }

  const decodedPath = decodedUrl.split('?')[0] || '';
  const decodedQuery = decodedUrl.includes('?') ? decodedUrl.slice(decodedUrl.indexOf('?') + 1) : '';

  // 1A. DECODED URL CHECK:
  // Inspect if the URL path contains spaces, square brackets `[` or `]`, Hindi/Devanagari characters,
  // or unmatched query patterns (e.g. /bihar stet, /fatigue simple, /aktu uptac, /[आवेदन समाप्त]...)
  const hasSpacesInPath = decodedPath.includes(' ') || req.path.includes(' ') || decodedPath.includes('%20') || rawUrl.includes('%20') || /\s/.test(decodedPath) || /\s/.test(rawUrl);
  const hasBracketsInPath = decodedPath.includes('[') || decodedPath.includes(']') || decodedPath.includes('%5B') || decodedPath.includes('%5D');
  const hasDevanagariInPath = /[\u0900-\u097F]/.test(decodedPath) || /[\u0900-\u097F]/.test(rawUrl);
  const hasGarbageBracketsInQuery = decodedQuery.includes('[') || decodedQuery.includes(']') || decodedQuery.includes('आवेदन समाप्त');

  if (hasSpacesInPath || hasBracketsInPath || hasDevanagariInPath || hasGarbageBracketsInQuery) {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>Resource permanently removed.</p>");
  }

  // 1B. CLEANUP FOR DEFUNCT OR UNMATCHED SYSTEM ROUTES:
  // Specific defunct URLs like /future, /future/* or /future.* -> 410 Gone explicitly
  if (decodedPath === '/future' || decodedPath.startsWith('/future/') || decodedPath.startsWith('/future.')) {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>Resource permanently removed.</p>");
  }

  // Defer /blog/sarkari-jobs-exams to dedicated DB-backed resolver below
  if (decodedPath.startsWith('/blog/sarkari-jobs-exams')) {
    return next();
  }

  const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
  const canonicalDomain = isProd ? 'https://www.digitalhomeblog.in' : '';

  // Helper to safely redirect without circular loops
  const safeRedirect301 = (targetPath) => {
    const fullTarget = `${canonicalDomain}${targetPath}`;
    if (targetPath === decodedPath || fullTarget === decodedPath || fullTarget === `${canonicalDomain}${decodedPath}`) {
      return next();
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.redirect(301, fullTarget);
  };

  // 1C. DOUBLE NESTED BLOG PATHS (/blog/blog/*):
  // For any route starting with /blog/blog/:slug:
  // - Check if it exists as a blog or job post.
  // - 301 redirect to /india/sarkari-jobs/:slug or /blog/:slug.
  // - If neither exists: Return HTTP 410 Gone.
  if (/\/(?:blog\/){2,}/i.test(decodedPath)) {
    const targetSlug = extractCleanSlug(decodedPath);
    if (!targetSlug) {
      return safeRedirect301('/india/sarkari-jobs');
    }

    let destinationPath = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const BlogPost = mongoose.model('BlogPost');
        const post = await BlogPost.findOne({ slug: targetSlug, status: 'published' }).select('slug category').lean();
        if (post) {
          destinationPath = `/blog/${encodeURIComponent(post.slug)}`;
        } else {
          const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
          const isValidObjectId = mongoose.Types.ObjectId.isValid(targetSlug) && /^[0-9a-fA-F]{24}$/.test(targetSlug);
          const alert = await LiveAlert.findOne({
            $or: [
              ...(isValidObjectId ? [{ _id: targetSlug }] : []),
              { slug: targetSlug.toLowerCase() }
            ]
          }).select('_id slug title boardName').lean();
          if (alert) {
            const finalSlug = alert.slug || targetSlug;
            destinationPath = `/india/sarkari-jobs/${encodeURIComponent(finalSlug)}`;
          }
        }
      }
    } catch (e) {}

    if (destinationPath) {
      return safeRedirect301(destinationPath);
    }

    // If neither exists: Return HTTP 410 Gone
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
  }

  // 1D. EMBEDDED DOMAIN STRINGS IN PATHS:
  // Detect patterns like /digitalhomeblog.in/*
  if (decodedPath.toLowerCase().includes('digitalhomeblog.in')) {
    const targetSlug = extractCleanSlug(decodedPath);
    const targetPath = targetSlug ? `/india/sarkari-jobs/${encodeURIComponent(targetSlug)}` : '/india/sarkari-jobs';
    return safeRedirect301(targetPath);
  }

  // 1E. EMBEDDED CATEGORY STRINGS WITH AMPERSAND:
  // Detect patterns like /sarkari-jobs-&-exams/* or /sarkari-jobs-%26-exams/*
  if (/sarkari-jobs-(?:&|%26)-exams/i.test(decodedPath)) {
    const targetSlug = extractCleanSlug(decodedPath);
    const targetPath = targetSlug ? `/india/sarkari-jobs/${encodeURIComponent(targetSlug)}` : '/india/sarkari-jobs';
    return safeRedirect301(targetPath);
  }

  // 1F. NORMALIZE /category/sarkari-jobs-exams/:slug & /category/sarkari-jobs-exams:
  const catSarkariMatch = decodedPath.match(/^\/category\/sarkari-jobs-exams\/?(.*)/i);
  if (catSarkariMatch) {
    const rawSlug = extractCleanSlug(catSarkariMatch[1] || '') || (catSarkariMatch[1] || '').replace(/^\/+|\/+$/g, '');
    const targetPath = rawSlug ? `/india/sarkari-jobs/${encodeURIComponent(rawSlug)}` : '/india/sarkari-jobs';
    return safeRedirect301(targetPath);
  }

  // 1G. STANDALONE /sarkari-jobs-exams/:slug or /sarkari-jobs-exams:
  const singleSarkariMatch = decodedPath.match(/^\/sarkari-jobs-exams\/?(.*)/i);
  if (singleSarkariMatch) {
    const rawSlug = extractCleanSlug(singleSarkariMatch[1] || '') || (singleSarkariMatch[1] || '').replace(/^\/+|\/+$/g, '');
    const targetPath = rawSlug ? `/india/sarkari-jobs/${encodeURIComponent(rawSlug)}` : '/india/sarkari-jobs';
    return safeRedirect301(targetPath);
  }

  next();
});

// 1. LEGACY BLOG PREFIX REDIRECTOR (/blog/sarkari-jobs-exams/*)
app.use('/blog/sarkari-jobs-exams', async (req, res, next) => {
  try {
    const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
    const canonicalDomain = isProd ? 'https://www.digitalhomeblog.in' : '';

    const rawUrl = req.originalUrl || req.url || '';
    let decodedUrl = '';
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch (e) {
      decodedUrl = rawUrl;
    }
    const decodedPath = decodedUrl.split('?')[0] || '';

    // Clean up the sub-path: extract the clean :slug, ignoring nested junk like digitalhomeblog.in/sarkari-jobs-&-exams/
    const cleanSlug = extractCleanSlug(decodedPath);

    // If no slug at all (e.g. visiting /blog/sarkari-jobs-exams or /blog/sarkari-jobs-exams/):
    if (!cleanSlug) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs`);
    }

    // Lookup the vacancy in MongoDB:
    const mongoose = require('mongoose');
    let alertDoc = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
      const isValidObjectId = mongoose.Types.ObjectId.isValid(cleanSlug) && /^[0-9a-fA-F]{24}$/.test(cleanSlug);
      alertDoc = await LiveAlert.findOne({
        $or: [
          ...(isValidObjectId ? [{ _id: cleanSlug }] : []),
          { slug: cleanSlug.toLowerCase() }
        ]
      }).select('_id slug title boardName').lean();
    }

    if (alertDoc) {
      const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');
      const finalSlug = alertDoc.slug || sanitizeJobSlug(alertDoc.title, alertDoc.boardName, alertDoc._id.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs/${encodeURIComponent(finalSlug)}`);
    }

    // If not found in DB: Return HTTP 410 Gone (Never return a generic 404 or empty template)
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
  } catch (err) {
    next(err);
  }
});

// 1. DEFENSIVE HANDLER FOR /job-alerts (Prevents 500 Server Errors & CastErrors on Query Parameters)
app.use('/job-alerts', async (req, res, next) => {
  try {
    // If requesting subpath like /job-alerts/:id, defer to path param handler below
    if (req.path !== '/' && req.path !== '') {
      return next();
    }

    if (req.query && req.query.alert !== undefined) {
      const alertParam = typeof req.query.alert === 'string' ? req.query.alert.trim() : '';

      // Validate format: Verify it is a valid 24-character hex string (/^[0-9a-fA-F]{24}$/)
      // If not valid, immediately return HTTP 410 Gone (do NOT proceed to query the database)
      if (!alertParam || !/^[0-9a-fA-F]{24}$/.test(alertParam)) {
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
      }

      // Query MongoDB inside try/catch
      let job = null;
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
          const Job = LiveAlert;
          job = await Job.findById(alertParam).select('slug status title boardName').lean();
        }
      } catch (dbErr) {
        console.error("Job alert lookup error:", dbErr.message);
        if (dbErr.name === 'CastError' || dbErr.name === 'BSONError') {
          res.setHeader('X-Robots-Tag', 'noindex, follow');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
        }
        throw dbErr;
      }

      // If job exists and has a clean slug:
      if (job) {
        const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');
        const cleanSlug = job.slug || sanitizeJobSlug(job.title, job.boardName, job._id ? job._id.toString() : alertParam);
        if (cleanSlug) {
          const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
          const canonicalDomain = isProd ? 'https://www.digitalhomeblog.in' : '';
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs/${encodeURIComponent(cleanSlug)}`);
        }
      }

      // If job does NOT exist in the database (deleted or expired):
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
    }

    // If /job-alerts is requested without ?alert= parameter (or for general alert search):
    res.set('X-Robots-Tag', 'noindex, follow');
    next();
  } catch (err) {
    next(err);
  }
});

// Unified 301 Canonical Redirect Middleware (Eliminates Multi-hop Redirect Chains & Flattens to 1 Hop)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.startsWith('/static')) {
    return next();
  }

  const rawHost = (req.headers.host || '').toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toLowerCase();
  const rawUrl = req.originalUrl || req.url;
  const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';

  // 1. Single-Hop Host & Protocol Normalization (Production)
  // Consolidates HTTP -> HTTPS and non-www -> www into EXACTLY ONE 301 HOP
  if (isProd && (proto !== 'https' || !rawHost.startsWith('www.') || rawHost.includes('onrender.com'))) {
    let cleanPath = rawUrl;
    if (cleanPath.includes('digitalhomeblog.in')) {
      cleanPath = cleanPath.replace(/\/digitalhomeblog\.in\/?/gi, '/').replace(/digitalhomeblog\.in\/?/gi, '');
    }
    if (cleanPath.includes('sarkari-jobs-&-exams') || cleanPath.includes('sarkari-jobs-%26-exams')) {
      cleanPath = cleanPath.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
    }
    if (/\/{2,}/.test(cleanPath)) {
      cleanPath = cleanPath.replace(/\/{2,}/g, '/');
    }
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    const finalTarget = `https://www.digitalhomeblog.in${cleanPath}`;
    console.log(`[Unified 301 Canonical Redirect] ${proto}://${rawHost}${rawUrl} -> ${finalTarget}`);
    return res.redirect(301, finalTarget);
  }

  // 2. Path-level Normalization (Local or Production)
  let needsPathRedirect = false;
  let cleanedPath = rawUrl;

  if (cleanedPath.includes('digitalhomeblog.in')) {
    needsPathRedirect = true;
    cleanedPath = cleanedPath.replace(/\/digitalhomeblog\.in\/?/gi, '/').replace(/digitalhomeblog\.in\/?/gi, '');
  }

  if (cleanedPath.includes('sarkari-jobs-&-exams') || cleanedPath.includes('sarkari-jobs-%26-exams')) {
    needsPathRedirect = true;
    cleanedPath = cleanedPath.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
  }

  if (/\/(blog|category)\/.*\/(blog|category)\//i.test(cleanedPath)) {
    needsPathRedirect = true;
    const parts = cleanedPath.split('/').filter(Boolean);
    const lastSlug = parts[parts.length - 1];
    cleanedPath = `/blog/sarkari-jobs-exams/${lastSlug}`;
  }

  if (/\/{2,}/.test(cleanedPath)) {
    needsPathRedirect = true;
    cleanedPath = cleanedPath.replace(/\/{2,}/g, '/');
  }

  if (!cleanedPath.startsWith('/')) {
    cleanedPath = '/' + cleanedPath;
  }

  if (needsPathRedirect) {
    const finalTarget = isProd
      ? `https://www.digitalhomeblog.in${cleanedPath}`
      : cleanedPath;
    if (finalTarget !== `${proto}://${rawHost}${rawUrl}`) {
      console.log(`[Unified 301 Canonical Redirect] ${proto}://${rawHost}${rawUrl} -> ${finalTarget}`);
      return res.redirect(301, finalTarget);
    }
  }

  next();
});

// Middleware
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://www.digitalhomeblog.in',
    'https://digitalhomeblog.in',
    'https://digital-home-blog.onrender.com',
  ],
  credentials: false,
}));
app.use(express.json({ limit: '50mb' }));
app.use(requestLogger);
app.use('/api', publicApiRateLimiter);

// In-Memory API Cache middleware for public read endpoints
app.use('/api', serverCacheService.apiCacheMiddleware());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, cacheStats: serverCacheService.getStats(), timestamp: new Date().toISOString() });
});

// Geo-translate middleware (detects country & translates for non-IN visitors)
app.use('/api', geoTranslateMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminActivityRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', commentRoutes);
app.use('/api', contactRoutes);
app.use('/api', aiRoutes);
app.use('/api', pexelsRoutes);
app.use('/api', adRoutes.public);
app.use('/api/admin', adRoutes.admin);
app.use('/api', keywordRoutes);
app.use('/api/admin', liveAlertRoutes);
app.use('/api/admin', settingsRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);
app.use('/api/admin/auto-publish', autoPublishRoutes);
app.use('/api/admin/job-guides', require('./modules/jobGuides/jobGuideAutomation.routes'));
app.use('/api/public/trending-pulse', require('./modules/trendingPulse/trendingPulse.routes'));
app.use('/api/global-jobs', require('./modules/globalJobs/globalJob.routes'));

// SEO routes - before static files
const { renderWebStory } = require('./modules/posts/webstory.controller');
app.get('/web-stories/:slug', renderWebStory);
app.get('/sitemap.xml', sitemap);
app.get('/robots.txt', robots);
app.get('/rss.xml', rssFeed);
app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.send('google.com, pub-7044184444698366, DIRECT, f08c47fec0942fa0');
});
app.get(['/indexnow-key.txt', '/indexnow.txt', '/:key.txt'], (req, res, next) => {
  const indexNowKey = process.env.INDEXNOW_KEY || '8f7e2a9b3c4d5e6f7a8b9c0d1e2f3a4b';
  const key = req.params.key;
  if (req.path === '/indexnow-key.txt' || req.path === '/indexnow.txt') {
    res.type('text/plain');
    return res.send(indexNowKey);
  }
  if (key && /^[a-f0-9]{32}$/i.test(key)) {
    res.type('text/plain');
    return res.send(key);
  }
  next();
});

let cachedHomepageHtml = null;
let lastHomepageCacheTime = 0;
let isUpdatingHomepageCache = false;

async function buildHomepageHtml() {
  const indexPath = path.join(publicPath, 'index.html');
  if (!fs.existsSync(indexPath)) return null;
  let html = fs.readFileSync(indexPath, 'utf8');

  // Get pre-cached homepage posts, stories, alerts, and category data
  let data = null;
  try {
    data = await getHomepageData();
  } catch (e) {}

  let initialStories = [];
  let initialAlerts = [];
  let sarkariPosts = [];
  let initialCurrentAffairs = [];
  let lcpPreloadTag = '';

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const WebStory = mongoose.models.WebStory || mongoose.model('WebStory');
      const LiveAlert = mongoose.models.LiveAlert || mongoose.model('LiveAlert');
      const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost');
      const CurrentAffairs = mongoose.models.CurrentAffairs || mongoose.model('CurrentAffairs');

    let initialResults = [];
    let initialAdmits = [];

    const [storiesRes, alertsRes, resultsRes, admitsRes, sarkariRes, caRes] = await Promise.allSettled([
      WebStory.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] } })
        .select('-detailsText')
        .sort({ isHighlight: -1, parsedPostDate: -1, createdAt: -1 })
        .limit(60)
        .lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] }, category: { $regex: /^Result/i } })
        .select('-detailsText')
        .sort({ isHighlight: -1, parsedPostDate: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] }, category: { $regex: /^Admit/i } })
        .select('-detailsText')
        .sort({ isHighlight: -1, parsedPostDate: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      BlogPost.find({ status: 'published', category: 'Sarkari Jobs & Exams' }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean(),
      CurrentAffairs.find({ status: 'published' }).sort({ publishDate: -1, createdAt: -1 }).limit(6).lean()
    ]);

    initialStories = storiesRes.status === 'fulfilled' ? (storiesRes.value || []) : [];
    const rawAlerts = alertsRes.status === 'fulfilled' ? (alertsRes.value || []) : [];
    const rawResults = resultsRes.status === 'fulfilled' ? (resultsRes.value || []) : [];
    const rawAdmits = admitsRes.status === 'fulfilled' ? (admitsRes.value || []) : [];
    const nowTime = Date.now();
    
    const clampDate = (a) => {
      if (a.parsedPostDate && new Date(a.parsedPostDate).getTime() > nowTime) {
        return { ...a, parsedPostDate: a.createdAt || new Date(nowTime) };
      }
      return a;
    };

    initialAlerts = rawAlerts.map(clampDate);
    initialResults = rawResults.map(clampDate);
    initialAdmits = rawAdmits.map(clampDate);
    sarkariPosts = sarkariRes.status === 'fulfilled' ? (sarkariRes.value || []) : [];
    initialCurrentAffairs = caRes.status === 'fulfilled' ? (caRes.value || []) : [];

    const firstImg = initialStories[0]?.slides?.[0]?.image;
    if (firstImg) {
      const optimizedFirstImg = firstImg.includes('pexels.com')
        ? `${firstImg.split('?')[0]}?auto=compress&cs=tinysrgb&dpr=1&fit=crop&w=220&h=391&q=60`
        : firstImg;
      lcpPreloadTag = `<link rel="preload" as="image" href="${optimizedFirstImg}" fetchpriority="high">`;
    }

    const initialPostsPayload = { posts: sarkariPosts, total: sarkariPosts.length, page: 1, pages: 1 };
    const scriptTag = `<script>window.__INITIAL_POSTS__ = ${JSON.stringify(initialPostsPayload).replace(/</g, '\\u003c')}; window.__INITIAL_STORIES__ = ${JSON.stringify(initialStories || []).replace(/</g, '\\u003c')}; window.__INITIAL_ALERTS__ = ${JSON.stringify(initialAlerts || []).replace(/</g, '\\u003c')}; window.__INITIAL_RESULTS__ = ${JSON.stringify(initialResults || []).replace(/</g, '\\u003c')}; window.__INITIAL_ADMITS__ = ${JSON.stringify(initialAdmits || []).replace(/</g, '\\u003c')}; window.__INITIAL_SARKARI_POSTS__ = ${JSON.stringify(sarkariPosts || []).replace(/</g, '\\u003c')}; window.__INITIAL_CURRENT_AFFAIRS__ = ${JSON.stringify(initialCurrentAffairs || []).replace(/</g, '\\u003c')};</script>`;
    html = html.replace('</head>', `${lcpPreloadTag}\n${scriptTag}\n</head>`);
    }
  } catch (ssrErr) {
    console.warn('Failed to pre-fetch initial SSR data:', ssrErr.message);
  }

  // Inject static HTML links for SEO crawlers (limited to top 30 latest posts + top 30 live alerts)
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const BlogPost = mongoose.model('BlogPost');
      const LiveAlert = mongoose.model('LiveAlert');

    const TOP_STATES_REGEX = /uttar pradesh|bihar|rajasthan|madhya pradesh|jharkhand|odisha|delhi|haryana|west bengal|maharashtra/i;
    const [topPosts, topAlerts, topStateAlerts] = await Promise.all([
      BlogPost.find({ 
        status: 'published',
        category: { $regex: /job|sarkari|exam|result|recruitment/i }
      })
        .select('title category slug')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(20)
        .lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] } })
        .select('title _id slug state category')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .limit(25)
        .lean(),
      LiveAlert.find({ 
        status: { $in: ['active', 'published'] },
        state: { $regex: TOP_STATES_REGEX }
      })
        .select('title _id slug state category')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const catUrlSlug = (cat) => (cat || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const visibleHub = `
  <main class="ssr-homepage-hub" aria-label="Latest Sarkari Result & Government Job Vacancies 2026" style="max-width: 1200px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h1 style="font-size: 1.7rem; font-weight: 900; color: #0f172a; margin-bottom: 10px; line-height: 1.3;">Digital Home: Latest Sarkari Result, Govt Jobs & Admit Cards 2026 (सरकारी रिजल्ट)</h1>
    <p style="color: #475569; font-size: 0.98rem; line-height: 1.6; margin-bottom: 24px; max-width: 840px;">सत्यापित सरकारी नौकरी, एडमिट कार्ड, परीक्षा परिणाम व उत्तर कुंजी के नवीनतम अपडेट्स। सभी भर्तियों के लिए सीधे 100% आधिकारिक लिंक उपलब्ध हैं।</p>
    
    <section style="margin-bottom: 30px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; border-bottom: 2px solid #f59e0b; padding-bottom: 6px;">🎯 प्रमुख राज्यों की सरकारी नौकरी (Top States Sarkari Jobs: UP, Bihar, MP, Rajasthan, Jharkhand, Odisha)</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
        <span style="font-size: 0.82rem; font-weight: 700; color: #475569; align-self: center;">राज्य अनुसार देखें:</span>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #e0f2fe; color: #0369a1; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🇮🇳 All India (सभी)</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ उत्तर प्रदेश (UP) 185+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ बिहार (Bihar) 53+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ मध्य प्रदेश (MP) 64+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ राजस्थान (RJ) 45+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ झारखंड (JH) 12+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ ओडिशा (OD) 26+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ दिल्ली (Delhi) 128+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ हरियाणा (HR) 28+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ महाराष्ट्र (MH) 68+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ पश्चिम बंगाल (WB) 34+</a>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
        ${topStateAlerts.map(a => `<a href="/india/sarkari-jobs/${a.slug || a._id}" style="display: block; padding: 12px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; color: #92400e; text-decoration: none; font-weight: 600; font-size: 0.9rem; line-height: 1.4;"><span style="display:block; font-size:0.75rem; color:#b45309; font-weight:700; margin-bottom:2px;">🏛️ ${escapeHtml(a.state || 'State')} Special</span>${escapeHtml(a.title)}</a>`).join('\n        ')}
      </div>
    </section>

    <section style="margin-bottom: 32px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 14px; border-bottom: 2px solid #38bdf8; padding-bottom: 6px;">🔥 वर्तमान में सक्रिय प्रमुख सरकारी भर्तियां (Active Live Sarkari Vacancies 2026)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
        ${topAlerts.map(a => `<a href="/india/sarkari-jobs/${a.slug || a._id}" style="display: block; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #0369a1; text-decoration: none; font-weight: 600; font-size: 0.9rem; line-height: 1.4;"><span style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:2px;">${escapeHtml(a.state || 'All India')}</span>🏛️ ${escapeHtml(a.title)}</a>`).join('\n        ')}
      </div>
    </section>

    <section>
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 14px; border-bottom: 2px solid #10b981; padding-bottom: 6px;">📋 विस्तृत भर्ती विश्लेषण व परीक्षा गाइड (Latest Recruitment Guides & Articles)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
        ${topPosts.map(p => `<a href="/india/sarkari-jobs/${p.slug}" style="display: block; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #15803d; text-decoration: none; font-weight: 600; font-size: 0.9rem; line-height: 1.4;">📝 ${escapeHtml(p.title)}</a>`).join('\n        ')}
      </div>
    </section>
  </main>`;

    html = html.replace('<div id="root"></div>', `<div id="root">${visibleHub}</div>`);
    }
  } catch (dbErr) {
    console.warn('Failed to inject SEO crawler links:', dbErr.message);
  }

  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', '    <link rel="canonical" href="https://www.digitalhomeblog.in" />\n</head>');
  }

  cachedHomepageHtml = html;
  lastHomepageCacheTime = Date.now();
  return html;
}

// Handle root path / with High-Speed In-Memory HTML Cache (0ms - 2ms TTFB)
app.get('/', async (req, res, next) => {
  try {
    const now = Date.now();
    const isLocal = !req.headers.host || req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');

    // In production, ALWAYS serve cached HTML instantly from RAM (2ms TTFB)
    if (!isLocal && cachedHomepageHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.send(cachedHomepageHtml);

      // Stale-While-Revalidate: refresh in background if cache is older than 3 minutes
      if (now - lastHomepageCacheTime > 180000 && !isUpdatingHomepageCache) {
        isUpdatingHomepageCache = true;
        buildHomepageHtml()
          .catch(e => console.warn('Background homepage HTML cache refresh failed:', e.message))
          .finally(() => { isUpdatingHomepageCache = false; });
      }
      return;
    }

    const html = await buildHomepageHtml();
    if (!html) {
      return res.status(404).send('index.html not found');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', isLocal ? 'no-store, no-cache, must-revalidate' : 'public, max-age=0, must-revalidate');
    return res.send(html);
  } catch (err) {
    next(err);
  }
});

// Serve static files with 1-year immutable caching for hashed assets (Vite /assets/*)
app.use(express.static(publicPath, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// In-Memory SSR HTML Cache for Individual Blog Posts (Guarantees <5ms crawler response and prevents timeouts)
const postSsrCache = new Map();
const POST_SSR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Dedicated 404/410 Error Page Renderer for Missing, Deleted or Expired Content
function render404Page(req, res, customMessage = 'यह पेज, सरकारी भर्ती या लेख उपलब्ध नहीं है या हटाया जा चुका है। (This page, job vacancy, or article does not exist or has been removed.)', statusCode = 404) {
  try {
    const indexPath = path.join(publicPath, 'index.html');
    let html = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '<!DOCTYPE html><html><head></head><body></body></html>';

    const is410 = statusCode === 410;
    const notFoundCanonical = 'https://www.digitalhomeblog.in/india/sarkari-jobs';
    const pageTitle = is410 
      ? '410 — Vacancy Expired / Closed | Digital Home' 
      : '404 — Page Not Found | Digital Home';
    
    // For 410 (permanently expired): use 'noindex, follow' so Google drops the URL permanently from crawl queues while following links
    // For 404 (dead/missing): use 'noindex, nofollow'
    const robotsDirective = is410 ? 'noindex, follow' : 'noindex, nofollow';

    const noindexMeta = `
    <title>${pageTitle}</title>
    <meta name="description" content="${customMessage.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${notFoundCanonical}" />
    `;

    const statusBadge = is410
      ? '<div style="display: inline-block; padding: 6px 14px; background: #fee2e2; color: #dc2626; border-radius: 9999px; font-size: 0.85rem; font-weight: 800; margin-bottom: 14px; text-transform: uppercase; border: 1px solid #fecaca;">भर्ती प्रक्रिया समाप्त (Application Closed / Expired)</div>'
      : '';

    const visible404Body = `
    <div id="not-found-container" style="max-width: 720px; margin: 50px auto; padding: 40px 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <div style="font-size: 5rem; font-weight: 900; line-height: 1; color: ${is410 ? '#dc2626' : '#0284c7'}; margin-bottom: 12px; letter-spacing: -2px;">${statusCode}</div>
      ${statusBadge}
      <h1 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 12px; font-weight: 800;">${is410 ? 'भर्ती प्रक्रिया समाप्त — Application Closed / Expired' : 'पेज नहीं मिला — Page Not Found'}</h1>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6; margin-bottom: 28px; max-width: 540px; margin-left: auto; margin-right: auto;">${customMessage}</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/india/sarkari-jobs" style="display: inline-flex; align-items: center; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">🇮🇳 वर्तमान सक्रिय सरकारी नौकरियां (Active Sarkari Jobs)</a>
        <a href="/global-jobs" style="display: inline-flex; align-items: center; padding: 12px 24px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">🌐 Global Gov Jobs</a>
        <a href="/" style="display: inline-flex; align-items: center; padding: 12px 24px; background: #334155; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem;">🏠 Home</a>
      </div>
    </div>
    `;

    html = html.replace(/<title>.*?<\/title>/i, '');
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
    html = html.replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
    html = html.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
    html = html.replace('</head>', `${noindexMeta}\n</head>`);
    html = html.replace('<body>', `<body>\n${visible404Body}`);

    res.setHeader('X-Robots-Tag', robotsDirective);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(statusCode).send(html);
  } catch (e) {
    const is410 = statusCode === 410;
    const robotsDirective = is410 ? 'noindex, follow' : 'noindex, nofollow';
    res.setHeader('X-Robots-Tag', robotsDirective);
    return res.status(statusCode).send(is410 ? '410 Gone / Expired' : '404 Not Found');
  }
}

// Server-Side 301 Redirect for legacy /blog/:slug (Eliminates SPA Orphan Redirects)
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug ? String(req.params.slug).trim() : '';
    if (!slug) return render404Page(req, res);

    const catMap = {
      'sarkari-jobs-exams': 'sarkari-jobs-exams',
      'health-wellness': 'health-wellness',
      'tech-tutorials': 'tech-tutorials',
      'ai-web-tools': 'ai-web-tools',
      'news-trends': 'news-trends',
      'finance-business': 'finance-business'
    };
    if (catMap[slug]) {
      return res.redirect(301, `https://www.digitalhomeblog.in/category/${catMap[slug]}`);
    }

    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return render404Page(req, res);
    }
    const BlogPost = mongoose.model('BlogPost');
    const post = await BlogPost.findOne({ slug, status: 'published' }).select('category slug').lean();
    if (post) {
      const catUrl = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sarkari-jobs-exams';
      return res.redirect(301, `https://www.digitalhomeblog.in/blog/${catUrl}/${post.slug}`);
    }

    // Check if post exists with status: 'archived' -> return strict HTTP 410 Gone with noindex, follow
    const archivedPost = await BlogPost.findOne({ slug }).select('title status category').lean();
    if (archivedPost && archivedPost.status === 'archived') {
      return render404Page(req, res, `यह भर्ती प्रक्रिया या सूचना अब आधिकारिक रूप से समाप्त हो चुकी है (The recruitment/vacancy cycle for "${archivedPost.title}" has officially expired/closed).`, 410);
    }

    return render404Page(req, res, 'यह लेख या ब्लॉग पोस्ट उपलब्ध नहीं है। (This blog article does not exist or has been removed.)', 404);
  } catch {
    return render404Page(req, res);
  }
});

// Dynamic Server-Side Meta Tag Injection for Blog Post Pages (Forces perfect OG/Twitter social scraping & <5ms SSR response)
app.get('/blog/:category/:slug', async (req, res, next) => {
  try {
    const isLocal = !req.headers.host || req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const cacheKey = `${req.params.category}:${req.params.slug}`;

    if (!isLocal) {
      const cached = postSsrCache.get(cacheKey);
      if (cached && (Date.now() - cached.time < POST_SSR_CACHE_TTL)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-SSR-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
        return res.status(cached.status).send(cached.html);
      }
    }

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return render404Page(req, res);
    }
    const BlogPost = mongoose.model('BlogPost');
    let post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!post && req.params.slug) {
      const cleanSlug = req.params.slug.replace(/-(direct-link|step-by-step|apply-now|online-form|\d+).*$/i, '');
      const prefix = req.params.slug.slice(0, 20);
      post = await BlogPost.findOne({
        status: 'published',
        $or: [
          { slug: new RegExp(cleanSlug.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
          { slug: new RegExp('^' + prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
        ]
      }).sort({ publishedAt: -1 }).lean();
    }

    if (post) {
      const { generateFaqSchema, generateJobPostingSchema, generateBreadcrumbSchema } = require('./shared/utils/ctrBoosterEngine');
      const { normalizeCanonicalUrl } = require('./shared/utils/urlUtils');
      const siteName = 'Digital Home Sarkari Result';
      const cleanTitle = (post.title || '').replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} | ${siteName}`;
      const desc = post.excerpt || post.seoDescription || 'Read the latest updates on Sarkari jobs, admit cards, and results.';
      const pageUrl = `https://www.digitalhomeblog.in/blog/${req.params.category}/${req.params.slug}`;
      const canonicalUrl = normalizeCanonicalUrl(post.canonicalUrl || pageUrl);
      const imageUrl = post.featuredImage || 'https://www.digitalhomeblog.in/logo.png';

      // Guaranteed Valid Article Schema (BlogPosting) for Google Rich Results
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': cleanTitle,
        'description': desc,
        'image': [imageUrl],
        'datePublished': post.publishedAt ? new Date(post.publishedAt).toISOString() : (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()),
        'dateModified': post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
        'author': {
          '@type': 'Person',
          'name': post.author || 'Digital Home Team'
        },
        'publisher': {
          '@type': 'Organization',
          'name': siteName,
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.digitalhomeblog.in/logo.webp',
            'width': 190,
            'height': 60
          }
        },
        'mainEntityOfPage': canonicalUrl
      };
      const articleScript = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;

      // Optional JobPosting Schema — ONLY IF Sarkari Job post
      const jobSchema = generateJobPostingSchema(post);
      const jobPostingScript = (jobSchema && typeof jobSchema === 'object' && Object.keys(jobSchema).length > 0)
        ? `<script type="application/ld+json">${JSON.stringify(jobSchema)}</script>`
        : '';

      // Optional FAQ Schema — ONLY IF non-null & contains valid schema content
      const faqSchema = generateFaqSchema(cleanTitle, post.content, post.category);
      const faqScript = (faqSchema && typeof faqSchema === 'object' && Object.keys(faqSchema).length > 0)
        ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`
        : '';

      // Optional Breadcrumb Schema
      const breadcrumbSchema = generateBreadcrumbSchema(post);
      const breadcrumbScript = (breadcrumbSchema && typeof breadcrumbSchema === 'object')
        ? `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`
        : '';

      // SEO Social Metadata Block
      const metaTags = `
    <title>${fullTitle}</title>
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="max-image-preview:large, index, follow" />
    <meta name="description" content="${desc}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${imageUrl}" />
    ${articleScript}
    ${jobPostingScript}
    ${faqScript}
    ${breadcrumbScript}
      `;

      // Remove default title/meta tags to prevent duplicates and append post specific tags
      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);

      if (!isLocal) {
        if (postSsrCache.size > 500) {
          const oldestKey = postSsrCache.keys().next().value;
          postSsrCache.delete(oldestKey);
        }
        postSsrCache.set(cacheKey, { status: 200, html, time: Date.now() });
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    } else {
      // Check if post exists with status: 'archived' -> return strict HTTP 410 Gone with noindex, follow
      const archivedPost = await BlogPost.findOne({ slug: req.params.slug }).select('title status category').lean();
      if (archivedPost && archivedPost.status === 'archived') {
        return render404Page(req, res, `यह भर्ती प्रक्रिया या सूचना अब आधिकारिक रूप से समाप्त हो चुकी है (The recruitment/vacancy cycle for "${archivedPost.title}" has officially expired/closed).`, 410);
      }
      // Missing / deleted blog post: Return strict HTTP 404 with noindex, follow (Eliminates Soft 404)
      return render404Page(req, res, 'यह लेख या ब्लॉग पोस्ट उपलब्ध नहीं है। (This blog article does not exist or has been removed.)', 404);
    }
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag Injection for Current Affairs Article Pages
app.get('/current-affairs/:slug', async (req, res, next) => {
  try {
    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return render404Page(req, res);
    }
    const CurrentAffairs = require('./modules/currentAffairs/currentAffairs.model');
    const item = await CurrentAffairs.findOne({
      $or: [{ slug: req.params.slug }, { dateString: req.params.slug }],
      status: 'published'
    }).lean();

    if (item) {
      const siteName = 'Digital Home Sarkari Result';
      const cleanTitle = (item.title || '').replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} | ${siteName}`;
      const desc = item.seoDescription || item.summary || 'Read today daily current affairs and take the daily exam GK quiz.';
      const canonicalUrl = `https://www.digitalhomeblog.in/current-affairs/${item.slug}`;
      const imageUrl = item.featuredImage || 'https://www.digitalhomeblog.in/logo.png';

      // NewsArticle Schema
      const newsArticleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': cleanTitle,
        'description': desc,
        'image': [imageUrl],
        'datePublished': item.publishDate ? new Date(item.publishDate).toISOString() : new Date().toISOString(),
        'dateModified': item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
        'author': {
          '@type': 'Person',
          'name': item.author || 'Digital Home Editorial Team'
        },
        'publisher': {
          '@type': 'Organization',
          'name': siteName,
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.digitalhomeblog.in/logo.webp',
            'width': 190,
            'height': 60
          }
        },
        'mainEntityOfPage': canonicalUrl
      };

      // Quiz Schema (if MCQs are present)
      let quizSchema = null;
      if (item.quizzes && item.quizzes.length > 0) {
        quizSchema = {
          '@context': 'https://schema.org',
          '@type': 'Quiz',
          'name': `Daily GK Quiz - ${item.dateString}`,
          'description': `10 Multiple Choice Questions on today's current affairs (${item.dateString}) with detailed explanations.`,
          'hasPart': item.quizzes.map(q => ({
            '@type': 'Question',
            'name': q.questionText,
            'text': q.questionText,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': q.options[q.correctOptionIndex],
              'comment': {
                '@type': 'Comment',
                'text': q.explanation
              }
            }
          }))
        };
      }

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const itemDate = item.publishDate ? new Date(item.publishDate) : (item.dateString ? new Date(item.dateString) : null);
      const isOlderThan7Days = itemDate && !isNaN(itemDate.getTime()) && (Date.now() - itemDate.getTime() > SEVEN_DAYS_MS);

      if (isOlderThan7Days) {
        res.set('X-Robots-Tag', 'noindex, follow');
      }
      const robotsMeta = isOlderThan7Days ? 'noindex, follow' : 'index, follow, max-image-preview:large';

      const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="${robotsMeta}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(newsArticleSchema)}</script>
    ${quizSchema ? `<script type="application/ld+json">${JSON.stringify(quizSchema)}</script>` : ''}
      `;

      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    // Missing Current Affairs article: Return strict HTTP 404 with noindex, follow
    return render404Page(req, res, 'यह करेंट अफेयर्स सामग्री उपलब्ध नहीं है। (This current affairs update does not exist or has been removed.)');
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & JobPosting Schema Injection for Individual Global Jobs
app.get(['/global-jobs/view/:id', '/global-jobs/:country/:id'], async (req, res, next) => {
  try {
    const rawId = req.params.id ? String(req.params.id).trim() : '';
    if (!rawId) return next();

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return render404Page(req, res);
    }
    const GlobalJob = require('./modules/globalJobs/globalJob.model');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(rawId);

    const job = await GlobalJob.findOne({
      $or: [
        { officialReferenceId: rawId },
        ...(isValidObjectId ? [{ _id: rawId }] : [])
      ]
    }).lean();

    if (job) {
      const { buildGlobalJobScaffoldHtml } = require('./shared/utils/jobScaffoldEngine');
      const siteName = 'Global Careers Intelligence | Digital Home';
      const cleanTitle = (job.title || '').replace(/\s*\|\s*(Digital Home|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} (${job.agencyOrMinistry}) - ${job.countryName} | Global Gov Jobs 2026`;
      const desc = (job.officialGazetteSummary || job.description || `${job.title} vacancy under ${job.agencyOrMinistry} (${job.countryName}). Check salary, qualifications & apply online.`).slice(0, 160);
      const canonicalRef = job.officialReferenceId || job._id;
      const canonicalUrl = `https://www.digitalhomeblog.in/global-jobs/view/${canonicalRef}`;
      const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

      const isExpired = Boolean(job.applicationDeadline && new Date(job.applicationDeadline) < new Date());
      const datePosted = job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString();
      
      // Guaranteed validThrough: always a valid ISO 8601 string
      const defaultFutureDate = new Date();
      defaultFutureDate.setDate(defaultFutureDate.getDate() + 45);
      const validThrough = job.applicationDeadline 
        ? new Date(job.applicationDeadline).toISOString() 
        : defaultFutureDate.toISOString();

      // Official JobPosting Schema for Google for Jobs (100% compliant)
      const jobPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        'title': cleanTitle,
        'description': job.description || job.officialGazetteSummary || `${cleanTitle} vacancy under ${job.agencyOrMinistry} (${job.countryName}). Verified official government gazette circular.`,
        'datePosted': datePosted,
        'validThrough': validThrough,
        'employmentType': 'FULL_TIME',
        'hiringOrganization': {
          '@type': 'Organization',
          'name': job.agencyOrMinistry || job.countryName,
          'sameAs': job.officialNoticeUrl || 'https://www.digitalhomeblog.in'
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': job.countryCode || 'IN',
            'addressLocality': job.dutyStation || job.countryName
          }
        },
        'directApply': true,
        ...(job.salary?.amount ? {
          'baseSalary': {
            '@type': 'MonetaryAmount',
            'currency': job.salary?.currency || 'USD',
            'value': {
              '@type': 'QuantitativeValue',
              'value': job.salary.amount,
              'unitText': 'YEAR'
            }
          }
        } : {})
      };

      const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(jobPostingSchema)}</script>
      `;

      // Render 250+ word structured scaffolding inside #root for 100% crawlable zero-cloaking visibility
      const scaffoldHtml = buildGlobalJobScaffoldHtml(job, isExpired);

      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);
      html = html.replace('<div id="root"></div>', `<div id="root">${scaffoldHtml}</div>`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    // Missing Global Job: Return strict HTTP 404 with noindex, nofollow
    return render404Page(req, res, 'This global government vacancy does not exist or has been removed.', 404);
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & JobPosting Schema Injection for Individual Indian Sarkari Jobs (DUAL-ID TO SLUG RESOLVER)
app.get(['/india/sarkari-jobs/:identifier', '/india/sarkari-jobs/:id', '/job-alerts/:identifier', '/job-alerts/:id', '/live-alerts/:identifier', '/live-alerts/:id'], async (req, res, next) => {
  try {
    const rawId = (req.params.identifier || req.params.id || '').trim();
    if (!rawId) return next();

    const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
    const canonicalDomain = isProd ? 'https://www.digitalhomeblog.in' : '';

    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return render404Page(req, res, 'Database connection is temporarily unavailable. Please retry in a few moments.', 503);
    }

    const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
    const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');

    // Check if the identifier matches a MongoDB ObjectId (24-character hexadecimal ID)
    const isLegacyObjectId = /^[0-9a-fA-F]{24}$/.test(rawId);

    if (isLegacyObjectId) {
      // 1. LEGACY ID RESOLVER:
      // Query MongoDB to find the job document
      const job = await LiveAlert.findById(rawId).select('_id slug title boardName status').lean();

      if (job) {
        const isInactive = job.status === 'inactive' || job.status === 'drafted' || job.status === 'archived';
        if (isInactive) {
          res.setHeader('X-Robots-Tag', 'noindex, follow');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
        }

        // Document exists in DB and is active: determine clean slug
        let cleanSlug = job.slug;
        if (!cleanSlug && job.title) {
          cleanSlug = sanitizeJobSlug(job.title, job.boardName, job._id.toString());
          LiveAlert.updateOne({ _id: job._id }, { $set: { slug: cleanSlug } }).catch(() => {});
        }

        if (cleanSlug) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs/${cleanSlug}`);
        }
      }

      // Legacy ID does NOT exist in DB or inactive: Return strict HTTP 410 Gone with minimal message
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
    }

    // 2. SLUG RESOLVER:
    // Identifier is already a slug (kebab-case)
    const normalizedSlug = rawId.toLowerCase();
    const alert = await LiveAlert.findOne({ slug: normalizedSlug }).lean();

    if (!alert || alert.status === 'inactive' || alert.status === 'drafted' || alert.status === 'archived') {
      // Slug does NOT exist or is inactive in DB: Return strict HTTP 410 Gone (Never return 200 with empty state or soft 404)
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
    }

    // If incoming path was legacy /job-alerts/:slug or /live-alerts/:slug, 301 redirect to canonical /india/sarkari-jobs/:slug
    if (req.path.startsWith('/job-alerts/') || req.path.startsWith('/live-alerts/')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs/${alert.slug || normalizedSlug}`);
    }

    // Valid job found: Render page with HTTP 200 and strict self-referencing canonical tag
    const indexPath = path.join(publicPath, 'index.html');
    let html = '';
    if (fs.existsSync(indexPath)) {
      html = fs.readFileSync(indexPath, 'utf8');
    } else {
      html = '<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>';
    }

    const { buildIndianJobScaffoldHtml } = require('./shared/utils/jobScaffoldEngine');
    const {
      parseJobMetadata,
      buildHighCtrJobTitle,
      buildHighCtrMetaDesc,
      generateJobFaqSchema
    } = require('./shared/utils/jobSeoOptimizer');

    const siteName = 'Digital Home Sarkari Result';
    const meta = parseJobMetadata(alert);
    const highCtrTitle = buildHighCtrJobTitle(meta);
    const highCtrDesc = buildHighCtrMetaDesc(meta);
    const faqSchema = generateJobFaqSchema(meta);

    const canonicalSlug = alert.slug || normalizedSlug;
    const canonicalUrl = `https://digitalhomeblog.in/india/sarkari-jobs/${canonicalSlug}`;
    const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

    const isExpired = alert.status === 'expired' || 
      (alert.lastDate && alert.lastDate !== 'N/A' && !isNaN(new Date(alert.lastDate).getTime()) && new Date(alert.lastDate) < new Date(Date.now() - 24 * 60 * 60 * 1000));

    const datePosted = alert.parsedPostDate ? new Date(alert.parsedPostDate).toISOString() : (alert.createdAt ? new Date(alert.createdAt).toISOString() : new Date().toISOString());

    // Guaranteed validThrough: always a valid ISO 8601 string
    let validThrough = '';
    if (alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page') {
      const parsed = new Date(alert.lastDate);
      if (!isNaN(parsed.getTime())) {
        validThrough = parsed.toISOString();
      }
    }
    if (!validThrough) {
      const defaultFuture = new Date();
      defaultFuture.setDate(defaultFuture.getDate() + 45);
      validThrough = isExpired ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : defaultFuture.toISOString();
    }

    // Fetch 4-5 related active 2026 vacancies for internal linking refresh
    let recAlerts = [];
    try {
      recAlerts = await LiveAlert.find({ 
        _id: { $ne: alert._id },
        status: { $in: ['active', 'published'] } 
      })
        .select('_id slug title state category')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .limit(5)
        .lean();
    } catch (recErr) {}

    // Clean plain-text description for structured data
    const cleanJobDescription = (alert.detailsText ? alert.detailsText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() : '') || `${highCtrTitle}. Official recruitment notification issued by ${meta.board || 'Official Board'} for candidates across ${meta.state || 'India'}. Category: ${meta.category || 'Job'}. Important dates: notification circular released on ${meta.postDate || 'Latest'}, application deadline ${meta.lastDate || 'Check Official Portal'}. Apply online directly through official government portals.`;
    const orgName = meta.board || alert.boardName || 'Government of India / State Public Service Commission';

    // Official Google for Jobs structured data (100% Schema Validation compliant JobPosting)
    const jobPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      'title': highCtrTitle,
      'description': cleanJobDescription,
      'datePosted': datePosted,
      'validThrough': validThrough,
      'employmentType': 'FULL_TIME',
      'hiringOrganization': {
        '@type': 'Organization',
        'name': orgName,
        'sameAs': 'https://digitalhomeblog.in'
      },
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'IN'
        }
      }
    };

    // Generate complete 300+ word structured HTML layout
    const scaffoldHtml = buildIndianJobScaffoldHtml(alert, isExpired, recAlerts);

    const metaTags = `
    <title>${highCtrTitle}</title>
    <meta name="description" content="${highCtrDesc.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${highCtrTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${highCtrDesc.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${highCtrTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${highCtrDesc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(jobPostingSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
    `;

    html = html.replace(/<title>.*?<\/title>/i, '');
    html = html.replace(/<meta name="description" .*?\/>/i, '');
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
    html = html.replace('</head>', `${metaTags}\n</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${scaffoldHtml}</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & Crawler Links for Indian Sarkari Jobs Portal Hub (QUERY PARAMETER HANDLER & CLEAN CANONICAL)
app.get(['/india/sarkari-jobs', '/job-alerts', '/live-alerts'], async (req, res, next) => {
  try {
    const isProd = env.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
    const canonicalDomain = isProd ? 'https://www.digitalhomeblog.in' : '';

    // 3. QUERY PARAMETER HANDLER (/job-alerts?alert=:alertId or /india/sarkari-jobs?alert=:alertId)
    if (req.query && req.query.alert !== undefined) {
      const alertParam = typeof req.query.alert === 'string' ? req.query.alert.trim() : '';

      // Validate format: Verify it is a valid 24-character hex string (/^[0-9a-fA-F]{24}$/)
      if (!alertParam || !/^[0-9a-fA-F]{24}$/.test(alertParam)) {
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
      }

      let job = null;
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
          const Job = LiveAlert;
          job = await Job.findById(alertParam).select('slug status title boardName').lean();
        }
      } catch (dbErr) {
        console.error("Job alert lookup error:", dbErr.message);
        if (dbErr.name === 'CastError' || dbErr.name === 'BSONError') {
          res.setHeader('X-Robots-Tag', 'noindex, follow');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
        }
        throw dbErr;
      }

      if (job) {
        const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');
        const cleanSlug = job.slug || sanitizeJobSlug(job.title, job.boardName, job._id ? job._id.toString() : alertParam);
        if (cleanSlug) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.redirect(301, `${canonicalDomain}/india/sarkari-jobs/${encodeURIComponent(cleanSlug)}`);
        }
      }

      // Alert requested via ?alert= does NOT exist in DB: Return strict HTTP 410 Gone
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>This job alert has expired.</p>");
    }

    // Generic list without parameters:
    // If /job-alerts or /live-alerts is visited without parameters or as a generic list, serve with X-Robots-Tag: noindex, follow
    const isLegacyHub = req.path.startsWith('/job-alerts') || req.path.startsWith('/live-alerts');
    if (isLegacyHub) {
      res.setHeader('X-Robots-Tag', 'noindex, follow');
    }

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    let topAlerts = [];
    let stateAlerts = [];
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
        const TOP_STATES_REGEX = /uttar pradesh|bihar|rajasthan|madhya pradesh|jharkhand|odisha|delhi|haryana|west bengal|maharashtra/i;
        [topAlerts, stateAlerts] = await Promise.all([
          LiveAlert.find({ status: { $in: ['active', 'published'] } })
            .select('title boardName category state _id slug parsedPostDate')
            .sort({ parsedPostDate: -1, createdAt: -1 })
            .limit(40)
            .lean(),
          LiveAlert.find({ 
            status: { $in: ['active', 'published'] },
            state: { $regex: TOP_STATES_REGEX }
          })
            .select('title boardName category state _id slug parsedPostDate')
            .sort({ parsedPostDate: -1, createdAt: -1 })
            .limit(30)
            .lean()
        ]);
      }
    } catch (dbErr) {
      console.warn('[SSR Hub] LiveAlert query bypassed:', dbErr.message);
    }

    const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');

    // Strict Unified Canonical URL: Always points to the clean canonical route (never self-canonicalize query parameters or alternative routes)
    const canonicalUrl = 'https://www.digitalhomeblog.in/india/sarkari-jobs';

    const siteName = 'Digital Home Government Jobs';
    const fullTitle = 'Government Vacancy 2026: Live Govt Job Alerts & State-wise Recruitment | Digital Home';
    const desc = 'Government Vacancy 2026: Live Govt Job alerts, online application forms, eligibility criteria, and state-wise recruitment notifications for UP, Bihar, MP, Rajasthan, SSC, Railways, and UPSC.';
    const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

    const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Helper to format clean slug for anchors
    const getAnchorSlug = (a) => a.slug || sanitizeJobSlug(a.title, a.boardName, a._id ? a._id.toString() : '');

    // Visible, semantic internal linking matrix for Googlebot & candidates
    const visibleHub = `
  <main class="ssr-sarkari-directory" aria-label="Government Vacancy & Live Job Alerts 2026" style="max-width: 1200px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h1 style="font-size: 1.7rem; font-weight: 900; color: #0f172a; margin-bottom: 10px; line-height: 1.3;">Government Vacancy 2026: Live Govt Job Alerts & State-wise Recruitment (सरकारी नौकरी)</h1>
    <p style="color: #475569; font-size: 0.98rem; line-height: 1.6; margin-bottom: 24px; max-width: 840px;">उत्तर प्रदेश, बिहार, मध्य प्रदेश, राजस्थान, झारखंड, ओडिशा व केंद्रीय विभागों (UPSC, SSC, रेलवे, बैंकिंग, पुलिस, डिफेंस व राज्य PSC) की नवीनतम भर्तियों की 100% आधिकारिक अधिसूचनाएं और सीधे आवेदन लिंक।</p>
    
    <!-- Top 10 Indian States Anchor Links for Googlebot & Aspirants -->
    <section style="margin-bottom: 28px; padding: 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px;">
      <h2 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 10px;">🎯 राज्य अनुसार सरकारी नौकरियां (Top States Sarkari Jobs):</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #e0f2fe; color: #0369a1; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🇮🇳 All India (सभी राज्य)</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ उत्तर प्रदेश (UP Jobs) 185+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ बिहार (Bihar Jobs) 53+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ मध्य प्रदेश (MP Jobs) 64+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ राजस्थान (Rajasthan) 45+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ झारखंड (Jharkhand) 12+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ ओडिशा (Odisha) 26+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ दिल्ली (Delhi) 128+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ हरियाणा (Haryana) 28+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ महाराष्ट्र (Maharashtra) 68+</a>
        <a href="/india/sarkari-jobs" style="padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 20px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">🏛️ पश्चिम बंगाल (WB) 34+</a>
      </div>
    </section>

    <!-- Top State Live Vacancies Grid -->
    ${stateAlerts.length > 0 ? `
    <section style="margin-bottom: 30px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 14px; border-bottom: 2px solid #f59e0b; padding-bottom: 6px;">⭐ प्रमुख राज्यों की नवीनतम भर्तियां (Featured State Vacancies 2026)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; margin-bottom: 24px;">
        ${stateAlerts.map(a => `<a href="/india/sarkari-jobs/${encodeURIComponent(getAnchorSlug(a))}" style="display: block; padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; color: #0f172a; text-decoration: none;">
          <span style="font-size: 0.75rem; font-weight: 800; color: #b45309; display: block; margin-bottom: 4px;">🏛️ ${escapeHtml(a.state || 'State')} • ${escapeHtml(a.category || 'Recruitment')}</span>
          <strong style="font-size: 0.92rem; color: #1e293b; display: block; line-height: 1.4;">${escapeHtml(a.title)}</strong>
        </a>`).join('\n        ')}
      </div>
    </section>` : ''}

    <section>
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 14px; border-bottom: 2px solid #0284c7; padding-bottom: 6px;">🔥 सभी सक्रिय केंद्रीय व राज्य सरकारी नौकरियां (All India Live Vacancies 2026)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px;">
        ${topAlerts.map(a => `<a href="/india/sarkari-jobs/${encodeURIComponent(getAnchorSlug(a))}" style="display: block; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; color: #0f172a; text-decoration: none;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0284c7; display: block; margin-bottom: 4px;">${escapeHtml(a.state || 'All India')} • ${escapeHtml(a.category || 'Recruitment')}</span>
          <strong style="font-size: 0.92rem; color: #1e293b; display: block; line-height: 1.4;">${escapeHtml(a.title)}</strong>
        </a>`).join('\n        ')}
      </div>
    </section>
  </main>`;

    const cleanPath = (req.path || '').toLowerCase();
    const breadcrumbTitle = cleanPath.includes('job-alerts') 
      ? 'Latest Job Alerts' 
      : (cleanPath.includes('live-alerts') ? 'Live Alerts' : 'Sarkari Result & Govt Jobs');
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.digitalhomeblog.in' },
        { '@type': 'ListItem', 'position': 2, 'name': breadcrumbTitle, 'item': canonicalUrl }
      ]
    };

    const robotsDirective = isLegacyHub ? 'noindex, follow' : 'index, follow, max-image-preview:large';
    const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${desc}" />
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
    `;

    html = html.replace(/<title>.*?<\/title>/i, '');
    html = html.replace(/<meta name="description" .*?\/>/i, '');
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
    const initialAlertsScript = `<script>window.__INITIAL_ALERTS__ = ${JSON.stringify(topAlerts || []).replace(/</g, '\\u003c')};</script>`;
    html = html.replace('</head>', `${metaTags}\n${initialAlertsScript}\n</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${visibleHub}</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & Hreflang Matrix Injection for Global Jobs Country Hubs & Directory
app.get(['/global-jobs', '/global-jobs/:country'], async (req, res, next) => {
  try {
    const rawParam = req.params.country ? String(req.params.country).trim() : '';
    if (rawParam.toLowerCase() === 'view') return next();

    // 301 Canonical normalization: Redirect ?country=XX to clean static path /global-jobs/XX
    if (!rawParam && req.query.country && req.query.country.trim().toUpperCase() !== 'ALL') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, `/global-jobs/${encodeURIComponent(req.query.country.trim().toUpperCase())}`);
    }

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    const rawCountry = (rawParam || req.query.country || 'ALL').trim();
    const { getCountrySeoMeta, buildHreflangMatrix, COUNTRY_MAP } = require('./modules/globalJobs/countrySeoConfig');

    if (rawParam && rawParam.toUpperCase() !== 'ALL' && COUNTRY_MAP && !COUNTRY_MAP.has(rawParam.toUpperCase())) {
      return render404Page(req, res, 'This country career hub does not exist.');
    }

    const seoMeta = getCountrySeoMeta(rawCountry);
    const hreflangMatrix = buildHreflangMatrix(rawCountry);

    const siteName = 'Digital Home';
    const fullTitle = seoMeta.title;
    const desc = seoMeta.description;
    const canonicalUrl = seoMeta.canonical;
    const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

    const hreflangTags = hreflangMatrix
      .map(h => `<link rel="alternate" hreflang="${h.lang}" href="${h.href}" />`)
      .join('\n    ');

    const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonicalUrl}" />
    ${hreflangTags}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    `;

    html = html.replace(/<title>.*?<\/title>/, '');
    html = html.replace(/<meta name="description" .*?\/>/, '');
    html = html.replace('</head>', `${metaTags}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Known Valid Client Routes for React Single Page App
const KNOWN_EXACT_ROUTES = new Set([
  '/',
  '/blog',
  '/job-alerts',
  '/live-alerts',
  '/india/sarkari-jobs',
  '/india/current-affairs',
  '/india/daily-quiz',
  '/current-affairs',
  '/daily-quiz',
  '/global-jobs',
  '/global-news',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/archive',
  '/search',
  '/tools',
  '/games',
  '/tags',
  '/tag',
  '/admin/login'
]);

// Dynamic Category Page Route with Validation
const VALID_CATEGORIES = new Set([
  'sarkari-jobs-exams',
  'health-wellness',
  'tech-tutorials',
  'ai-web-tools',
  'finance-business',
  'news-trends'
]);

app.get('/category/:category', async (req, res, next) => {
  try {
    const rawCat = (req.params.category || '').toLowerCase().trim();
    if (!VALID_CATEGORIES.has(rawCat)) {
      const mongoose = require('mongoose');
      let catExists = false;
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const BlogPost = mongoose.model('BlogPost');
        const count = await BlogPost.countDocuments({ 
          status: 'published',
          $or: [
            { category: new RegExp('^' + rawCat.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
            { category: new RegExp('^' + rawCat.replace(/-/g, ' ').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
          ]
        });
        catExists = count > 0;
      }
      if (!catExists) {
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(410).send("<h1>410 Gone</h1><p>This category has been permanently discontinued or removed.</p>");
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Dynamic Route for Daily Quiz Date Pages: Return 410 Gone if empty or defunct
app.get(['/daily-quiz/:date', '/india/daily-quiz/:date'], async (req, res, next) => {
  try {
    const rawDate = (req.params.date || '').trim();
    if (!rawDate) return next();

    const mongoose = require('mongoose');
    let hasValidQuiz = false;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const CurrentAffairs = mongoose.model('CurrentAffairs');
      const ca = await CurrentAffairs.findOne({ 
        dateString: rawDate, 
        'quizzes.0': { $exists: true } 
      }).select('dateString quizzes').lean();
      if (ca && Array.isArray(ca.quizzes) && ca.quizzes.length > 0) {
        hasValidQuiz = true;
      }
    }

    if (!hasValidQuiz) {
      // Empty or defunct date-based quiz page: Explicit HTTP 410 Gone
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>");
    }

    // Ephemeral archives: If the quiz date is older than 7 days, add response header: res.set('X-Robots-Tag', 'noindex, follow')
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const parsedDate = new Date(rawDate);
    const isOlderThan7Days = !isNaN(parsedDate.getTime()) && (Date.now() - parsedDate.getTime() > SEVEN_DAYS_MS);
    if (isOlderThan7Days) {
      res.set('X-Robots-Tag', 'noindex, follow');
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Dedicated Route for Tag Hubs: /tags/:tag and /tag/:tag
app.get(['/tags/:tag', '/tag/:tag'], async (req, res, next) => {
  try {
    const rawTag = req.params.tag ? String(req.params.tag).trim() : '';
    if (!rawTag) return next();

    let decodedTag = '';
    try {
      decodedTag = decodeURIComponent(rawTag);
    } catch (e) {
      decodedTag = rawTag;
    }

    // Inspect the incoming tag parameter:
    // If the tag contains spaces, non-ASCII/Devanagari characters, or matches raw scraped strings (e.g. tags/best laptop..., tags/रेलवे...):
    const hasSpaces = decodedTag.includes(' ') || rawTag.includes(' ') || rawTag.includes('%20') || decodedTag.includes('%20') || /\s/.test(decodedTag);
    const hasNonAscii = /[^\x20-\x7E]/.test(decodedTag) || /[\u0900-\u097F]/.test(decodedTag);
    const isScrapedGarbage = decodedTag.toLowerCase().includes('best laptop') || 
                             decodedTag.includes('रेलवे') || 
                             /[\[\]{}<>]/.test(decodedTag);

    if (hasSpaces || hasNonAscii || isScrapedGarbage) {
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(410).send("<h1>410 Gone</h1><p>Resource permanently removed.</p>");
    }

    // For valid existing tag pages:
    // Serve HTTP 200, but add this header and meta tag:
    // Header: res.set('X-Robots-Tag', 'noindex, follow');
    // HTML: <meta name="robots" content="noindex, follow" />
    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    res.set('X-Robots-Tag', 'noindex, follow');
    html = html.replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
    html = html.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n</head>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

const KNOWN_PREFIX_ROUTES = [
  '/admin',
  '/tags/',
  '/tag/'
];

function isKnownFrontendRoute(pathname) {
  const p = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (KNOWN_EXACT_ROUTES.has(p)) return true;
  for (const prefix of KNOWN_PREFIX_ROUTES) {
    if (p.startsWith(prefix)) return true;
  }
  // Allow valid category hubs
  if (p.startsWith('/category/')) {
    const cat = p.replace(/^\/category\//, '').trim();
    if (VALID_CATEGORIES.has(cat)) return true;
  }
  // Allow validated daily quiz date pages
  if (p.startsWith('/daily-quiz/') || p.startsWith('/india/daily-quiz/')) {
    return true;
  }
  // Allow valid sovereign country hubs
  if (p.startsWith('/global-jobs/')) {
    const { COUNTRY_MAP } = require('./modules/globalJobs/countrySeoConfig');
    const country = p.replace(/^\/global-jobs\//, '').trim().toUpperCase();
    if (COUNTRY_MAP && COUNTRY_MAP.has(country)) return true;
  }
  return false;
}

// Check database for matching slug when a URL is unmapped or malformed
async function findDatabaseSlug(cleanSlug) {
  if (!cleanSlug) return null;
  try {
    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return null;
    }
    const BlogPost = mongoose.model('BlogPost');
    const LiveAlert = mongoose.model('LiveAlert');
    const post = await BlogPost.findOne({ slug: cleanSlug, status: 'published' }).select('slug category').lean();
    if (post) return { type: 'post', item: post };
    if (mongoose.Types.ObjectId.isValid(cleanSlug)) {
      const alert = await LiveAlert.findById(cleanSlug).select('_id slug title boardName').lean();
      if (alert) return { type: 'alert', item: alert };
    }
  } catch (e) {}
  return null;
}

// Handle client-side routing & Permanent 404/Canonical Sanitization
app.get('*', async (req, res, next) => {
  try {
    const rawPath = req.path || '/';
    const filePath = path.join(publicPath, rawPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    // 1. Detect malformed URLs containing raw spaces, %20, unencoded characters, or wildcard characters
    const rawUrl = req.originalUrl || req.url || rawPath;
    let decodedPath = '';
    try {
      decodedPath = decodeURIComponent(rawUrl);
    } catch (e) {
      decodedPath = rawPath;
    }

    const hasMalformedChars = rawPath.includes(' ') || 
      rawUrl.includes('%20') || 
      decodedPath.includes(' ') || 
      rawPath.includes('*') || 
      rawUrl.includes('*');

    const cleanCandidate = (decodedPath.split('?')[0] || rawPath)
      .toLowerCase()
      .replace(/^\/+/, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const isKnown = isKnownFrontendRoute(rawPath);

    // If malformed or unknown, check if database matches
    let dbMatch = null;
    if (hasMalformedChars || !isKnown) {
      dbMatch = await findDatabaseSlug(cleanCandidate);
    }

    // If candidate matches a database entry, 301 redirect to canonical destination
    if (dbMatch) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      if (dbMatch.type === 'post') {
        const catSlug = (dbMatch.item.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sarkari-jobs-exams';
        return res.redirect(301, `https://www.digitalhomeblog.in/blog/${catSlug}/${dbMatch.item.slug}`);
      } else if (dbMatch.type === 'alert') {
        const { sanitizeJobSlug } = require('./shared/utils/jobSeoOptimizer');
        const alertSlug = dbMatch.item.slug || sanitizeJobSlug(dbMatch.item.title, dbMatch.item.boardName, dbMatch.item._id.toString());
        return res.redirect(301, `https://www.digitalhomeblog.in/india/sarkari-jobs/${alertSlug}`);
      }
    }

    // 2. Malformed / Broken Search Slugs or Unknown URLs: Return strict HTTP 410 Gone with noindex, follow
    if (hasMalformedChars || !isKnown) {
      return render404Page(req, res, 'यह पेज या भर्ती सूचना उपलब्ध नहीं है या हटाई जा चुकी है। (This resource has been permanently removed.)', 410);
    }

    // 3. Valid Known Route: Render with HTTP 200 OK and clean, self-referential canonical (zero query params)
    const { normalizeCanonicalUrl } = require('./shared/utils/urlUtils');
    const cleanCanonicalUrl = normalizeCanonicalUrl(rawPath);

    // Non-indexed public pages (tags, search, archive) or routes marked with noindex header return X-Robots-Tag: noindex, follow
    const isNonIndexedPublicPage = 
      rawPath === '/tags' ||
      rawPath.startsWith('/tags/') || 
      rawPath === '/tag' ||
      rawPath.startsWith('/tag/') || 
      rawPath === '/search' || 
      rawPath.startsWith('/search/') || 
      rawPath === '/archive' || 
      rawPath.startsWith('/archive/');

    const hasNoindexHeader = res.getHeader('x-robots-tag') === 'noindex, follow' || res.getHeader('X-Robots-Tag') === 'noindex, follow';

    if (isNonIndexedPublicPage || hasNoindexHeader) {
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      html = html.replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
      html = html.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n</head>');
    }

    const canonicalTag = `<link rel="canonical" href="${cleanCanonicalUrl}" />`;
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
    html = html.replace('</head>', `    ${canonicalTag}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Error handling (must be last)
app.use(notFound);
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err.message);
  // Never send raw stack traces or unhandled 500 to search engine bots
  if (err.name === 'CastError' || err.name === 'BSONError') {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>Invalid entity reference.</p>");
  }
  if (req.path && req.path.startsWith('/api')) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(500).send("<h1>Server Error</h1><p>Please try again later.</p>");
});

app.buildHomepageHtml = buildHomepageHtml;
app.purgePostSsrCache = () => postSsrCache.clear();
module.exports = app;
