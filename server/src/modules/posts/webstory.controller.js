const mongoose = require('mongoose');

require('./post.model');
require('./webstory.model');

const WebStory = mongoose.model('WebStory');
const BlogPost = mongoose.model('BlogPost');

function catUrlSlug(category) {
  if (!category) return 'blog';
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog';
}

function escapeXml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmpUrl(urlStr) {
  const fallback = 'https://www.digitalhomeblog.in/logo-og.webp';
  if (!urlStr || typeof urlStr !== 'string') {
    return fallback;
  }

  let cleaned = urlStr.trim();

  // If input is data: URI, blob:, or raw SVG string, fallback to absolute HTTPS URL
  if (cleaned.startsWith('data:') || cleaned.startsWith('blob:') || cleaned.includes('<svg')) {
    return fallback;
  }

  // Enforce https:// protocol for AMP compliance
  if (cleaned.startsWith('http://')) {
    cleaned = 'https://' + cleaned.slice(7);
  } else if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  } else if (!cleaned.startsWith('https://')) {
    cleaned = 'https://www.digitalhomeblog.in' + (cleaned.startsWith('/') ? cleaned : '/' + cleaned);
  }

  // Escape HTML entities in XML/AMP attribute values
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderWebStory(req, res, next) {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.isValidObjectId(slug);
    const story = await WebStory.findOne({
      $or: [
        { slug: slug },
        ...(isObjectId ? [{ _id: slug }] : [])
      ]
    }).populate('post').lean();

    if (!story) {
      return res.status(404).send('Web Story not found. Please verify the URL or slug in Admin.');
    }

    // Direct preview for admins, or block drafted stories from indexing
    const isAdminPreview = req.query.preview === 'true';
    if (story.status !== 'published' && !isAdminPreview) {
      return res.status(404).send('Web Story is currently a draft. Please publish it or use ?preview=true to view.');
    }

    // Increment view count in background
    WebStory.updateOne({ _id: story._id }, { $inc: { views: 1 } }).catch(err => {
      console.error('[WebStory Analytics] Failed to increment views:', err.message);
    });

    // Resolve post path details
    const categorySlug = catUrlSlug(story.post?.category);
    const postUrl = `https://www.digitalhomeblog.in/blog/${categorySlug}/${story.slug}`;
    const canonicalUrl = `https://www.digitalhomeblog.in/web-stories/${story.slug}`;

    const coverImage = formatAmpUrl(story.slides?.[0]?.image);
    const publisherLogo = 'https://www.digitalhomeblog.in/logo.png';

    const escapedTitle = escapeXml(story.title);
    const escapedDesc = escapeXml(story.slides?.[0]?.text || story.title);

    const ampHtml = `<!doctype html>
<html amp lang="hi">
  <head>
    <meta charset="utf-8">
    <title>${escapedTitle}</title>
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <meta name="robots" content="max-image-preview:large, index, follow">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${coverImage}" />
    
    <!-- Twitter Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <meta name="twitter:image" content="${coverImage}" />

    <!-- Google Discover Indian Desi SEO JSON-LD Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": "${canonicalUrl}",
      "headline": "${escapedTitle}",
      "description": "${escapedDesc}",
      "image": ["${coverImage}"],
      "datePublished": "${new Date(story.createdAt || Date.now()).toISOString()}",
      "dateModified": "${new Date(story.updatedAt || Date.now()).toISOString()}",
      "inLanguage": "hi-IN",
      "publisher": {
        "@type": "Organization",
        "name": "Digital Home",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.digitalhomeblog.in/logo.png"
        }
      }
    }
    </script>

    <!-- AMP Script Boilerplate -->
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
    
    <style amp-custom>
      amp-story-page {
        background-color: #000;
        font-family: 'Outfit', -apple-system, sans-serif;
      }
      .text-layer {
        padding: 30px 24px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0) 100%);
        height: 100%;
        color: #fff;
        box-sizing: border-box;
      }
      .slide-title {
        font-size: 24px;
        font-weight: 800;
        line-height: 1.3;
        margin: 0 0 10px 0;
        text-shadow: 0 2px 5px rgba(0,0,0,0.8);
        color: #fff;
      }
      .slide-desc {
        font-size: 15px;
        line-height: 1.5;
        opacity: 0.95;
        margin: 0;
        text-shadow: 0 1px 3px rgba(0,0,0,0.7);
        color: #e5e7eb;
      }
      .badge {
        align-self: flex-start;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        padding: 4px 14px;
        font-size: 11px;
        font-weight: 800;
        border-radius: 9999px;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        box-shadow: 0 3px 6px rgba(37,99,235,0.4);
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        padding: 14px 28px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 15px;
        text-decoration: none;
        box-shadow: 0 4px 16px rgba(37,99,235,0.6);
        letter-spacing: 0.02em;
      }
      .text-layer-center {
        align-items: center;
        text-align: center;
        justify-content: center;
      }
      .badge-center {
        align-self: center;
      }
      amp-img img {
        object-fit: cover;
      }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <amp-story standalone
               title="${escapedTitle}"
               publisher="Digital Home"
               publisher-logo-src="${publisherLogo}"
               poster-portrait-src="${coverImage}"
               poster-square-src="${coverImage}"
               poster-landscape-src="${coverImage}">
               
      <!-- Slide 1: Cover/Hook -->
      <amp-story-page id="slide1">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[0]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[0]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" animate-in="fade-in" animate-in-duration="0.4s">Vacancy Alert</span>
            <h1 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[0]?.heading || story.title)}</h1>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[0]?.text || story.title)}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 2: Eligibility -->
      <amp-story-page id="slide2">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[1]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[1]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" animate-in="fade-in" animate-in-duration="0.4s">Qualification</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[1]?.heading || 'Eligibility & Rules')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[1]?.text || 'Check qualification details in full article.')}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 3: Dates & Fees -->
      <amp-story-page id="slide3">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[2]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[2]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" animate-in="fade-in" animate-in-duration="0.4s">Important Dates</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[2]?.heading || 'Dates & Fees')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[2]?.text || 'Important application dates & fee details.')}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 4: Photo & Signature Tools Alert -->
      <amp-story-page id="slide4">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[3]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[3]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" style="background: linear-gradient(135deg, #059669, #10B981);" animate-in="fade-in" animate-in-duration="0.4s">Free Student Tools</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[3]?.heading || 'Form Photo & Signature Resizer')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[3]?.text || 'Photo aur signature size sahi karein taaki form reject na ho.')}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay">
          <a href="https://www.digitalhomeblog.in/tools">🛠️ Resize Photo & Signature Free</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- Slide 5: Call to Action -->
      <amp-story-page id="slide5">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[4]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[4]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer text-layer-center">
            <span class="badge badge-center" animate-in="fade-in" animate-in-duration="0.4s">Direct Link Active</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[4]?.heading || 'Apply Online Now')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[4]?.text || 'Click below to read full guide and apply.')}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay">
          <a href="${postUrl}">👉 Read Full Notification & Apply</a>
        </amp-story-page-outlink>
      </amp-story-page>
    </amp-story>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.send(ampHtml);
  } catch (err) {
    console.error('[WebStory Render] Error rendering AMP Story:', err);
    return next(err);
  }
}

// REST Controllers for Admin/API
async function getPublishedWebStories(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    const stories = await WebStory.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('post', 'title slug category')
      .lean();
    res.json({ success: true, data: stories, page, hasMore: stories.length === limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getWebStories(req, res) {
  try {
    const stories = await WebStory.find({}).sort({ createdAt: -1 }).populate('post', 'title slug category').lean();
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAdminWebStoryById(req, res) {
  try {
    const { id } = req.params;
    const story = await WebStory.findById(id).populate('post').lean();
    if (!story) return res.status(404).json({ error: 'Web Story not found' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createWebStory(req, res) {
  try {
    const { title, slug, postId, slides } = req.body;
    const newStory = new WebStory({ title, slug, post: postId, slides, status: 'published' });
    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateWebStory(req, res) {
  try {
    const { id } = req.params;
    const updated = await WebStory.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteWebStory(req, res) {
  try {
    const { id } = req.params;
    await WebStory.findByIdAndDelete(id);
    res.json({ message: 'Web Story deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function pingWebStoryIndexing(req, res) {
  try {
    const { id } = req.params;
    const story = await WebStory.findById(id).lean();
    if (!story) return res.status(404).json({ error: 'Web Story not found' });

    const { pingGoogleIndexing } = require('../../shared/utils/googleIndexing');
    const storyUrl = `https://www.digitalhomeblog.in/web-stories/${story.slug}`;
    const result = await pingGoogleIndexing(storyUrl, 'URL_UPDATED');

    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'SEO_INDEXING',
      level: 'SUCCESS',
      action: 'Google Index Ping (WebStory)',
      message: `Pinged Google Indexing API for WebStory "${story.title}"`
    });

    res.json({ success: true, url: storyUrl, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  renderWebStory,
  getPublishedWebStories,
  getWebStories,
  listAdminWebStories: getWebStories,
  getAdminWebStoryById,
  createWebStory,
  updateWebStory,
  updateAdminWebStory: updateWebStory,
  deleteWebStory,
  deleteAdminWebStory: deleteWebStory,
  pingWebStoryIndexing
};
