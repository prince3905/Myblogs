const mongoose = require('mongoose');
const cheerio = require('cheerio');
const { notifyUrl } = require('./google-indexing');

/**
 * Advanced Bi-Directional SEO Silo Internal Link Builder
 * Connects high-authority indexed posts with new posts in both directions.
 * @param {Object} newPost - The newly published post document
 */
async function addTwoWayInternalLink(newPost) {
  if (!newPost || !newPost.category || newPost.status !== 'published') return;

  try {
    const BlogPost = mongoose.model('BlogPost');
    
    // Find the most popular/relevant published post in the same category (excluding the new post itself)
    const oldPost = await BlogPost.findOne({
      category: newPost.category,
      status: 'published',
      _id: { $ne: newPost._id }
    }).sort({ views: -1, publishedAt: -1 });

    if (!oldPost) {
      console.log(`[SEO Silo Engine] No older published post found in category: "${newPost.category}". Skipping.`);
      return;
    }

    const cleanNewSlug = newPost.slug.toLowerCase();
    const cleanOldSlug = oldPost.slug.toLowerCase();

    const catUrl = newPost.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newPostUrl = `/blog/${catUrl}/${newPost.slug}`;
    const oldPostUrl = `/blog/${catUrl}/${oldPost.slug}`;

    const cleanNewTitle = newPost.title.split(/[:|]/)[0].trim();
    const cleanOldTitle = oldPost.title.split(/[:|]/)[0].trim();

    // 1. LINK OLD POST -> NEW POST (if not already linked)
    const oldHasNewLink = oldPost.content.toLowerCase().includes(cleanNewSlug) || oldPost.content.includes('नवीनतम भर्ती अपडेट');
    if (!oldHasNewLink) {
      console.log(`[SEO Silo Engine] Linking Authority Post "${oldPost.title}" -> New Post "${newPost.title}"`);
      
      const $old = cheerio.load(oldPost.content || '', null, false);
      const linkToNewHtml = `\n<p style="margin: 20px 0; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #10b981; background-color: #f0fdf4; font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #166534;">
  👉 <strong>नवीनतम भर्ती अपडेट:</strong> ${cleanNewTitle} की पूरी जानकारी, महत्वपूर्ण तिथियां और ऑनलाइन आवेदन करने के लिए हमारी नई गाइड <strong><a href="${newPostUrl}" style="color: #059669; text-decoration: underline; font-weight: 700;">${cleanNewTitle}</a></strong> जरूर पढ़ें!
</p>\n`;

      const promoEmbed = $old('.ql-table-embed').filter((i, el) => {
        const html = $old(el).html();
        return html.includes('games-promo-block') || html.includes('brand-authority-block');
      }).first();

      if (promoEmbed.length > 0) {
        promoEmbed.before(linkToNewHtml);
      } else {
        $old.root().append(linkToNewHtml);
      }

      const updatedOldContent = $old.html();
      await BlogPost.updateOne({ _id: oldPost._id }, { $set: { content: updatedOldContent } });

      // Re-ping Google Indexing API for the authority post so Google bot re-crawls it immediately
      const fullOldUrl = `https://www.digitalhomeblog.in/blog/${catUrl}/${oldPost.slug}`;
      notifyUrl(fullOldUrl, 'URL_UPDATED').catch(() => {});
      console.log(`[SEO Silo Engine] Successfully linked & pinged Google for: "${oldPost.title}"`);
    }

    // 2. LINK NEW POST -> OLD POST (if not already linked)
    const newHasOldLink = newPost.content.toLowerCase().includes(cleanOldSlug) || newPost.content.includes('संबंधित मुख्य गाइड');
    if (!newHasOldLink) {
      console.log(`[SEO Silo Engine] Linking New Post "${newPost.title}" -> Authority Post "${oldPost.title}"`);

      const $new = cheerio.load(newPost.content || '', null, false);
      const linkToOldHtml = `\n<p style="margin: 20px 0; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #3b82f6; background-color: #eff6ff; font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #1e40af;">
  📌 <strong>संबंधित मुख्य गाइड:</strong> ${cleanOldTitle} के नियम, पात्रता और चयन प्रक्रिया से जुड़ी महत्वपूर्ण जानकारी के लिए <strong><a href="${oldPostUrl}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${cleanOldTitle}</a></strong> भी जरूर देखें!
</p>\n`;

      const promoEmbedNew = $new('.ql-table-embed').filter((i, el) => {
        const html = $new(el).html();
        return html.includes('games-promo-block') || html.includes('brand-authority-block');
      }).first();

      if (promoEmbedNew.length > 0) {
        promoEmbedNew.before(linkToOldHtml);
      } else {
        $new.root().append(linkToOldHtml);
      }

      const updatedNewContent = $new.html();
      await BlogPost.updateOne({ _id: newPost._id }, { $set: { content: updatedNewContent } });

      console.log(`[SEO Silo Engine] Successfully linked New Post to Authority Post: "${cleanOldTitle}"`);
    }
  } catch (err) {
    console.error('[SEO Silo Engine] Error during bi-directional link building:', err.message);
  }
}

module.exports = { addTwoWayInternalLink };
