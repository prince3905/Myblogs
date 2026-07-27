const cheerio = require('cheerio');
const { logAutomation } = require('./automationLogger');

/**
 * Automatically scans article HTML content and optimizes all <img> ALT tags
 * for Google Image Search ranking using post title & key topics.
 */
function fixContentImagesSeo(content, title) {
  if (!content || typeof content !== 'string' || !content.includes('<img')) {
    return { content, fixedCount: 0 };
  }

  const cleanTitle = (title || 'Sarkari Job Alert').trim().replace(/<\/?[^>]+>/g, '');
  if (!cleanTitle) return { content, fixedCount: 0 };

  try {
    const $ = cheerio.load(content, null, false);
    const imgs = $('img');
    let fixedCount = 0;

    imgs.each((idx, elem) => {
      const $img = $(elem);
      let alt = $img.attr('alt');

      // Check if alt is missing, empty, or generic
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
      fixedCount
    };
  } catch (err) {
    console.warn('[Image SEO Fixer] Notice:', err.message);
    return { content, fixedCount: 0 };
  }
}

module.exports = { fixContentImagesSeo };
