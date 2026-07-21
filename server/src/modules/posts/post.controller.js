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
    focusKeyword: `${body.focusKeyword || ''}`.trim(),
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
  let titleRegexPattern = '';

  if (category) {
    query.category = category;
  }

  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length) query.tags = { $in: tagArray };
  }

  if (search) {
    const synonymMap = {
      'rrb': ['railway', 'rrc', 'rail'],
      'railway': ['rrb', 'rrc', 'rail'],
      'rail': ['railway', 'rrb', 'rrc'],
      'up': ['uttar pradesh', 'uttarpradesh'],
      'mp': ['madhya pradesh', 'madhyapradesh'],
      'uk': ['uttarakhand', 'uttaranchal'],
      'hp': ['himachal pradesh'],
      'delhi': ['dcb'],
      'dcb': ['delhi', 'cantonment'],
      'mts': ['multi tasking staff', 'multitasking'],
      'deo': ['data entry operator'],
      'je': ['junior engineer'],
      'ae': ['assistant engineer'],
      'si': ['sub inspector'],
      'constable': ['police'],
      'police': ['constable', 'si']
    };

    const words = search.trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const conditions = words.map(word => {
        const lowerWord = word.toLowerCase();
        const synonyms = synonymMap[lowerWord] || [];
        const searchTerms = [word, ...synonyms];
        const escapedTerms = searchTerms.map(term => {
          const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          return term.length <= 3 ? `\\b${escaped}\\b` : `\\b${escaped}`;
        });
        const regex = new RegExp(escapedTerms.join('|'), 'i');
        
        return {
          $or: [
            { title: { $regex: regex } },
            { content: { $regex: regex } },
            { excerpt: { $regex: regex } },
            { tags: { $regex: regex } }
          ]
        };
      });
      query.$and = conditions;

      const allPatterns = words.map(word => {
        const lowerWord = word.toLowerCase();
        const synonyms = synonymMap[lowerWord] || [];
        const searchTerms = [word, ...synonyms];
        return searchTerms.map(term => {
          const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          return term.length <= 3 ? `\\b${escaped}\\b` : `\\b${escaped}`;
        }).join('|');
      });
      titleRegexPattern = allPatterns.map(p => `(${p})`).join('|');
    }
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
    if (search && titleRegexPattern) {
      // Use aggregation pipeline to calculate relevance score and sort
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            relevanceScore: {
              $cond: {
                if: { $regexMatch: { input: "$title", regex: titleRegexPattern, options: "i" } },
                then: 10,
                else: 0
              }
            }
          }
        },
        {
          $sort: {
            relevanceScore: -1,
            ...sortObj
          }
        }
      ];

      // Fetch total documents count
      const countRes = await BlogPost.aggregate([
        { $match: query },
        { $count: "count" }
      ]);
      total = countRes[0]?.count || 0;

      // Fetch posts with pagination
      posts = await BlogPost.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            title: 1,
            slug: 1,
            category: 1,
            featuredImage: 1,
            excerpt: 1,
            views: 1,
            createdAt: 1
          }
        }
      ]);
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
  }

  return res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function listAdminPosts(req, res) {
  try {
    const posts = await BlogPost.find()
      .select('title category slug status views createdAt updatedAt seoScore')
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve posts: ' + err.message });
  }
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

  // Include published Web Stories dynamically
  let storyUrls = '';
  try {
    const WebStory = mongoose.model('WebStory');
    const stories = await WebStory.find({ status: 'published' }).sort({ updatedAt: -1 });
    storyUrls = stories
      .map((story) => `<url><loc>${env.siteUrl}/web-stories/${story.slug}</loc><lastmod>${story.updatedAt.toISOString()}</lastmod><priority>0.8</priority></url>`)
      .join('');
  } catch (storyErr) {
    console.error('[Sitemap] Failed to append Web Stories:', storyErr.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${env.siteUrl}</loc><priority>1.0</priority></url><url><loc>${env.siteUrl}/blog</loc><priority>0.9</priority></url>${staticPages}${categoryUrls}${tagUrls}${urls}${storyUrls}</urlset>`;
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

    const synonymMap = {
      'rrb': ['railway', 'rrc', 'rail'],
      'railway': ['rrb', 'rrc', 'rail'],
      'rail': ['railway', 'rrb', 'rrc'],
      'up': ['uttar pradesh', 'uttarpradesh'],
      'mp': ['madhya pradesh', 'madhyapradesh'],
      'uk': ['uttarakhand', 'uttaranchal'],
      'hp': ['himachal pradesh'],
      'delhi': ['dcb'],
      'dcb': ['delhi', 'cantonment'],
      'mts': ['multi tasking staff', 'multitasking'],
      'deo': ['data entry operator'],
      'je': ['junior engineer'],
      'ae': ['assistant engineer'],
      'si': ['sub inspector'],
      'constable': ['police'],
      'police': ['constable', 'si']
    };

    const words = trimmed.split(/\s+/).filter(Boolean);
    let query = { status: 'published' };
    let titleRegexPattern = '';

    if (words.length > 0) {
      const conditions = words.map(word => {
        const lowerWord = word.toLowerCase();
        const synonyms = synonymMap[lowerWord] || [];
        const searchTerms = [word, ...synonyms];
        const escapedTerms = searchTerms.map(term => {
          const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          return term.length <= 3 ? `\\b${escaped}\\b` : `\\b${escaped}`;
        });
        const regex = new RegExp(escapedTerms.join('|'), 'i');
        
        return {
          $or: [
            { title: { $regex: regex } },
            { content: { $regex: regex } },
            { excerpt: { $regex: regex } },
            { tags: { $regex: regex } }
          ]
        };
      });
      query.$and = conditions;

      const allPatterns = words.map(word => {
        const lowerWord = word.toLowerCase();
        const synonyms = synonymMap[lowerWord] || [];
        const searchTerms = [word, ...synonyms];
        return searchTerms.map(term => {
          const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          return term.length <= 3 ? `\\b${escaped}\\b` : `\\b${escaped}`;
        }).join('|');
      });
      titleRegexPattern = allPatterns.map(p => `(${p})`).join('|');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    let posts = [];
    let total = 0;

    if (titleRegexPattern) {
      const countRes = await BlogPost.aggregate([
        { $match: query },
        { $count: "count" }
      ]);
      total = countRes[0]?.count || 0;

      posts = await BlogPost.aggregate([
        { $match: query },
        {
          $addFields: {
            relevanceScore: {
              $cond: {
                if: { $regexMatch: { input: "$title", regex: titleRegexPattern, options: "i" } },
                then: 10,
                else: 0
              }
            }
          }
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitInt },
        {
          $project: {
            title: 1,
            slug: 1,
            category: 1,
            featuredImage: 1,
            excerpt: 1,
            views: 1,
            createdAt: 1
          }
        }
      ]);
    }

    res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / limitInt) });
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

async function optimizePostSEO(req, res) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const catSlug = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const pagePath = `/blog/${catSlug}/${post.slug}`;

    // Get search queries from GSC
    const { getTopQueriesForPage } = require('../../shared/services/gscService');
    let queries = [];
    try {
      queries = await getTopQueriesForPage(pagePath);
    } catch (gscErr) {
      console.warn('[Post Controller] Failed to fetch queries from GSC:', gscErr.message);
    }

    // Fallback search terms
    const cleanTitle = post.title.replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
    const fallbackKeywords = [
      cleanTitle,
      ...(post.seoKeywords || []),
      ...(post.tags || [])
    ].filter(Boolean);

    const keywords = queries.length > 0 ? queries : fallbackKeywords;

    const prompt = `You are a professional SEO copywriter and CTR (Click-Through Rate) optimization expert.
Analyze this job post details and optimize the SEO Title and Meta Description (SEO Description) to maximize search clicks.

Current Title: "${post.title}"
Category: "${post.category}"
Page Search Queries/Keywords: [${keywords.slice(0, 15).join(', ')}]

OPTIMIZATION REQUIREMENTS:
1. Suggest a high-CTR click-magnet Title (SEO Title):
   - You MUST include a highly converting click-magnet hook at the end, such as "(Direct Link) - Step-by-Step Apply Now" or "(Direct Link) - Apply Online Now" or "(Direct Apply) - No Exam, Direct Selection!".
   - Keep the length strictly under 65 characters so it doesn't get truncated in Google Search results.
2. Suggest an engaging Meta Description (SEO Description) hook:
   - Use action-oriented keywords. Start with the core topic/job name.
   - Keep it strictly between 110 and 150 characters.

Return ONLY a valid JSON object matching this structure:
{
  "optimizedTitle": "optimized title here",
  "optimizedDescription": "meta description here"
}
Do NOT include any extra words, formatting, markdown markers, or quotes. Output ONLY the JSON block.`;

    const { callAiJson } = require('./webstory.service');
    const result = await callAiJson(prompt);

    if (!result || !result.optimizedTitle || !result.optimizedDescription) {
      throw new Error('AI failed to generate both optimized title and description.');
    }

    return res.json({
      success: true,
      optimizedTitle: result.optimizedTitle.trim(),
      optimizedDescription: result.optimizedDescription.trim(),
      focusKeyword: queries[0] || (keywords.length > 0 ? keywords[0] : ''),
      queriesUsed: queries.length > 0,
      keywords: keywords.slice(0, 10)
    });

  } catch (err) {
    console.error('[Post Controller] SEO auto-optimization failed:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function boostPostWithGSC(req, res) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (req.body && typeof req.body === 'object') {
      if (req.body.title) post.title = req.body.title;
      if (req.body.content) post.content = req.body.content;
      if (req.body.focusKeyword) post.focusKeyword = req.body.focusKeyword;
      if (req.body.category) post.category = req.body.category;
      if (req.body.slug) post.slug = req.body.slug;
      if (req.body.seoTitle) post.seoTitle = req.body.seoTitle;
      if (req.body.seoDescription) post.seoDescription = req.body.seoDescription;
    }

    const catSlug = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const pagePath = `/blog/${catSlug}/${post.slug}`;

    const { getTopQueriesForPage, getDetailedQueriesForPage } = require('../../shared/services/gscService');
    let queries = [];
    let detailedQueries = [];
    try {
      detailedQueries = await getDetailedQueriesForPage(pagePath);
      queries = detailedQueries.map(d => d.query);
    } catch (gscErr) {
      console.warn('[Post Controller] GSC fetch warning:', gscErr.message);
    }

    // Fallback if no GSC queries yet (e.g. fresh post)
    if (queries.length === 0) {
      const cleanTitle = post.title.replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2');
      queries = [cleanTitle, ...(post.tags || [])];
    }

    const { processAIOutput, enrichWithGscQueries } = require('../ai/aiPostProcessor');

    // Step 1: Enrich content naturally with GSC queries
    let enrichedContent = enrichWithGscQueries(post.content, post.title, queries);

    // Step 2: Run processAIOutput to ensure 100/100 SEO & formatting
    const processed = await processAIOutput({
      title: post.title,
      content: enrichedContent,
      keywords: [queries[0] || post.focusKeyword || post.title, ...(post.tags || [])],
      focusKeyword: post.focusKeyword || queries[0] || '',
      category: post.category,
      length: 'long',
      slug: post.slug,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription
    });

    post.content = processed.content;
    post.tags = processed.tags;
    if (processed.seoTitle) post.seoTitle = processed.seoTitle;
    if (processed.seoDescription) {
      post.seoDescription = processed.seoDescription;
      post.excerpt = processed.seoDescription;
    }

    // Recalculate SEO score
    const { calculateSeoScore } = require('../../shared/utils/seoAuditor');
    const audit = calculateSeoScore(post);
    post.seoScore = audit.score;

    await post.save();

    // Step 3: Trigger Google Indexing API ping
    let pingStatus = 'skipped';
    try {
      const { pingUrlIndexing } = require('../../shared/services/googleIndexingService');
      const siteUrlRaw = env.siteUrl || 'https://www.digitalhomeblog.in';
      const fullUrl = `${siteUrlRaw.replace(/\/$/, '')}${pagePath}`;
      await pingUrlIndexing(fullUrl);
      pingStatus = 'success';
    } catch (pingErr) {
      console.warn('[Post Controller] Auto-indexing ping failed:', pingErr.message);
      pingStatus = 'error';
    }

    return res.json({
      success: true,
      message: 'Post successfully boosted with GSC search data & submitted for indexing!',
      queriesFound: queries.slice(0, 10),
      seoScore: audit.score,
      overallVisibilityIndex: audit.overallVisibilityIndex,
      pingStatus,
      data: post
    });
  } catch (err) {
    console.error('Boost with GSC failed:', err);
    return res.status(500).json({ success: false, message: err.message });
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
  sharePostToTelegram,
  optimizePostSEO,
  boostPostWithGSC
};

