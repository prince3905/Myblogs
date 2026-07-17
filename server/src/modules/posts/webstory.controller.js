const mongoose = require('mongoose');

const WebStory = mongoose.model('WebStory');
const BlogPost = mongoose.model('BlogPost');

function catUrlSlug(category) {
  if (!category) return 'blog';
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog';
}

async function renderWebStory(req, res, next) {
  try {
    const { slug } = req.params;
    const story = await WebStory.findOne({ slug }).populate('post').lean();

    if (!story) {
      return res.status(404).send('Web Story not found');
    }

    // Direct preview for admins, or block drafted stories from indexing
    const isAdminPreview = req.query.preview === 'true';
    if (story.status !== 'published' && !isAdminPreview) {
      return res.status(404).send('Web Story is currently a draft');
    }

    // Increment view count in background
    WebStory.updateOne({ _id: story._id }, { $inc: { views: 1 } }).catch(err => {
      console.error('[WebStory Analytics] Failed to increment views:', err.message);
    });

    // Resolve post path details
    const categorySlug = catUrlSlug(story.post?.category);
    const postUrl = `https://www.digitalhomeblog.in/blog/${categorySlug}/${story.slug}`;
    const canonicalUrl = `https://www.digitalhomeblog.in/web-stories/${story.slug}`;

    const ampHtml = `<!doctype html>
<html amp lang="hi">
  <head>
    <meta charset="utf-8">
    <title>${story.title}</title>
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <meta name="robots" content="max-image-preview:large, index, follow">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${story.title}" />
    <meta property="og:description" content="${story.slides[0].text}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${story.slides[0].image}" />
    
    <!-- Twitter Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${story.title}" />
    <meta name="twitter:description" content="${story.slides[0].text}" />
    <meta name="twitter:image" content="${story.slides[0].image}" />

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
      amp-img img {
        object-fit: cover;
      }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <amp-story standalone
               title="${story.title}"
               publisher="Digital Home"
               publisher-logo-src="https://www.digitalhomeblog.in/logo.png"
               poster-portrait-src="${story.slides[0].image}">
               
      <!-- Slide 1: Cover/Hook -->
      <amp-story-page id="slide1">
        <amp-story-grid-layer template="fill">
          <amp-img src="${story.slides[0].image}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${story.slides[0].heading}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge">Vacancy Alert</span>
            <h1 class="slide-title" animate-in="fade-in" animate-in-duration="0.6s">${story.slides[0].heading}</h1>
            <p class="slide-desc" animate-in="fade-in" animate-in-delay="0.2s" animate-in-duration="0.6s">${story.slides[0].text}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 2: Eligibility -->
      <amp-story-page id="slide2">
        <amp-story-grid-layer template="fill">
          <amp-img src="${story.slides[1].image}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${story.slides[1].heading}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge">Qualification</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${story.slides[1].heading}</h2>
            <p class="slide-desc" animate-in="fade-in" animate-in-delay="0.2s" animate-in-duration="0.5s">${story.slides[1].text}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 3: Dates & Fees -->
      <amp-story-page id="slide3">
        <amp-story-grid-layer template="fill">
          <amp-img src="${story.slides[2].image}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${story.slides[2].heading}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge">Important Dates</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${story.slides[2].heading}</h2>
            <p class="slide-desc" animate-in="fade-in" animate-in-delay="0.2s" animate-in-duration="0.5s">${story.slides[2].text}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 4: Warning Tip -->
      <amp-story-page id="slide4">
        <amp-story-grid-layer template="fill">
          <amp-img src="${story.slides[3].image}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${story.slides[3].heading}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge">Alert Warning</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${story.slides[3].heading}</h2>
            <p class="slide-desc" animate-in="fade-in" animate-in-delay="0.2s" animate-in-duration="0.5s">${story.slides[3].text}</p>
          </div>
        </amp-story-grid-layer>
      </amp-story-page>

      <!-- Slide 5: Funnel CTA -->
      <amp-story-page id="slide5">
        <amp-story-grid-layer template="fill">
          <amp-img src="${story.slides[4].image}"
                   width="720" height="1280"
                   layout="responsive"
                   alt="${story.slides[4].heading}">
          </amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical">
          <div class="text-layer">
            <span class="badge">Official Links</span>
            <h2 class="slide-title" animate-in="fly-in-bottom" animate-in-duration="0.5s">${story.slides[4].heading}</h2>
            <p class="slide-desc" animate-in="fade-in" animate-in-delay="0.2s" animate-in-duration="0.5s">${story.slides[4].text}</p>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay">
          <a href="${postUrl}">Apply Online Now (यहाँ क्लिक करें)</a>
        </amp-story-page-outlink>
      </amp-story-page>
      
    </amp-story>
  </body>
</html>`;

    res.type('text/html');
    return res.send(ampHtml);

  } catch (err) {
    next(err);
  }
}

module.exports = { renderWebStory };
