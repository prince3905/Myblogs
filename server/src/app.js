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

// 1-Step 301 Direct Canonical Domain Redirect (apex domain & render URL -> www.digitalhomeblog.in)
app.use((req, res, next) => {
  if (env.nodeEnv === 'production' && !req.path.startsWith('/api')) {
    const host = (req.headers.host || '').toLowerCase();
    if (host === 'digitalhomeblog.in' || host === 'digital-home-blog.onrender.com') {
      return res.redirect(301, `https://www.digitalhomeblog.in${req.originalUrl}`);
    }
  }
  next();
});

// 301 Permanent Redirect Cleaner for Malformed/Duplicate Nested URLs
app.use((req, res, next) => {
  const rawUrl = req.originalUrl || req.url;
  
  if (!req.path.startsWith('/api') && !req.path.startsWith('/assets') && !req.path.startsWith('/static')) {
    let cleaned = rawUrl;
    let needsRedirect = false;

    // 1. Handle nested domain duplication e.g., /digitalhomeblog.in/
    if (cleaned.includes('digitalhomeblog.in')) {
      needsRedirect = true;
      cleaned = cleaned.replace(/\/digitalhomeblog\.in\/?/gi, '/');
      cleaned = cleaned.replace(/digitalhomeblog\.in\/?/gi, '');
    }

    // 2. Handle ampersand in category e.g., sarkari-jobs-&-exams or %26
    if (cleaned.includes('sarkari-jobs-&-exams') || cleaned.includes('sarkari-jobs-%26-exams')) {
      needsRedirect = true;
      cleaned = cleaned.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
    }

    // 3. Handle double nested path e.g., /blog/sarkari-jobs-exams/blog/...
    if (/\/(blog|category)\/.*\/(blog|category)\//i.test(cleaned)) {
      needsRedirect = true;
      const parts = cleaned.split('/').filter(Boolean);
      const lastSlug = parts[parts.length - 1];
      cleaned = `/blog/sarkari-jobs-exams/${lastSlug}`;
    }

    // 4. Clean multiple consecutive slashes
    cleaned = cleaned.replace(/\/{2,}/g, '/');

    if (needsRedirect && cleaned !== rawUrl) {
      console.log(`[301 URL Fixer Redirect] ${rawUrl} -> ${cleaned}`);
      return res.redirect(301, `https://www.digitalhomeblog.in${cleaned.startsWith('/') ? cleaned : '/' + cleaned}`);
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

// Handle root path / specially to inject initial posts data to avoid client API waterfall
app.get('/', async (req, res, next) => {
  try {
    const indexPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html not found');
    }
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Get pre-cached homepage posts data
    const data = await getHomepageData();
    if (data) {
      const scriptTag = `<script>window.__INITIAL_POSTS__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`;
      html = html.replace('</head>', `${scriptTag}\n</head>`);
    }

    // Inject static HTML links for SEO crawlers who do not execute client-side Javascript
    try {
      const mongoose = require('mongoose');
      const BlogPost = mongoose.model('BlogPost');
      const allPosts = await BlogPost.find({ status: 'published' })
        .select('title category slug')
        .lean();
      
      const catUrlSlug = (cat) => (cat || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      let seoLinks = '\n<div style="display:none;" id="seo-crawler-links" aria-hidden="true">\n';
      seoLinks += '  <h1 style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">Digital Home - Latest Sarkari Jobs, Exams & Tech Updates</h1>\n';
      allPosts.forEach(p => {
        const path = `/blog/${catUrlSlug(p.category)}/${p.slug}`;
        seoLinks += `  <a href="${path}">${p.title}</a>\n`;
      });
      seoLinks += '</div>\n';
      
      html = html.replace('<body>', `<body>${seoLinks}`);
    } catch (dbErr) {
      console.warn('Failed to inject SEO crawler links:', dbErr.message);
    }
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    next(err);
  }
});

// Serve static files
app.use(express.static(publicPath));

// Dynamic Server-Side Meta Tag Injection for Blog Post Pages (Forces perfect OG/Twitter social scraping)
app.get('/blog/:category/:slug', async (req, res, next) => {
  try {
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
      const { generateFaqSchema } = require('./shared/utils/ctrBoosterEngine');
      const { normalizeCanonicalUrl } = require('./shared/utils/urlUtils');
      const siteName = 'Digital Home Sarkari Result';
      const cleanTitle = (post.title || '').replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '');
      const fullTitle = `${cleanTitle} | ${siteName}`;
      const desc = post.excerpt || post.seoDescription || 'Read the latest updates on Sarkari jobs, admit cards, and results.';
      const pageUrl = `https://www.digitalhomeblog.in/blog/${req.params.category}/${req.params.slug}`;
      const canonicalUrl = normalizeCanonicalUrl(post.canonicalUrl || pageUrl);
      const imageUrl = post.featuredImage || 'https://www.digitalhomeblog.in/logo.png';

      // Generate Google FAQPage Accordion Schema for 60% Higher CTR
      const faqSchema = generateFaqSchema(cleanTitle, post.content);
      const faqScript = `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;

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
    ${faqScript}
      `;

      // Remove default title/meta tags to prevent duplicates and append post specific tags
      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace(/<meta name="description" .*?\/>/, '');
      html = html.replace('</head>', `${metaTags}\n</head>`);
      res.setHeader('Content-Type', 'text/html');
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
      res.setHeader('Content-Type', 'text/html');
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

module.exports = app;
