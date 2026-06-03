const Post = require('./post.model');
const BlogPost = Post;
const env = require('../../config/env');
const { makeSlug, normalizeCsvOrArray, calculateReadingTime, toTitleCase } = require('../../shared/utils/post.helpers');

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

  return {
    title,
    excerpt,
    content,
    category,
    featuredImage: `${body.featuredImage || ''}`.trim(),
    tags: normalizeCsvOrArray(body.tags),
    status,
    seoTitle: `${body.seoTitle || ''}`.trim() || title,
    seoDescription: `${body.seoDescription || ''}`.trim() || excerpt,
    seoKeywords: normalizeCsvOrArray(body.seoKeywords),
    canonicalUrl: `${body.canonicalUrl || ''}`.trim(),
    readingTime: calculateReadingTime(content),
    sponsored: body.sponsored === true || body.sponsored === 'true',
    affiliateDisclosure: body.affiliateDisclosure === true || body.affiliateDisclosure === 'true',
    rating: body.rating ? parseInt(body.rating) : null,
    videoUrl: `${body.videoUrl || ''}`.trim()
  };
}

function validatePost(data) {
  if (!data.title || !data.excerpt || !data.content || !data.category) {
    return 'Title, excerpt, content and category are required';
  }
  return null;
}

async function listPublishedPosts(req, res) {
  const { search = '', category = '', tags = '', dateFrom = '', dateTo = '', page = 1, limit = 10 } = req.query;
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


  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await BlogPost.countDocuments(query);
  
  let posts;
  if (!search && !category && !tags && !dateFrom && !dateTo && (parseInt(limit) === 10 || parseInt(limit) === 1000) && parseInt(page) === 1) {
    posts = await Post.find({ status: 'published' }).select('title slug category featuredImage excerpt views createdAt').lean();
  } else {
    posts = await BlogPost.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug category featuredImage excerpt views createdAt')
      .lean();
  }

  return res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function listAdminPosts(req, res) {
  const posts = await BlogPost.find()
    .sort({ updatedAt: -1 })
    .select('title slug category featuredImage excerpt views createdAt updatedAt status')
    .lean();
  return res.json(posts);
}

async function getPostBySlug(req, res) {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
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

async function getAdminPostById(req, res) {
  const post = await BlogPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  return res.json(post);
}

async function createPost(req, res) {
  const payload = mapPayload(req.body);
  const validationError = validatePost(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const baseSlug = makeSlug(req.body.slug || payload.title);
  payload.slug = await ensureUniqueSlug(baseSlug);
  payload.publishedAt = payload.status === 'published' ? new Date() : null;
  payload.canonicalUrl = payload.canonicalUrl || postUrl(payload);

  const post = await BlogPost.create(payload);
  return res.status(201).json(post);
}

async function updatePost(req, res) {
  const existing = await BlogPost.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const payload = mapPayload(req.body);
  const validationError = validatePost(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const baseSlug = makeSlug(req.body.slug || payload.title);
  payload.slug = await ensureUniqueSlug(baseSlug, existing._id);
  payload.publishedAt = payload.status === 'published'
    ? existing.publishedAt || new Date()
    : null;
  payload.canonicalUrl = payload.canonicalUrl || postUrl(payload);

  Object.assign(existing, payload);
  await existing.save();
  return res.json(existing);
}

async function deletePost(req, res) {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  return res.json({ success: true });
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
  const posts = await BlogPost.find({ status: 'published' }).sort({ updatedAt: -1 });
  const urls = posts
    .map((post) => `<url><loc>${postUrl(post)}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`)
    .join('');

  const staticPages = ['/about', '/contact', '/privacy', '/search', '/archive', '/tools', '/games', '/terms'].map(p =>
    `<url><loc>${env.siteUrl}${p}</loc><priority>0.8</priority></url>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${env.siteUrl}</loc><priority>1.0</priority></url><url><loc>${env.siteUrl}/blog</loc><priority>0.9</priority></url>${staticPages}${urls}</urlset>`;
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
  likePost
};
