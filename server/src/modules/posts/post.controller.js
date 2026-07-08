const Post = require('./post.model');
const BlogPost = Post;
const env = require('../../config/env');
const { makeSlug, normalizeCsvOrArray, calculateReadingTime, toTitleCase } = require('../../shared/utils/post.helpers');
const { processAIOutput } = require('../ai/aiPostProcessor');

function catUrlSlug(category) {
  if (!category) return 'blog';
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog';
}

function postUrl(post) {
  return `${env.siteUrl}/blog/${catUrlSlug(post.category)}/${post.slug}`;
}

async function ensureUniqueSlug(baseSlug, currentId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await BlogPost.findOne({ slug });
    if (!existing || `${existing._id}` === `${currentId}`) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function mapPayload(body) {
  const title = toTitleCase(`${body.title || ''}`);
  const excerpt = `${body.excerpt || ''}`.trim();
  const content = `${body.content || ''}`.trim();
  const category = `${body.category || ''}`.trim();
  const status = body.status === 'published' ? 'published' : 'draft';

  // Strip HTML to get clean introduction text (first 145 chars)
  const plainText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const introText = plainText.slice(0, 145);
  const seoDescription = `${body.seoDescription || body.metaDescription || ''}`.trim() || introText || excerpt;

  return {
    title,
    excerpt,
    content,
    category,
    featuredImage: `${body.featuredImage || ''}`.trim(),
    tags: normalizeCsvOrArray(body.tags),
    status,
    seoTitle: `${body.seoTitle || ''}`.trim() || title,
    seoDescription,
    seoKeywords: normalizeCsvOrArray(body.seoKeywords),
    canonicalUrl: `${body.canonicalUrl || ''}`.trim(),
    readingTime: calculateReadingTime(content),
    sponsored: body.sponsored === true || body.sponsored === 'true',
    affiliateDisclosure: body.affiliateDisclosure === true || body.affiliateDisclosure === 'true',
    rating: body.rating ? parseInt(body.rating) : null,
    videoUrl: `${body.videoUrl || ''}`.trim(),
    seoScore: body.seoScore !== undefined ? parseInt(body.seoScore, 10) : undefined
  };
}

function validatePost(data) {
  if (!data.title || !data.excerpt || !data.content || !data.category) {
    return 'Title, excerpt, content and category are required';
  }
  return null;
}

// Local cache for the homepage feed to avoid database calls on every load
let cachedPostsFeed = null;
let cachedPostsTotal = 0;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache duration (invalidated on updates)

function invalidateFeedCache() {
  cachedPostsFeed = null;
  cachedPostsTotal = 0;
  cacheTimestamp = 0;
}

// Proactively warm up the cache on startup
async function warmUpCache() {
  try {
    const query = { status: 'published' };
    const total = await Post.countDocuments(query);
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .select('title slug category featuredImage excerpt views createdAt')
      .lean();
    cachedPostsFeed = posts;
    cachedPostsTotal = total;
    cacheTimestamp = Date.now();
    console.log(`[Cache] Warm-up successful: Cached ${posts.length} posts.`);
  } catch (err) {
    console.error('[Cache] Warm-up failed:', err);
  }
}
setTimeout(warmUpCache, 5000);

async function listPublishedPosts(req, res) {
  const { search = '', category = '', tags = '', dateFrom = '', dateTo = '', page = 1, limit = 10, sortBy = 'date', order = 'desc' } = req.query;
  const query = { status: 'published' };

  if (category) {
    query.category = category;
  }

  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length) query.tags = { $in: tagArray };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  if (dateFrom || dateTo) {
    const toDate = (value, opts = {}) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      const d = opts.appendT23EndOfDay
        ? new Date(`${trimmed}T23:59:59.999Z`)
        : new Date(trimmed);
      return Number.isNaN(d?.getTime?.()) ? null : d;
    };

    const dateFromParsed = toDate(dateFrom);
    const dateToParsed = toDate(dateTo, { appendT23EndOfDay: true });

    // Real-world behavior: if incoming dates are invalid, ignore the date filter
    // rather than crashing the endpoint.
    if (dateFromParsed || dateToParsed) {
      query.publishedAt = {};
      if (dateFromParsed) query.publishedAt.$gte = dateFromParsed;
      if (dateToParsed) query.publishedAt.$lte = dateToParsed;
    }
  }

  const sortDirection = order === 'asc' ? 1 : -1;
  let sortObj = {};
  if (sortBy === 'title') {
    sortObj.title = sortDirection;
  } else if (sortBy === 'views') {
    sortObj.views = sortDirection;
  } else {
    // Default to date (publishedAt or createdAt)
    sortObj.publishedAt = sortDirection;
    sortObj.createdAt = sortDirection;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let total;
  let posts;

  const isDefaultHomeFeed = !search && !category && !tags && !dateFrom && !dateTo && parseInt(limit) === 10 && parseInt(page) === 1 && sortBy === 'date' && order === 'desc';

  if (isDefaultHomeFeed) {
    const now = Date.now();
    if (cachedPostsFeed && (now - cacheTimestamp < CACHE_TTL)) {
      posts = cachedPostsFeed;
      total = cachedPostsTotal;
    } else {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      total = await BlogPost.countDocuments(query);
      posts = await Post.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(10)
        .select('title slug category featuredImage excerpt views createdAt')
        .lean();
      cachedPostsFeed = posts;
      cachedPostsTotal = total;
      cacheTimestamp = now;
    }
  } else {
    total = await BlogPost.countDocuments(query);
    if (!search && !category && !tags && !dateFrom && !dateTo && parseInt(limit) === 1000 && parseInt(page) === 1 && sortBy === 'date' && order === 'desc') {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      posts = await Post.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(1000)
        .select('title slug category featuredImage excerpt views createdAt')
        .lean();
    } else {
      posts = await BlogPost.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title slug category featuredImage excerpt views createdAt')
        .lean();
    }
  }

  return res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function listAdminPosts(req, res) {
  const posts = await BlogPost.find()
    .sort({ updatedAt: -1 })
    .lean();
  return res.json(posts);
}

async function getPostBySlug(req, res) {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Expose disablePdfDownload toggle to public post page
  try {
    const Settings = require('../settings/settings.model');
    const pdfSetting = await Settings.findOne({ key: 'disablePdfDownload' });
    post.disablePdfDownload = pdfSetting ? pdfSetting.value === true : false;
  } catch (err) {
    console.error('Failed to get disablePdfDownload setting:', err.message);
    post.disablePdfDownload = false;
  }

  // Increment views (fire-and-forget, no await needed for response)
  BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {});

  const relatedPosts = await BlogPost.find({
    _id: { $ne: post._id },
    status: 'published',
    $or: [{ category: post.category }, { tags: { $in: post.tags } }]
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('title slug category featuredImage readingTime publishedAt')
    .lean();

  // Geo-translate for non-Indian visitors
  if (req.needsTranslation) {
    const { translatePost } = require('../../shared/middleware/geoTranslate');
    const [translatedPost, translatedRelated] = await Promise.all([
      translatePost(post, req),
      Promise.all(relatedPosts.map(rp => translatePost(rp, req)))
    ]);
    return res.json({ post: translatedPost, relatedPosts: translatedRelated });
  }

  return res.json({ post, relatedPosts });
}

async function getAdminPostById(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.json(post);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Post ID format' });
    }
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const payload = mapPayload(req.body);
    const validationError = validatePost(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Fix all red SEO checklist issues before saving to draft
    const processed = await processAIOutput({
      title: payload.title,
      content: payload.content,
      keywords: payload.tags || [],
      category: payload.category,
      length: 'long',
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    });
    payload.title = processed.title;
    payload.content = processed.content;
    payload.tags = processed.tags;
    payload.seoTitle = processed.seoTitle;
    payload.seoDescription = processed.seoDescription;

    const baseSlug = makeSlug(processed.slug || req.body.slug || payload.title);
    payload.slug = await ensureUniqueSlug(baseSlug);
    payload.publishedAt = payload.status === 'published' ? new Date() : null;
    payload.canonicalUrl = payload.canonicalUrl || postUrl(payload);

    const post = await BlogPost.create(payload);
    invalidateFeedCache();

    if (post.status === 'published') {
      const { notifyUrl } = require('../../shared/utils/google-indexing');
      notifyUrl(postUrl(post), 'URL_UPDATED').catch(() => {});

      const { sendTelegramMessage } = require('../../shared/services/telegramService');
      sendTelegramMessage(post).catch(() => {});
    }

    return res.status(201).json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const payload = mapPayload(req.body);
    const validationError = validatePost(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Fix all red SEO checklist issues before saving to draft
    const processed = await processAIOutput({
      title: payload.title,
      content: payload.content,
      keywords: payload.tags || [],
      category: payload.category,
      length: 'long',
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    });
    payload.title = processed.title;
    payload.content = processed.content;
    payload.tags = processed.tags;
    payload.seoTitle = processed.seoTitle;
    payload.seoDescription = processed.seoDescription;

    const baseSlug = makeSlug(processed.slug || req.body.slug || payload.title);
    payload.slug = await ensureUniqueSlug(baseSlug, existing._id);
    payload.publishedAt = payload.status === 'published'
      ? existing.publishedAt || new Date()
      : null;
    payload.canonicalUrl = payload.canonicalUrl || postUrl(payload);

    const oldUrl = postUrl(existing);
    const oldStatus = existing.status;

    Object.assign(existing, payload);
    await existing.save();
    invalidateFeedCache();

    if (existing.status === 'published') {
      const { notifyUrl } = require('../../shared/utils/google-indexing');
      notifyUrl(postUrl(existing), 'URL_UPDATED').catch(() => {});

      if (oldStatus === 'published' && oldUrl !== postUrl(existing)) {
        notifyUrl(oldUrl, 'URL_DELETED').catch(() => {});
      }

      // Share to Telegram if the status just changed to published
      if (oldStatus !== 'published') {
        const { sendTelegramMessage } = require('../../shared/services/telegramService');
        sendTelegramMessage(existing).catch(() => {});
      }
    } else if (oldStatus === 'published' && existing.status !== 'published') {
      const { notifyUrl } = require('../../shared/utils/google-indexing');
      notifyUrl(oldUrl, 'URL_DELETED').catch(() => {});
    }

    return res.json(existing);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Post ID format' });
    }
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    invalidateFeedCache();

    if (post.status === 'published') {
      const { notifyUrl } = require('../../shared/utils/google-indexing');
      notifyUrl(postUrl(post), 'URL_DELETED').catch(() => {});
    }

    return res.json({ success: true });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Post ID format' });
    }
    next(err);
  }
}

