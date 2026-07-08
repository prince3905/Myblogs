const mongoose = require('mongoose');
const cheerio = require('cheerio');

/**
 * Automatically edits the most recent published post in the same category
 * to link to the newly published post.
 * @param {Object} newPost - The newly published post document
 */
async function addTwoWayInternalLink(newPost) {
  if (!newPost || !newPost.category || newPost.status !== 'published') return;

  try {
    const BlogPost = mongoose.model('BlogPost');
    
    // Find the latest published post in the same category (excluding the new post itself)
    const oldPost = await BlogPost.findOne({
      category: newPost.category,
      status: 'published',
      _id: { $ne: newPost._id }
    }).sort({ publishedAt: -1, createdAt: -1 });

    if (!oldPost) {
      console.log(`[Two-Way Linking] No older published post found in category: "${newPost.category}". Skipping.`);
      return;
    }

    // Verify if oldPost already links to the new post to prevent duplication
    const cleanSlug = newPost.slug.toLowerCase();
    if (oldPost.content.toLowerCase().includes(cleanSlug)) {
      console.log(`[Two-Way Linking] Older post "${oldPost.title}" already links to "${newPost.title}". Skipping.`);
      return;
    }

    console.log(`[Two-Way Linking] Linking older post "${oldPost.title}" -> new post "${newPost.title}"`);

    let content = oldPost.content || '';
    const $ = cheerio.load(content, null, false);

    // Build the premium green-bordered link alert box
    const cleanNewTitle = newPost.title.split(/[:|]/)[0].trim();
    const catUrl = newPost.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newPostUrl = `/blog/${catUrl}/${newPost.slug}`;

    const linkHtml = `\n<p style="margin: 20px 0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981; background-color: #f0fdf4; font-family: inherit; font-size: 0.95rem; line-height: 1.6;">
  👉 <strong>नवीनतम भर्ती अपडेट:</strong> ${cleanNewTitle} की पूरी जानकारी, महत्वपूर्ण तिथियां और ऑनलाइन आवेदन करने के लिए हमारी नई गाइड <strong><a href="${newPostUrl}" style="color: #059669; text-decoration: none; font-weight: 700; border-bottom: 1px dashed #059669;">${cleanNewTitle}</a></strong> जरूर पढ़ें!
</p>\n`;

    // Find the first ql-table-embed that holds the games-promo-block or brand-authority-block to insert before it
    const promoEmbed = $('.ql-table-embed').filter((i, el) => {
      const html = $(el).html();
      return html.includes('games-promo-block') || html.includes('brand-authority-block');
    }).first();

    if (promoEmbed.length > 0) {
      promoEmbed.before(linkHtml);
    } else {
      $.root().append(linkHtml);
    }

    oldPost.content = $.html();
    
    // Save older post (this will trigger its pre-save formatters but not run linking again since it is already published and doesn't trigger the status-change notification block if we set a lock, but to be completely safe, we call markModified)
    oldPost.markModified('content');
    await oldPost.save();

    console.log(`[Two-Way Linking] Successfully linked and saved older post: "${oldPost.title}"`);
  } catch (err) {
    console.error('[Two-Way Linking] Error during link building:', err.message);
  }
}

module.exports = { addTwoWayInternalLink };
