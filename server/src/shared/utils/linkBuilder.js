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

    // Generate Category-Aware Callout Text
    function getCategoryLinkCopy(category, title, url, isNewToOld = false) {
      const cat = (category || '').toLowerCase();
      if (cat.includes('tech') || cat.includes('ai') || cat.includes('tool')) {
        return isNewToOld
          ? `⚡ <strong>संबंधित टेक व AI गाइड:</strong> ${title} के उपयोगी फीचर्स और टिप्स जानने के लिए हमारी मुख्य गाइड <strong><a href="${url}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर पढ़ें!`
          : `💡 <strong>नवीनतम टेक व AI अपडेट:</strong> ${title} की पूरी स्टेप-बाय-स्टेप गाइड के लिए <strong><a href="${url}" style="color: #059669; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर देखें!`;
      }
      if (cat.includes('finance') || cat.includes('business') || cat.includes('money')) {
        return isNewToOld
          ? `💰 <strong>संबंधित निवेश व बैंकिंग गाइड:</strong> ${title} के नियम व लाभ समझने के लिए <strong><a href="${url}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${title}</a></strong> भी देखें!`
          : `📈 <strong>नवीनतम फाइनेंस गाइड:</strong> ${title} के बारे में विस्तार से जानने के लिए हमारी गाइड <strong><a href="${url}" style="color: #059669; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर पढ़ें!`;
      }
      if (cat.includes('health') || cat.includes('wellness') || cat.includes('fitness')) {
        return isNewToOld
          ? `🩺 <strong>संबंधित हेल्थ गाइड:</strong> ${title} से जुड़ी उपयोगी जानकारी के लिए <strong><a href="${url}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${title}</a></strong> भी देखें!`
          : `🌿 <strong>नवीनतम स्वास्थ्य एवं वेलनेस गाइड:</strong> ${title} के आसान उपाय व टिप्स जानने के लिए <strong><a href="${url}" style="color: #059669; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर पढ़ें!`;
      }
      if (cat.includes('news') || cat.includes('trend')) {
        return isNewToOld
          ? `🌐 <strong>संबंधित ट्रेंडिंग रिपोर्ट:</strong> ${title} का पूरा विश्लेषण समझने के लिए <strong><a href="${url}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${title}</a></strong> भी देखें!`
          : `📰 <strong>ट्रेंडिंग टॉपिक अपडेट:</strong> ${title} की पूरी रिपोर्ट और मुख्य आंकड़े जानने के लिए <strong><a href="${url}" style="color: #059669; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर पढ़ें!`;
      }
      return isNewToOld
        ? `📌 <strong>संबंधित मुख्य गाइड:</strong> ${title} के नियम, पात्रता और चयन प्रक्रिया से जुड़ी महत्वपूर्ण जानकारी के लिए <strong><a href="${url}" style="color: #2563eb; text-decoration: underline; font-weight: 700;">${title}</a></strong> भी जरूर देखें!`
        : `👉 <strong>नवीनतम भर्ती अपडेट:</strong> ${title} की पूरी जानकारी, महत्वपूर्ण तिथियां और ऑनलाइन आवेदन करने के लिए हमारी नई गाइड <strong><a href="${url}" style="color: #059669; text-decoration: underline; font-weight: 700;">${title}</a></strong> जरूर पढ़ें!`;
    }

    // 1. LINK OLD POST -> NEW POST (if not already linked)
    const oldHasNewLink = oldPost.content.toLowerCase().includes(cleanNewSlug);
    if (!oldHasNewLink) {
      console.log(`[SEO Silo Engine] Linking Authority Post "${oldPost.title}" -> New Post "${newPost.title}"`);
      
      const $old = cheerio.load(oldPost.content || '', null, false);
      const linkToNewHtml = `\n<p style="margin: 20px 0; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #10b981; background-color: #f0fdf4; font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #166534;">
  ${getCategoryLinkCopy(newPost.category, cleanNewTitle, newPostUrl, false)}
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
    const newHasOldLink = newPost.content.toLowerCase().includes(cleanOldSlug);
    if (!newHasOldLink) {
      console.log(`[SEO Silo Engine] Linking New Post "${newPost.title}" -> Authority Post "${oldPost.title}"`);

      const $new = cheerio.load(newPost.content || '', null, false);
      const linkToOldHtml = `\n<p style="margin: 20px 0; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #3b82f6; background-color: #eff6ff; font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #1e40af;">
  ${getCategoryLinkCopy(newPost.category, cleanOldTitle, oldPostUrl, true)}
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
