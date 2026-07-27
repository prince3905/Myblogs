const cheerio = require('cheerio');
const { logAutomation } = require('./automationLogger');

/**
 * Automatically scans article HTML content:
 * 1. Removes broken/empty/placeholder image tags (src missing, undefined, null, broken 404 boxes).
 * 2. Optimizes all valid <img> ALT tags for Google Image Search ranking.
 */
function fixContentImagesSeo(content, title) {
  if (!content || typeof content !== 'string' || !content.includes('<img')) {
    return { content: content || '', fixedCount: 0, removedCount: 0 };
  }

  const cleanTitle = (title || 'Sarkari Job Alert').trim().replace(/<\/?[^>]+>/g, '');
  if (!cleanTitle) return { content: content || '', fixedCount: 0, removedCount: 0 };

  try {
    const $ = cheerio.load(content, null, false);
    const imgs = $('img');
    let fixedCount = 0;
    let removedCount = 0;

    imgs.each((idx, elem) => {
      const $img = $(elem);
      const src = ($img.attr('src') || '').trim();
      let alt = $img.attr('alt');

      // 1. Check if image source is broken, missing, or empty
      const isBrokenSrc = !src || 
                          src === '#' || 
                          src === 'undefined' || 
                          src === 'null' || 
                          src.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') ||
                          src.includes('placeholder') ||
                          src.includes('broken-image');

      if (isBrokenSrc) {
        $img.remove();
        removedCount++;
        return;
      }

      // 2. Fix missing or generic ALT tags
      const isGeneric = !alt || !alt.trim() || ['image', 'img', 'photo', 'placeholder', 'pic', 'thumbnail', 'undefined', 'null'].includes(alt.toLowerCase().trim());

      if (isGeneric) {
        let optimizedAlt = cleanTitle;
        if (idx > 0) {
          optimizedAlt += ` details ${idx + 1}`;
        }
        $img.attr('alt', optimizedAlt);
        fixedCount++;
      }
    });

    return {
      content: $.html(),
      fixedCount,
      removedCount
    };
  } catch (err) {
    console.warn('[Image SEO Fixer] Notice:', err.message);
    return { content: content || '', fixedCount: 0, removedCount: 0 };
  }
}

module.exports = { fixContentImagesSeo };
