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

// Traffic and Referrer Intelligence Parser
function parseTrafficContext(req) {
  const userAgent = (req.get('user-agent') || '').toLowerCase();
  const rawReferer = (req.get('referrer') || req.get('referer') || '').trim();
  const refLower = rawReferer.toLowerCase();
  
  // 1. Detect if Bot / Search Crawler
  const isBot = /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkshare|w3c_validator|crawler|spider|bot|lighthouse|headlesschrome|curl|python-requests|node-fetch|postman/i.test(userAgent);

  // 2. Detect Device
  let device = 'Mobile';
  if (/tablet|ipad/i.test(userAgent)) {
    device = 'Tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    device = 'Mobile';
  } else {
    device = 'Desktop';
  }

  // 3. Detect Source
  let source = 'Direct / App';
  let sourceKey = 'direct';

  if (isBot) {
    source = 'Googlebot / Web Crawler';
    sourceKey = 'bots';
  } else if (
    refLower.includes('googlequicksearchbox') ||
    refLower.includes('android-app://com.google.android.googlequicksearchbox') ||
    refLower.includes('com.google.android.apps.searchlite') ||
    refLower.includes('amp-web-story') ||
    (refLower.includes('google.') && (refLower.includes('amp') || refLower.includes('discover') || refLower.includes('feed')))
  ) {
    source = 'Google Discover';
    sourceKey = 'googleDiscover';
  } else if (refLower.includes('google.') || refLower.includes('bing.') || refLower.includes('yahoo.') || refLower.includes('duckduckgo.')) {
    source = 'Google Search';
    sourceKey = 'googleSearch';
  } else if (refLower.includes('digitalhomeblog.in') || refLower.includes('localhost') || refLower.includes('127.0.0.1')) {
    source = 'Website Homepage';
    sourceKey = 'internalWebsite';
  } else if (refLower.includes('whatsapp') || refLower.includes('android-app://com.whatsapp')) {
    source = 'WhatsApp';
    sourceKey = 'social';
  } else if (refLower.includes('telegram') || refLower.includes('org.telegram') || refLower.includes('t.me')) {
    source = 'Telegram';
    sourceKey = 'social';
  } else if (refLower.includes('facebook') || refLower.includes('instagram') || refLower.includes('twitter') || refLower.includes('t.co') || refLower.includes('linkedin')) {
    source = 'Social Media';
    sourceKey = 'social';
  } else if (rawReferer) {
    try {
      const urlObj = new URL(rawReferer);
      source = urlObj.hostname.replace(/^www\./, '');
      sourceKey = 'direct';
    } catch {
      source = 'External Link';
      sourceKey = 'direct';
    }
  } else {
    source = 'Direct / App';
    sourceKey = 'direct';
  }

  // Masked IP for privacy
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const clientIp = Array.isArray(rawIp) ? rawIp[0] : (rawIp.split(',')[0] || '').trim();
  const maskedIp = clientIp.includes('.') 
    ? clientIp.split('.').slice(0, 2).join('.') + '.xxx.xxx' 
    : (clientIp ? 'IP-Protected' : 'Anonymous');

  const country = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || 'India';

  return { isBot, device, source, sourceKey, rawReferer, maskedIp, country };
}

