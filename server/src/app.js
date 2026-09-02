const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const compression = require('compression');
const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
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
  let lcpPreloadTag = '';

  try {
    const mongoose = require('mongoose');
    const WebStory = mongoose.model('WebStory');
    const LiveAlert = mongoose.model('LiveAlert');
    const BlogPost = mongoose.model('BlogPost');

    const [storiesRes, alertsRes, sarkariRes] = await Promise.allSettled([
      WebStory.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean(),
      LiveAlert.find({ status: { $in: ['active', 'published'] } }).sort({ parsedPostDate: -1, createdAt: -1 }).limit(8).lean(),
      BlogPost.find({ status: 'published', category: 'Sarkari Jobs & Exams' }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean()
    ]);

    initialStories = storiesRes.status === 'fulfilled' ? storiesRes.value : [];
    initialAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
    sarkariPosts = sarkariRes.status === 'fulfilled' ? sarkariRes.value : [];

    const firstImg = initialStories[0]?.slides?.[0]?.image;
    if (firstImg) {
      const optimizedFirstImg = firstImg.includes('pexels.com')
        ? `${firstImg.split('?')[0]}?auto=compress&cs=tinysrgb&dpr=1&fit=crop&w=220&h=391&q=60`
        : firstImg;
      lcpPreloadTag = `<link rel="preload" as="image" href="${optimizedFirstImg}" fetchpriority="high">`;
    }
  } catch (ssrErr) {
    console.warn('Failed to pre-fetch initial SSR data:', ssrErr.message);
  }

  const scriptTag = `<script>window.__INITIAL_POSTS__ = ${JSON.stringify(data || null).replace(/</g, '\\u003c')}; window.__INITIAL_STORIES__ = ${JSON.stringify(initialStories).replace(/</g, '\\u003c')}; window.__INITIAL_ALERTS__ = ${JSON.stringify(initialAlerts).replace(/</g, '\\u003c')}; window.__INITIAL_SARKARI_POSTS__ = ${JSON.stringify(sarkariPosts).replace(/</g, '\\u003c')};</script>`;
  html = html.replace('</head>', `${lcpPreloadTag}\n${scriptTag}\n</head>`);

  // Inject static HTML links for SEO crawlers (limited to top 30 latest posts + top 30 live alerts)
  try {
    const mongoose = require('mongoose');
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
      seoLinks += `  <a href="/job-alerts?alert=${a._id}">${a.title}</a>\n`;
    });
    seoLinks += '</div>\n';

    html = html.replace('<body>', `<body>${seoLinks}`);
  } catch (dbErr) {
    console.warn('Failed to inject SEO crawler links:', dbErr.message);
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

// Serve static files
app.use(express.static(publicPath));

// In-Memory SSR HTML Cache for Individual Blog Posts (Guarantees <5ms crawler response and prevents timeouts)
const postSsrCache = new Map();
const POST_SSR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Server-Side 301 Redirect for legacy /blog/:slug (Eliminates SPA Orphan Redirects)
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug ? String(req.params.slug).trim() : '';
    if (!slug) return next();

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
    const BlogPost = mongoose.model('BlogPost');
    const post = await BlogPost.findOne({ slug, status: 'published' }).select('category slug').lean();
    if (post) {
      const catUrl = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sarkari-jobs-exams';
      return res.redirect(301, `https://www.digitalhomeblog.in/blog/${catUrl}/${post.slug}`);
    }
    next();
  } catch {
    next();
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
      const { generateFaqSchema, generateJobPostingSchema } = require('./shared/utils/ctrBoosterEngine');
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

      // SEO Social Metadata Block
      const metaTags = `
    <title>${fullTitle}</title>
    <link rel="canonical" href="${canonicalUrl}" />
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
      // 404 HTTP Status Code for missing/draft/deleted posts (Prevents Soft 404s!)
      const noindexMeta = `
    <title>404 Page Not Found | Digital Home Sarkari Result</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="The requested article was not found or has been removed." />
      `;
      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${noindexMeta}\n</head>`);

      if (!isLocal) {
        postSsrCache.set(cacheKey, { status: 404, html, time: Date.now() });
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(html);
    }
  } catch (err) {
    next(err);
  }
});

// Handle client-side routing (React Router) - only if file doesn't exist
app.get('*', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  if (require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

app.buildHomepageHtml = buildHomepageHtml;
app.purgePostSsrCache = () => postSsrCache.clear();
module.exports = app;