async function listCategories(req, res) {
  const categories = await BlogPost.distinct('category', { status: 'published' });
  return res.json(categories.filter(Boolean).sort((a, b) => a.localeCompare(b)));
}

async function siteMeta(req, res) {
  return res.json({
    siteName: 'Digital Home',
    siteUrl: env.siteUrl,
    description: 'Your Daily Dose of Information & Insights — Sarkari Jobs, Health, Tech, AI Tools, News & Finance.'
  });
}

async function sitemap(req, res) {
  // Prevent CDN and browser caching of sitemap XML to ensure updates show immediately
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const posts = await BlogPost.find({ status: 'published' }).sort({ updatedAt: -1 });
  const urls = posts
    .map((post) => `<url><loc>${postUrl(post)}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`)
    .join('');

  const staticPages = ['/about', '/contact', '/privacy', '/search', '/archive', '/tools', '/games', '/terms', '/job-alerts'].map(p =>
    `<url><loc>${env.siteUrl}${p}</loc><priority>0.8</priority></url>`
  ).join('');

  // Include category pages dynamically
  const categories = await BlogPost.distinct('category', { status: 'published' });
  const categoryUrls = categories
    .filter(Boolean)
    .map((cat) => `<url><loc>${env.siteUrl}/category/${catUrlSlug(cat)}</loc><priority>0.7</priority></url>`)
    .join('');

  // Include tag pages dynamically
  const tags = await BlogPost.distinct('tags', { status: 'published' });
  const tagUrls = tags
    .filter(Boolean)
    .map((tag) => `<url><loc>${env.siteUrl}/tags/${encodeURIComponent(tag.toLowerCase())}</loc><priority>0.6</priority></url>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${env.siteUrl}</loc><priority>1.0</priority></url><url><loc>${env.siteUrl}/blog</loc><priority>0.9</priority></url>${staticPages}${categoryUrls}${tagUrls}${urls}</urlset>`;
  res.type('application/xml');
  return res.send(xml);
}

function robots(req, res) {
  res.type('text/plain');
  return res.send(`User-agent: *\nAllow: /\nSitemap: ${env.siteUrl}/sitemap.xml`);
}

async function rssFeed(req, res) {
  const posts = await BlogPost.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(20);
  const items = posts.map(p => `
    <item>
      <title>${p.title}</title>
      <link>${postUrl(p)}</link>
      <pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate>
      <description>${p.excerpt}</description>
      <guid>${postUrl(p)}</guid>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Digital Home</title>
    <link>${env.siteUrl}</link>
    <description>Your Daily Dose of Information & Insights — Technology, Finance, Career, Tutorials, and Trends.</description>
    ${items}
  </channel>
</rss>`;

  res.type('application/xml');
  return res.send(xml);
}

async function searchPosts(req, res, next) {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const trimmed = q.trim();
    if (!trimmed) {
      return res.json({ posts: [], total: 0, page: 1, pages: 0 });
    }

    const query = { status: 'published', $text: { $search: trimmed } };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await BlogPost.countDocuments(query);
    const posts = await BlogPost.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug category featuredImage excerpt views createdAt')
      .lean();

    res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
}

async function likePost(req, res, next) {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const { liked } = req.body;
    if (liked === true) {
      post.likes = (post.likes || 0) + 1;
    } else if (liked === false) {
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likes = (post.likes || 0) + 1;
    }
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    next(err);
  }
}

async function getHomepageData() {
  const now = Date.now();
  if (cachedPostsFeed && (now - cacheTimestamp < CACHE_TTL)) {
    return { posts: cachedPostsFeed, total: cachedPostsTotal, page: 1, pages: Math.ceil(cachedPostsTotal / 10) };
  }
  try {
    const query = { status: 'published' };
    const total = await Post.countDocuments(query);
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .select('title slug category featuredImage excerpt views createdAt')
      .lean();
    cachedPostsFeed = posts;
    cachedPostsTotal = total;
    cacheTimestamp = now;
    return { posts, total, page: 1, pages: Math.ceil(total / 10) };
  } catch (err) {
    console.error('[Cache] getHomepageData fetch failed:', err);
    return null;
  }
}

async function pingPostIndexing(req, res) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Post must be published to notify Google Indexing API.' });
    }

    const { notifyUrl } = require('../../shared/utils/google-indexing');
    const result = await notifyUrl(postUrl(post), 'URL_UPDATED');

    if (result && result.success) {
      return res.json({ success: true, message: 'Google Indexing request sent successfully!', data: result.data });
    } else {
      return res.status(500).json({ success: false, message: result?.message || 'Google Indexing ping failed.', error: result?.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function sharePostToTelegram(req, res) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Post must be published to share to Telegram.' });
    }

    const { sendTelegramMessage } = require('../../shared/services/telegramService');
    const result = await sendTelegramMessage(post);

    if (result && result.success) {
      return res.json({ success: true, message: 'Successfully shared post to Telegram!', data: result.data });
    } else {
      return res.status(500).json({ success: false, message: result?.message || 'Telegram sharing failed.', error: result?.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  listPublishedPosts,
  listAdminPosts,
  getPostBySlug,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost,
  listCategories,
  siteMeta,
  sitemap,
  robots,
  rssFeed,
  searchPosts,
  likePost,
  getHomepageData,
  pingPostIndexing,
  sharePostToTelegram
};

