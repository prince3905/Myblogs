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
  } catch (ssrErr) {
    console.warn('Failed to pre-fetch initial SSR data:', ssrErr.message);
  }

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
      // Smart 301 Permanent Redirect for missing/deleted/pruned posts:
      // Eliminates 404 Not Found errors for users & Googlebot!
      // Passes link authority to active category hubs and de-indexes cleanly in GSC.
      const cat = (req.params.category || '').toLowerCase();
      let targetRedirect = 'https://www.digitalhomeblog.in/india/sarkari-jobs';

      if (cat.includes('sarkari') || cat.includes('job') || cat.includes('result') || cat.includes('admit')) {
        targetRedirect = 'https://www.digitalhomeblog.in/india/sarkari-jobs';
      } else if (cat.includes('tech') || cat.includes('tutorial')) {
        targetRedirect = 'https://www.digitalhomeblog.in/category/tech-tutorials';
      } else if (cat.includes('ai') || cat.includes('tool')) {
        targetRedirect = 'https://www.digitalhomeblog.in/category/ai-web-tools';
      } else if (cat.includes('finance') || cat.includes('business')) {
        targetRedirect = 'https://www.digitalhomeblog.in/category/finance-business';
      } else if (cat.includes('health') || cat.includes('wellness')) {
        targetRedirect = 'https://www.digitalhomeblog.in/category/health-wellness';
      } else if (cat.includes('news') || cat.includes('trend')) {
        targetRedirect = 'https://www.digitalhomeblog.in/category/news-trends';
      } else {
        targetRedirect = 'https://www.digitalhomeblog.in/blog';
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, targetRedirect);
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

    // Fallback to React SPA
    next();
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

      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    next();
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

      // Pre-rendered crawler-visible static text & direct links for zero JS bots
      let crawlerContent = `
<div id="seo-crawler-alert" style="display:none;" aria-hidden="true">
  <h1>${cleanTitle}</h1>
  <p><strong>Department / Board:</strong> ${alert.boardName || 'Government of India'}</p>
  <p><strong>Category:</strong> ${alert.category || 'Sarkari Job'}</p>
  <p><strong>State / Region:</strong> ${alert.state || 'Central/All India'}</p>
  <p><strong>Last Date:</strong> ${alert.lastDate || 'See Official Circular'}</p>
  <p>${desc}</p>
  ${alert.sourceUrl ? `<a href="${alert.sourceUrl}">Official Gazette Notification Link</a>` : ''}
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

    next();
  } catch (err) {
    next(err);
  }
});

// Dynamic Server-Side Meta Tag & Crawler Links for Indian Sarkari Jobs Portal Hub
app.get(['/india/sarkari-jobs', '/job-alerts', '/live-alerts'], async (req, res, next) => {
  try {
    const alertIdParam = req.query.alert;
    if (alertIdParam) {
      const mongoose = require('mongoose');
      const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
      if (mongoose.Types.ObjectId.isValid(alertIdParam)) {
        req.params.id = alertIdParam;
        return app._router.handle(req, res, next);
      }
    }

    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    const mongoose = require('mongoose');
    const LiveAlert = require('./modules/liveAlerts/liveAlert.model');
    const topAlerts = await LiveAlert.find({ status: { $in: ['active', 'published'] } })
      .select('title category state _id parsedPostDate')
      .sort({ parsedPostDate: -1, createdAt: -1 })
      .limit(60)
      .lean();

    const siteName = 'Digital Home Sarkari Result';
    const fullTitle = 'Sarkari Result 2026: Latest Online Forms, Admit Card, Result & Answer Key | Digital Home';
    const desc = 'Latest Sarkari Result 2026 notifications, central & state government recruitment, UPSC, SSC, Railways, Banking, Defense & State PSC exam admit cards and answer keys.';
    const canonicalUrl = 'https://www.digitalhomeblog.in/india/sarkari-jobs';
    const imageUrl = 'https://www.digitalhomeblog.in/logo.webp';

    let crawlerLinks = '\n<div style="display:none;" id="seo-crawler-sarkari-links" aria-hidden="true">\n';
    crawlerLinks += '  <h1>Sarkari Result 2026 - Latest Government Jobs, Admit Cards & Results</h1>\n';
    topAlerts.forEach(a => {
      crawlerLinks += `  <a href="/india/sarkari-jobs/${a._id}">${a.title} (${a.state || 'All India'}) - ${a.category || 'Job'}</a>\n`;
    });
    crawlerLinks += '</div>\n';

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.digitalhomeblog.in' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Sarkari Result & Govt Jobs', 'item': canonicalUrl }
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

    html = html.replace(/<title>.*?<\/title>/, '');
    html = html.replace(/<meta name="description" .*?\/>/, '');
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
    const { getCountrySeoMeta, buildHreflangMatrix } = require('./modules/globalJobs/countrySeoConfig');

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
