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
app.get('/:key.txt', (req, res, next) => {
  const key = req.params.key;
  if (/^[a-f0-9]{32}$/i.test(key)) {
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

    const [topPosts, topAlerts] = await Promise.all([
      BlogPost.find({ status: 'published' })
        .select('title category slug')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(30)
        .lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] } })
        .select('title _id')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .limit(30)
        .lean()
    ]);

    const catUrlSlug = (cat) => (cat || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let seoLinks = '\n<div style="display:none;" id="seo-crawler-links" aria-hidden="true">\n';
    seoLinks += '  <h1 style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">Digital Home - Latest Sarkari Jobs, Exams & Tech Updates (सरकारी रिजल्ट 2026)</h1>\n';
    topPosts.forEach(p => {
      const path = `/blog/${catUrlSlug(p.category)}/${p.slug}`;
      seoLinks += `  <a href="${path}">${p.title}</a>\n`;
    });
    topAlerts.forEach(a => {
      seoLinks += `  <a href="/india/sarkari-jobs/${a._id}">${a.title}</a>\n`;
    });
    seoLinks += '</div>\n';

    html = html.replace('<body>', `<body>${seoLinks}`);
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

    const notFoundCanonical = 'https://www.digitalhomeblog.in/india/sarkari-jobs';
    const noindexMeta = `
    <title>404 — Page Not Found | Digital Home</title>
    <meta name="description" content="${customMessage.replace(/"/g, '&quot;')}" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${notFoundCanonical}" />
    `;

    const visible404Body = `
    <div id="not-found-container" style="max-width: 720px; margin: 50px auto; padding: 40px 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <div style="font-size: 5rem; font-weight: 900; line-height: 1; color: #0284c7; margin-bottom: 12px; letter-spacing: -2px;">404</div>
      <h1 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 12px; font-weight: 800;">पेज नहीं मिला — Page Not Found</h1>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6; margin-bottom: 28px; max-width: 540px; margin-left: auto; margin-right: auto;">${customMessage}</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/india/sarkari-jobs" style="display: inline-flex; align-items: center; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">🇮🇳 सरकारी नौकरी (Sarkari Jobs)</a>
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

    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(statusCode).send(html);
  } catch (e) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(statusCode).send('404 Not Found');
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
    return render404Page(req, res, 'यह लेख या ब्लॉग पोस्ट उपलब्ध नहीं है। (This blog article does not exist or has been removed.)');
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
      // Missing / deleted blog post: Return strict HTTP 404 with noindex, follow (Eliminates Soft 404)
      return render404Page(req, res, 'यह लेख या ब्लॉग पोस्ट उपलब्ध नहीं है। (This blog article does not exist or has been removed.)');
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
      const siteName = 'Global Careers Intelligence | Digital Home';
      const cleanTitle = (job.title || '').replace(/\s*\|\s*(Digital Home|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} (${job.agencyOrMinistry}) - ${job.countryName} | Global Gov Jobs 2026`;
      const desc = (job.officialGazetteSummary || job.description || `${job.title} vacancy under ${job.agencyOrMinistry} (${job.countryName}). Check salary, qualifications & apply online.`).slice(0, 160);
      const canonicalRef = job.officialReferenceId || job._id;
      const canonicalUrl = `https://www.digitalhomeblog.in/global-jobs/view/${canonicalRef}`;
      const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

      // Official JobPosting Schema for Google for Jobs
      const jobPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        'title': job.title,
        'description': job.description || job.officialGazetteSummary || job.title,
        'datePosted': job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
        'validThrough': job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : undefined,
        'employmentType': 'FULL_TIME',
        'hiringOrganization': {
          '@type': 'Organization',
          'name': job.agencyOrMinistry || job.countryName,
          'sameAs': job.officialNoticeUrl
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': job.countryCode || 'IN',
            'addressLocality': job.dutyStation || job.countryName
          }
        },
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

      const isExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
      let crawlerContent = `
<div id="seo-crawler-global-job" style="display:none;" aria-hidden="true">
  ${isExpired ? '<div style="background:#fee2e2;color:#991b1b;padding:10px;font-weight:bold;">⏳ Application Closed — Deadline has passed.</div>' : ''}
  <h1>${cleanTitle}</h1>
  <p><strong>Agency / Ministry:</strong> ${job.agencyOrMinistry || job.countryName}</p>
  <p><strong>Country:</strong> ${job.countryName} (${job.countryCode || 'Global'})</p>
  <p><strong>Duty Station:</strong> ${job.dutyStation || 'Headquarters'}</p>
  <p><strong>Deadline:</strong> ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'See Official Notice'}</p>
  <p>${desc}</p>
  ${job.officialNoticeUrl ? `<a href="${job.officialNoticeUrl}">Official Government Notice Link</a>` : ''}
</div>`;

      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);
      html = html.replace('<body>', `<body>\n${crawlerContent}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    // Missing Global Job: Return strict HTTP 404 with noindex, follow
    return render404Page(req, res, 'This global government vacancy does not exist or has been removed.');
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & JobPosting Schema Injection for Individual Indian Sarkari Jobs
app.get(['/india/sarkari-jobs/:id', '/job-alerts/:id', '/live-alerts/:id'], async (req, res, next) => {
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
    const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(rawId);

    const alert = await LiveAlert.findOne({
      $or: [
        ...(isValidObjectId ? [{ _id: rawId }] : []),
        { sourceUrl: new RegExp(rawId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
      ]
    }).lean();

    if (alert) {
      const siteName = 'Digital Home Sarkari Result';
      const cleanTitle = (alert.title || '').replace(/\s*\|\s*(Digital Home|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} - ${alert.state || 'All India'} | Sarkari Result 2026`;
      const desc = (alert.detailsText || `${cleanTitle}. Apply online form, eligibility, notification PDF, admit card and result link on Digital Home.`).slice(0, 160).replace(/[\r\n]+/g, ' ');
      const canonicalUrl = `https://www.digitalhomeblog.in/india/sarkari-jobs/${alert._id}`;
      const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

      const datePosted = alert.parsedPostDate ? new Date(alert.parsedPostDate).toISOString() : (alert.createdAt ? new Date(alert.createdAt).toISOString() : new Date().toISOString());
      let validThrough = undefined;
      if (alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page') {
        const parsed = new Date(alert.lastDate);
        if (!isNaN(parsed.getTime())) {
          validThrough = parsed.toISOString();
        }
      }

      // Official Google for Jobs structured data
      const jobPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        'title': cleanTitle,
        'description': alert.detailsText || cleanTitle,
        'datePosted': datePosted,
        ...(validThrough ? { 'validThrough': validThrough } : {}),
        'employmentType': 'FULL_TIME',
        'hiringOrganization': {
          '@type': 'Organization',
          'name': alert.boardName || 'Government of India / State Public Service Commission',
          'sameAs': alert.sourceUrl || 'https://www.digitalhomeblog.in'
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': 'IN',
            'addressRegion': alert.state || 'Central/All India'
          }
        },
        'occupationalCategory': alert.category || 'Latest Job'
      };

      const isExpired = alert.status === 'expired' || 
        (alert.lastDate && !isNaN(new Date(alert.lastDate).getTime()) && new Date(alert.lastDate) < new Date(Date.now() - 24 * 60 * 60 * 1000));
      let recommendedHtml = '';
      if (isExpired) {
        try {
          const recAlerts = await LiveAlert.find({ 
            _id: { $ne: alert._id },
            status: { $in: ['active', 'published'] } 
          })
            .select('_id title state category')
            .sort({ parsedPostDate: -1, createdAt: -1 })
            .limit(4)
            .lean();
          if (recAlerts && recAlerts.length > 0) {
            recommendedHtml = `
  <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
    <strong style="color: #0f172a; font-size: 1rem; display: block; margin-bottom: 8px;">🔥 वर्तमान में चालू प्रमुख सरकारी नौकरियां (Active Live Vacancies):</strong>
    <ul style="margin: 0; padding-left: 20px;">
      ${recAlerts.map(r => `<li style="margin-bottom: 6px;"><a href="/india/sarkari-jobs/${r._id}">${r.title} (${r.state || 'All India'})</a></li>`).join('\n')}
    </ul>
  </div>`;
          }
        } catch (recErr) {}
      }

      // Pre-rendered crawler-visible static text & direct links for zero JS bots
      let crawlerContent = `
<div id="seo-crawler-alert" style="display:none;" aria-hidden="true">
  ${isExpired ? '<div style="background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; padding: 10px; font-weight: 700; margin-bottom: 12px;">⏳ आवेदन की अंतिम तिथि समाप्त (Application Closed) — इस भर्ती के लिए ऑनलाइन आवेदन बंद हो चुके हैं।</div>' : ''}
  <h1>${cleanTitle}</h1>
  <p><strong>Department / Board:</strong> ${alert.boardName || 'Government of India'}</p>
  <p><strong>Category:</strong> ${alert.category || 'Sarkari Job'}</p>
  <p><strong>State / Region:</strong> ${alert.state || 'Central/All India'}</p>
  <p><strong>Last Date:</strong> ${alert.lastDate || 'See Official Circular'}</p>
  <p>${desc}</p>
  ${alert.sourceUrl ? `<a href="${alert.sourceUrl}">Official Gazette Notification Link</a>` : ''}
  ${recommendedHtml}
</div>`;

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

      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);
      html = html.replace('<body>', `<body>\n${crawlerContent}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    // If individual alert not found in DB, return strict HTTP 404 with noindex, follow (Eliminates Soft 404)
    return render404Page(req, res, 'यह सरकारी नौकरी भर्ती सूचना हटाई जा चुकी है या उपलब्ध नहीं है। (This government vacancy notification has been removed or does not exist.)');
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & Crawler Links for Indian Sarkari Jobs Portal Hub
app.get(['/india/sarkari-jobs', '/job-alerts', '/live-alerts'], async (req, res, next) => {
  try {
    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    let topAlerts = [];
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
        topAlerts = await LiveAlert.find({ status: { $in: ['active', 'published'] } })
          .select('title category state _id parsedPostDate')
          .sort({ parsedPostDate: -1, createdAt: -1 })
          .limit(60)
          .lean();
      }
    } catch (dbErr) {
      console.warn('[SSR Hub] LiveAlert query bypassed:', dbErr.message);
    }

    const cleanPath = (req.path || '').toLowerCase().replace(/\/+$/, '') || '/india/sarkari-jobs';
    const canonicalUrl = `https://www.digitalhomeblog.in${cleanPath}`;

    const siteName = 'Digital Home Sarkari Result';
    const fullTitle = 'Sarkari Result 2026: Latest Online Forms, Admit Card, Result & Answer Key | Digital Home';
    const desc = 'Latest Sarkari Result 2026 notifications, central & state government recruitment, UPSC, SSC, Railways, Banking, Defense & State PSC exam admit cards and answer keys.';
    const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

    let crawlerLinks = '\n<div style="display:none;" id="seo-crawler-sarkari-links" aria-hidden="true">\n';
    crawlerLinks += '  <h1>Sarkari Result 2026 - Latest Government Jobs, Admit Cards & Results</h1>\n';
    topAlerts.forEach(a => {
      crawlerLinks += `  <a href="/india/sarkari-jobs/${a._id}">${a.title} (${a.state || 'All India'}) - ${a.category || 'Job'}</a>\n`;
    });
    crawlerLinks += '</div>\n';

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

    const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${desc}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
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
    html = html.replace('</head>', `${metaTags}\n</head>`);
    html = html.replace('<body>', `<body>${crawlerLinks}`);

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
        return render404Page(req, res, 'यह श्रेणी (Category) उपलब्ध नहीं है या हटा दी गई है।');
      }
    }
    next();
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
      const alert = await LiveAlert.findById(cleanSlug).select('_id').lean();
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
        return res.redirect(301, `https://www.digitalhomeblog.in/india/sarkari-jobs/${dbMatch.item._id}`);
      }
    }

    // 2. Malformed / Broken Search Slugs or Unknown URLs: Return strict HTTP 404 with noindex, follow & canonical
    if (hasMalformedChars || !isKnown) {
      return render404Page(req, res);
    }

    // 3. Valid Known Route: Render with HTTP 200 OK and clean, self-referential canonical (zero query params)
    const { normalizeCanonicalUrl } = require('./shared/utils/urlUtils');
    const cleanCanonicalUrl = normalizeCanonicalUrl(rawPath);

    // Non-indexed public pages (tags, search, archive) return X-Robots-Tag: noindex, follow
    const isNonIndexedPublicPage = 
      rawPath === '/tags' ||
      rawPath.startsWith('/tags/') || 
      rawPath === '/tag' ||
      rawPath.startsWith('/tag/') || 
      rawPath === '/search' || 
      rawPath.startsWith('/search/') || 
      rawPath === '/archive' ||
      rawPath.startsWith('/archive/');

    if (isNonIndexedPublicPage) {
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
app.use(errorHandler);

app.buildHomepageHtml = buildHomepageHtml;
app.purgePostSsrCache = () => postSsrCache.clear();
module.exports = app;