// Background Story View & Referrer Analytics Recorder
async function recordStoryView(storyId, req, extraSource = null) {
  try {
    const traffic = parseTrafficContext(req);
    const isAdminPreview = req.query.preview === 'true';
    if (isAdminPreview) return;

    const updateOps = {};
    if (traffic.isBot) {
      updateOps.$inc = { 'trafficSources.bots': 1 };
    } else {
      const finalSource = extraSource || traffic.source;
      const finalKey = extraSource === 'Google Discover (AMP Cache)' 
        ? 'googleDiscover' 
        : extraSource === 'Website Reels Player'
        ? 'internalWebsite'
        : traffic.sourceKey;
      
      updateOps.$inc = {
        views: 1,
        [`trafficSources.${finalKey}`]: 1,
        [`devices.${traffic.device.toLowerCase()}`]: 1
      };
      
      updateOps.$push = {
        recentReferrers: {
          $each: [{
            source: finalSource,
            rawReferer: (req.query.ref || traffic.rawReferer || '').substring(0, 250),
            device: traffic.device,
            country: traffic.country,
            city: req.headers['cf-ipcity'] || '',
            ip: traffic.maskedIp,
            timestamp: new Date()
          }],
          $slice: -30
        }
      };
    }

    await WebStory.updateOne({ _id: storyId }, updateOps);
  } catch (err) {
    console.error('[WebStory Analytics] Failed to record view:', err.message);
  }
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

    // Record view & traffic analytics in background
    recordStoryView(story._id, req);

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
      "isAccessibleForFree": "true",
      "articleSection": "Government Jobs & Sarkari Naukri",
      "keywords": "${escapedTitle}, Sarkari Naukri, Online Form 2026, Government Jobs",
      "author": {
        "@type": "Organization",
        "name": "Global Careers Intelligence Desk",
        "url": "https://www.digitalhomeblog.in"
      },
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
    <script async custom-element="amp-story-auto-ads" src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"></script>
    <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
    
    <style amp-custom>
      amp-story-page {
        background-color: #000;
        font-family: 'Outfit', -apple-system, sans-serif;
      }
      .text-layer {
        padding: 30px 24px 60px 24px;
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
      .badge-live {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        box-shadow: 0 3px 10px rgba(220,38,38,0.5);
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
      .next-pill {
        margin-top: 14px;
        font-size: 13px;
        font-weight: 800;
        color: #fde047;
        background: rgba(0,0,0,0.65);
        padding: 8px 18px;
        border-radius: 9999px;
        border: 1px solid rgba(253,224,71,0.5);
        display: inline-block;
        letter-spacing: 0.02em;
        text-shadow: 0 1px 3px rgba(0,0,0,0.9);
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
               
      <!-- Google AdSense Auto-Ads between story slides -->
      <amp-story-auto-ads>
        <script type="application/json">
        {
          "ad-attributes": {
            "type": "adsense",
            "data-ad-client": "ca-pub-7044184444698366",
            "data-ad-slot": "auto"
          }
        }
        </script>
      </amp-story-auto-ads>

      <!-- Slide 1: Cover/Hook (Auto-Advance 5s) -->
      <amp-story-page id="slide1" auto-advance-after="5s">
        <amp-story-grid-layer template="fill">
          <amp-img src="${coverImage}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[0]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge badge-live" animate-in="fade-in" animate-in-duration="0.4s">🔥 Live Vacancy Alert</span>
            <h1 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[0]?.heading || story.title)}</h1>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[0]?.text || story.title)}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay" theme="dark">
          <a href="${postUrl}">📢 पूरी भर्ती विवरण व कुल पद चेक करें</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- Slide 2: Eligibility (Auto-Advance 6s) -->
      <amp-story-page id="slide2" auto-advance-after="6s">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[1]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[1]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" animate-in="fade-in" animate-in-duration="0.4s">📋 Eligibility & Age Limit</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[1]?.heading || 'Eligibility & Rules')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[1]?.text || 'Check qualification details in full article.')}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay" theme="dark">
          <a href="${postUrl}">📋 शैक्षणिक योग्यता व आयु सीमा देखें</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- Slide 3: Dates & Fees (Auto-Advance 6s) -->
      <amp-story-page id="slide3" auto-advance-after="6s">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[2]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[2]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" animate-in="fade-in" animate-in-duration="0.4s">📅 Dates & Application Fee</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[2]?.heading || 'Dates & Fees')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[2]?.text || 'Important application dates & fee details.')}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay" theme="dark">
          <a href="${postUrl}">📅 अंतिम तिथि व फीस विवरण देखें</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- Slide 4: Photo & Signature Tools Alert (Auto-Advance 6s) -->
      <amp-story-page id="slide4" auto-advance-after="6s">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[3]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[3]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge" style="background: linear-gradient(135deg, #059669, #10B981);" animate-in="fade-in" animate-in-duration="0.4s">🛠️ Free Student Tools</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[3]?.heading || 'Form Photo & Signature Resizer')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[3]?.text || 'Photo aur signature size sahi karein taaki form reject na ho.')}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay" theme="dark">
          <a href="https://www.digitalhomeblog.in/tools">🛠️ Resize Photo & Signature (Free Online)</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- Slide 5: Call to Action (Long Hold 15s) -->
      <amp-story-page id="slide5" auto-advance-after="15s">
        <amp-story-grid-layer template="fill">
          <amp-img src="${formatAmpUrl(story.slides?.[4]?.image)}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${escapeXml(story.slides?.[4]?.heading || story.title)}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer text-layer-center">
            <span class="badge badge-center badge-live" animate-in="fade-in" animate-in-duration="0.4s">⚡ 100% Direct Official Link</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${escapeXml(story.slides?.[4]?.heading || 'Apply Online Now')}</h2>
            <p class="slide-desc" animate-in="fly-in-bottom" animate-in-duration="0.6s" animate-in-delay="0.1s">${escapeXml(story.slides?.[4]?.text || 'Click below to read full guide, syllabus and apply.')}</p>
            <div class="next-pill" animate-in="fade-in" animate-in-duration="0.5s" animate-in-delay="0.2s">⏭️ स्वाइप करें अगली भर्ती देखने के लिए ➔</div>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay" theme="dark">
          <a href="${postUrl}">👉 आधिकारिक नोटिफिकेशन PDF व ऑनलाइन फॉर्म</a>
        </amp-story-page-outlink>
      </amp-story-page>

      <!-- AMP Analytics for Google Discover & AMP Cache View Tracking -->
      <amp-analytics>
        <script type="application/json">
        {
          "requests": {
            "pageview": "https://www.digitalhomeblog.in/api/public/web-stories/${story.slug}/amp-ping?ref=\${documentReferrer}&source=amp-cache"
          },
          "triggers": {
            "trackStoryView": {
              "on": "story-page-visible",
              "request": "pageview"
            }
          }
        }
        </script>
      </amp-analytics>

      <!-- Google AMP Story Bookend (Next Job Reels - Must be the last child of amp-story) -->
      <amp-story-bookend src="https://www.digitalhomeblog.in/api/public/web-stories/${story.slug}/bookend.json" layout="nodisplay"></amp-story-bookend>
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

// AMP Analytics ping receiver (for Google AMP Cache viewers)
async function pingAmpAnalytics(req, res) {
  try {
    const { slug } = req.params;
    const story = await WebStory.findOne({
      $or: [
        { slug: slug },
        ...(mongoose.isValidObjectId(slug) ? [{ _id: slug }] : [])
      ]
    }).select('_id');
    
    if (story) {
      const sourceOverride = req.query.source === 'website-reels'
        ? 'Website Reels Player'
        : 'Google Discover (AMP Cache)';
      recordStoryView(story._id, req, sourceOverride);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  } catch (err) {
    return res.status(204).end();
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const [stories, total] = await Promise.all([
      WebStory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('post', 'title slug category')
        .lean(),
      WebStory.countDocuments(query)
    ]);

    res.json({
      success: true,
      stories,
      data: stories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
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

    const { notifyUrl } = require('../../shared/utils/google-indexing');
    const storyUrl = `https://www.digitalhomeblog.in/web-stories/${story.slug}`;
    const result = await notifyUrl(storyUrl, 'URL_UPDATED');

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

// Google AMP Web Story Bookend Endpoint (Chains next stories for Google Discover & AMP Viewer)
async function getWebStoryBookend(req, res) {
  try {
    const { slug } = req.params;
    const currentStory = await WebStory.findOne({
      $or: [{ slug: slug }, ...(mongoose.isValidObjectId(slug) ? [{ _id: slug }] : [])]
    }).select('_id createdAt').lean();

    const otherStories = await WebStory.find({
      status: 'published',
      _id: { $ne: currentStory?._id }
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('title slug slides createdAt')
      .lean();

    const components = [
      {
        type: 'heading',
        text: '🔥 अगली सरकारी भर्तियां (Next Job Reels)'
      }
    ];

    otherStories.forEach(s => {
      components.push({
        type: 'landscape',
        title: s.title,
        url: `https://www.digitalhomeblog.in/web-stories/${s.slug}`,
        image: s.slides?.[0]?.image || 'https://www.digitalhomeblog.in/logo.png',
        category: 'Sarkari Job Alert'
      });
    });

    components.push({
      type: 'cta-link',
      links: [
        {
          text: '🌐 सभी लाइव सरकारी नौकरियां देखें (Official)',
          url: 'https://www.digitalhomeblog.in/'
        }
      ]
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    return res.json({
      bookendVersion: 'v1.0',
      shareProviders: ['whatsapp', 'telegram', 'facebook', 'twitter'],
      components
    });
  } catch (err) {
    console.error('[WebStory Bookend] Error generating bookend:', err.message);
    return res.status(500).json({ error: 'Failed to generate bookend' });
  }
}

module.exports = {
  renderWebStory,
  pingAmpAnalytics,
  getWebStoryBookend,
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
