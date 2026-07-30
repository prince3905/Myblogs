const mongoose = require('mongoose');
const { calculateSeoScore } = require('../../shared/utils/seoAuditor');
require('../liveAlerts/liveAlert.model');
require('./webstory.model');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 3000 },
    content: { type: String, required: true },
    featuredImage: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    seoKeywords: { type: [String], default: [] },
    focusKeyword: { type: String, trim: true, default: '' },
    seoScore: { type: Number, default: 0 },
    canonicalUrl: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, default: null },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    lastGscBoostAt: { type: Date, default: null },
    sponsored: { type: Boolean, default: false },
    affiliateDisclosure: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5, default: null },
    author: { type: String, trim: true, default: 'Harry Prince' },
    videoUrl: { type: String, trim: true, default: '' },
    translations: {
      en: {
        title: { type: String, default: '' },
        content: { type: String, default: '' },
        excerpt: { type: String, default: '' },
        seoTitle: { type: String, default: '' },
        seoDescription: { type: String, default: '' }
      }
    }
  },
  { timestamps: true }
);

blogPostSchema.pre('save', async function (next) {
  try {
    const post = this;

    // Mandatory Competitor Sanitizer: Scrub all competitor text & hidden links before ANY post is saved or published
    function purgeCompetitorTrace(str = '') {
      if (!str || typeof str !== 'string') return str;
      let cleaned = str;
      cleaned = cleaned.replace(/href=["']https?:\/\/(?:www\.)?sarkariresult\.com[^"']*["']/gi, 'href="https://www.digitalhomeblog.in/job-alerts"');
      cleaned = cleaned.replace(/href=["']https?:\/\/[^"']*sarkariresult[^"']*["']/gi, 'href="https://www.digitalhomeblog.in/job-alerts"');
      cleaned = cleaned
        .replace(/sarkari\s*result\s*official\s*(?:website|app|portal|tools?)/gi, 'Digital Home Official Portal')
        .replace(/sarkari\s*result\s*(?:tools?|resizer|cropper|compressor)/gi, 'Student Utility Tools')
        .replace(/sarkari\s*result/gi, 'Digital Home Portal')
        .replace(/sarkariresult/gi, 'Digital Home')
        .replace(/sarkari\s*resut/gi, 'Digital Home')
        .replace(/sarkari\s*reult/gi, 'Digital Home');
      cleaned = cleaned.replace(/www\.sarkariresult\.com/gi, 'www.digitalhomeblog.in');
      cleaned = cleaned.replace(/sarkariresult\.com/gi, 'digitalhomeblog.in');

      // Prettify Whitespace & Remove Faltu Symbols (#||:||, ||, ::, (Link: ), empty tags)
      cleaned = cleaned
        .replace(/#\|\|:\|\|/gi, '')
        .replace(/\|\|+/g, ' ')
        .replace(/::+/g, ':')
        .replace(/\s*\(Link:\s*\)/gi, '')
        .replace(/\s*\(Link:\s*([^\)]+)\)/gi, (match, p1) => {
          const uniqueLinks = Array.from(new Set(p1.split(',').map(l => l.trim()))).filter(Boolean);
          if (uniqueLinks.length === 0) return '';
          return ` (Link: ${uniqueLinks.join(', ')})`;
        })
        .replace(/<p>\s*(?:&nbsp;|<br\s*\/?>)?\s*<\/p>/gi, '')
        .replace(/<p>\s*:\s*<\/p>/gi, '')
        .replace(/<p>\s*\|+\s*<\/p>/gi, '')
        .replace(/\n{3,}/g, '\n\n');

      return cleaned;
    }

    if (post.title) post.title = purgeCompetitorTrace(post.title);
    if (post.excerpt) post.excerpt = purgeCompetitorTrace(post.excerpt);
    if (post.content) post.content = purgeCompetitorTrace(post.content);
    if (post.seoTitle) post.seoTitle = purgeCompetitorTrace(post.seoTitle);
    if (post.seoDescription) post.seoDescription = purgeCompetitorTrace(post.seoDescription);
    if (Array.isArray(post.tags)) {
      post.tags = post.tags.map(t => purgeCompetitorTrace(t));
    }

    // Water-Tight Pre-Save De-Duplication Interceptor: Prevent duplicate topic posts from EVER entering DB
    if (post.isNew) {
      const stopWords = [
        'online', 'form', 'recruitment', 'bharti', 'barti', 'apply', '2024', '2025', '2026', '2027',
        'various', 'post', 'posts', 'vacancies', 'vacancy', 'direct', 'link', 'step', 'process',
        'full', 'latest', 'news', 'admit', 'card', 'result', 'extended', 'notice', 'exam', 'now',
        'official', 'portal', 'website', 'notification', 'pdf', 'update', 'updates'
      ];
      const cleanTitle = (post.title || '').toLowerCase().replace(/[^a-z0-9\s]+/g, '');
      const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      const topicKey = titleWords.slice(0, 2).join(' ');

      if (topicKey && topicKey.length >= 3) {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const existingDup = await mongoose.model('BlogPost').findOne({
          _id: { $ne: post._id },
          publishedAt: { $gte: fourteenDaysAgo },
          $or: [
            { slug: new RegExp(topicKey.replace(/\s+/g, '-'), 'i') },
            { title: new RegExp(topicKey.replace(/\s+/g, '.*'), 'i') }
          ]
        });

        if (existingDup) {
          console.warn(`[Pre-Save De-Duplication Interceptor] Intercepted & Blocked duplicate DB save for topic "${topicKey}" (Existing Post ID: ${existingDup._id})`);
          const dupErr = new Error(`[Pre-Save De-Duplication Interceptor] Aborting DB Save: Post for topic "${topicKey}" already exists.`);
          dupErr.code = 'DUPLICATE_TOPIC_REJECTED';
          return next(dupErr);
        }
      }
    }

    if (post.content) {
      let content = post.content || '';

      // Auto-optimize image ALT tags for Google Image Search
      try {
        const { fixContentImagesSeo } = require('../../shared/utils/imageSeoFixer');
        const imgSeo = fixContentImagesSeo(content, post.title);
        content = imgSeo.content;
        post.content = content;
      } catch (imgErr) {}

      // Find the matched alert for metadata
      let boardName = 'Official Board';
      let lastDate = 'Check Details';
      let totalVacancy = 'विभिन्न पद (Various Posts)';

      try {
        const LiveAlert = mongoose.model('LiveAlert');
        const cleanTitle = post.title.split(/[:|]/)[0].trim();
        let alert = await LiveAlert.findOne({ title: cleanTitle });
        if (!alert) {
          alert = await LiveAlert.findOne({
            title: new RegExp(cleanTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
          });
        }

        if (alert) {
          if (alert.boardName) boardName = alert.boardName.trim();
          if (alert.lastDate) lastDate = alert.lastDate.trim();
          
          const vacancyMatch = post.title.match(/(\d+)\s*(?:Post|Vacancy|Vacancy|पद|भर्ती)/i) || 
                               alert.title.match(/(\d+)\s*(?:Post|Vacancy|Vacancy|पद|भर्ती)/i);
          if (vacancyMatch) {
            totalVacancy = vacancyMatch[1] + ' पद';
          } else {
            const detailsMatch = alert.detailsText && alert.detailsText.match(/(?:Total Post|Total Vacancy|Total Vacancies|कुल पद)[:\s]*(\d+)/i);
            if (detailsMatch) {
              totalVacancy = detailsMatch[1] + ' पद';
            }
          }
        }
      } catch (alertErr) {
        console.error('Failed to query LiveAlert for Highlights Box:', alertErr.message);
      }

      // Highlights Box HTML block
      const highlightsBoxHtml = `\n<div class="ql-table-embed">
<div class="quick-highlights-box" style="margin: 25px 0; padding: 20px; border-radius: 12px; border: 2px solid #3b82f6; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.08); text-align: left;">
  <h3 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 1.15rem; font-weight: 800; border: none; padding: 0; display: flex; align-items: center; gap: 8px;">
    📌 महत्वपूर्ण जानकारी (Quick Highlights)
  </h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
    <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
      <span style="display: block; font-size: 0.725rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">विभाग (Board)</span>
      <strong style="font-size: 0.925rem; color: #1e40af; display: block; margin-top: 4px; font-weight: 700;">${boardName}</strong>
    </div>
    <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
      <span style="display: block; font-size: 0.725rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">कुल पद (Total Vacancies)</span>
      <strong style="font-size: 0.925rem; color: #059669; display: block; margin-top: 4px; font-weight: 700;">${totalVacancy}</strong>
    </div>
    <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
      <span style="display: block; font-size: 0.725rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">अंतिम तिथि (Last Date)</span>
      <strong style="font-size: 0.925rem; color: #dc2626; display: block; margin-top: 4px; font-weight: 700;">${lastDate}</strong>
    </div>
  </div>
</div>
</div>\n`;

      // A. Convert markdown heading markers to HTML tags if leaked/unescaped
      content = content.replace(/<p>\s*##\s+(.*?)<\/p>/gi, '<h2>$1</h2>');
      content = content.replace(/<p>\s*###\s+(.*?)<\/p>/gi, '<h3>$1</h3>');
      content = content.replace(/<p>\s*####\s+(.*?)<\/p>/gi, '<h4>$1</h4>');
      content = content.replace(/^(?:<p>)?##\s+(.*?)(?:<\/p>)?$/gm, '<h2>$1</h2>');
      content = content.replace(/^(?:<p>)?###\s+(.*?)(?:<\/p>)?$/gm, '<h3>$1</h3>');

      // B. Convert markdown bold/italic tags to HTML strong/em
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');

      // C. Remove stray markdown table separators and triple pipes
      content = content.replace(/\|{2,}/g, '');
      content = content.replace(/\|-+\|/g, '');
      content = content.replace(/\|[\s-]*\|/g, '');

      // D. Fix stray list dashes and dots
      content = content.replace(/<p>\s*[-*•]\s+(.*?)<\/p>/gi, '<li>$1</li>');
      content = content.replace(/<p>\s*[-*•]\s+/gi, '<p>• ');

      // E. Clean up multiple empty lines, duplicate spacing, and trailing breaks
      content = content.replace(/(?:<p>&nbsp;<\/p>\s*){2,}/gi, '<p>&nbsp;</p>');
      content = content.replace(/(?:<p><br\s*\/?>\s*<\/p>\s*){2,}/gi, '<p><br></p>');
      content = content.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br>');
      content = content.replace(/[ \t]{3,}/g, ' '); // Normalize spaces but keep line breaks

      // F. Auto Interlink Engine: Ensure every post contains links to other relevant published posts
      if (!content.includes('related-posts-box')) {
        try {
          const recentOtherPosts = await mongoose.model('BlogPost').find({
            _id: { $ne: post._id },
            status: 'published'
          }).sort({ publishedAt: -1 }).limit(3).lean();

          if (recentOtherPosts && recentOtherPosts.length > 0) {
            const linksHtml = recentOtherPosts.map(p => {
              const catSlug = (p.category || 'sarkari-jobs-exams').toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const postUrl = `https://www.digitalhomeblog.in/blog/${catSlug}/${p.slug}`;
              return `<li style="margin-bottom: 6px;"><a href="${postUrl}" style="color: #2563eb; text-decoration: underline; font-weight: 600;" target="_blank" rel="noopener noreferrer">${p.title}</a></li>`;
            }).join('\n');

            const relatedBox = `\n<div class="ql-table-embed">\n<div class="related-posts-box" style="margin: 25px 0; padding: 15px 20px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px;">\n  <strong style="color: #1e293b; font-size: 1rem; display: block; margin-bottom: 8px;">📢 यह भी पढ़ें (Related Job Updates & News):</strong>\n  <ul style="margin: 0; padding-left: 20px; color: #2563eb;">\n${linksHtml}\n  </ul>\n</div>\n</div>\n`;

            content = content + relatedBox;
          }
        } catch (relErr) {
          console.error('Failed to append related posts interlinks:', relErr.message);
        }
      }

      content = content.replace(/<p>If you found this helpful, also check out our guide on[^]*?for more details.<\/p>\s*/gi, '');
      content = content.replace(/<p>For more information, read our article on[^]*?\.<\/p>\s*/gi, '');
      content = content.replace(/If you found this helpful, also check out our guide on[^]*?for more details\.\s*/gi, '');
      content = content.replace(/For more information, read our article on[^]*?\.\s*/gi, '');

      // 0. Remove any old quick highlights or promo blocks
      content = content.replace(/<div[^>]*class=["'](?:ql-table-embed\s+)?quick-highlights-box["'][^]*?<\/div>\s*<\/div>/gi, '');
      content = content.replace(/📌 महत्वपूर्ण जानकारी[^]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

      content = content.replace(/<div[^>]*class=["'](?:ql-table-embed\s+)?games-promo-block["'][^]*?<\/div>\s*<\/div>/gi, '');
      content = content.replace(/<div[^>]*games-promo-block[^]*?<\/div>/gi, '');
      content = content.replace(/🎮[^]*?Play Free Brain Booster Games Now 🚀/gi, '');
      content = content.replace(/<div[^>]*class=["']ql-table-embed["']>\s*<div[^>]*class=["']games-promo-block["'][^]*?<\/div>\s*<\/div>/gi, '');

      content = content.replace(/<div[^>]*class=["']brand-authority-block["'][^]*?<\/div>/gi, '');
      content = content.replace(/यह महत्वपूर्ण जानकारी[^]*?डिजिटल होम ब्लॉग[^]*?<\/div>/gi, '');
      content = content.replace(/<div[^>]*brand-authority-block[^]*?<\/div>/gi, '');
      content = content.replace(/<div[^>]*class=["']ql-table-embed["']>\s*<div[^>]*class=["']brand-authority-block["'][^]*?<\/div>\s*<\/div>/gi, '');

      // 1. Inject the highlights box after the first paragraph
      const firstPEnd = content.indexOf('</p>');
      if (firstPEnd !== -1) {
        content = content.slice(0, firstPEnd + 4) + '\n' + highlightsBoxHtml + '\n' + content.slice(firstPEnd + 4);
      } else {
        content = highlightsBoxHtml + '\n' + content;
      }

      // 2. Prettify and fix the "महत्वपूर्ण लिंक्स" (Important Links) buttons section
      const linksMatch = content.match(/<h2>महत्वपूर्ण लिंक्स<\/h2>([^]*?)(?=<h[23]>|$)/i);
      if (linksMatch) {
        const originalSection = linksMatch[1];
        const cheerio = require('cheerio');
        const $ = cheerio.load(originalSection, null, false);
        const anchors = $('a');
        if (anchors.length > 0) {
          const buttonHtmls = [];
          anchors.each((i, el) => {
            const href = $(el).attr('href') || '#';
            const text = $(el).text().trim();
            let btnClass = 'btn-website';
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes('apply') || lowerText.includes('आवेदन') || lowerText.includes('यहाँ क्लिक')) {
              btnClass = 'btn-apply';
            } else if (lowerText.includes('notification') || lowerText.includes('अधिसूचना') || lowerText.includes('pdf')) {
              btnClass = 'btn-notification';
            } else if (lowerText.includes('website') || lowerText.includes('वेबसाइट') || lowerText.includes('विजिट')) {
              btnClass = 'btn-website';
            } else if (lowerText.includes('syllabus') || lowerText.includes('पाठ्यक्रम')) {
              btnClass = 'btn-notification';
            } else if (lowerText.includes('resizer') || lowerText.includes('tool')) {
              btnClass = 'btn-website';
            }

            buttonHtmls.push(`<a href="${href}" class="btn-link-action ${btnClass}" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">${text}</a>`);
          });

          const newButtonsBlock = `\n<div class="ql-table-embed">\n<div class="action-buttons-group" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; align-items: flex-start;">\n${buttonHtmls.join('\n')}\n</div>\n</div>\n`;
          content = content.replace(originalSection, newButtonsBlock);
        }
      }

      // 3. Create fresh games promotion block
      const gamesPromo = `\n<div class="ql-table-embed">\n<div class="games-promo-block" style="margin: 30px 0; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb; background: linear-gradient(135deg, #fef08a 0%, #fef9c3 100%); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); text-align: left; position: relative; overflow: hidden;">
  <div style="display: flex; align-items: flex-start; gap: 16px;">
    <div style="font-size: 32px; line-height: 1;">🎮</div>
    <div>
      <h3 style="margin: 0 0 8px 0; color: #854d0e; font-size: 1.25rem; font-weight: 800; border: none; padding: 0;">Preschool Learning & Brain Booster Games for Kids!</h3>
      <p style="margin: 0 0 16px 0; color: #a16207; font-size: 0.95rem; line-height: 1.6; font-weight: 500;">
        Apne bacho ki concentration, memory, aur problem-solving skills ko boost karne ke liye humare <strong>100% Free & Ad-Free educational games</strong> ko try karein. Kids-friendly UI ke sath banaya gaya jo learning ko fun banata hai!
      </p>
      <a href="/games" style="display: inline-block; padding: 10px 20px; background: #ca8a04; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 6px -1px rgba(133, 77, 14, 0.2);">Play Free Brain Booster Games Now 🚀</a>
    </div>
  </div>
</div>\n</div>\n`;

      // 5. Create fresh brand authority block
      const brandPromo = `\n<div class="ql-table-embed">
<div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; font-family: inherit;'>
<p>यह महत्वपूर्ण जानकारी <strong><a href="/" style="margin: 2px 6px; display: inline-block; color: #4f46e5; text-decoration: none; font-weight: 700;">Digital Home Blog</a></strong> (डिजिटल होम ब्लॉग) द्वारा लाइव सिंक की गई है। हमारे पोर्टल पर आपको सबसे तेज <strong><a href="/" style="margin: 2px 6px; display: inline-block; color: #4f46e5; text-decoration: none; font-weight: 700;">Government Job Vacancy & Result 2026</a></strong>, लेटेस्ट सरकारी नौकरियां, एडमिट कार्ड और रिजल्ट्स के डायरेक्ट लिंक्स मिलते हैं। इसके साथ ही देश-दुनिया, टेक्नोलॉजी और हेल्थ से जुड़े महत्वपूर्ण आर्टिकल्स पढ़ने के लिए हमारे <strong><a href="/" style="margin: 2px 6px; display: inline-block; color: #4f46e5; text-decoration: none; font-weight: 700;">Home</a></strong> aur <strong><a href="/blog" style="margin: 2px 6px; display: inline-block; color: #4f46e5; text-decoration: none; font-weight: 700;">Blog</a></strong> सेक्शन को जरूर एक्सप्लोर करें।</p>
</div>\n</div>\n`;

      content += gamesPromo + brandPromo;

      // 6. Format and wrap tables cleanly using Cheerio
      const cheerio = require('cheerio');
      const $ = cheerio.load(content, null, false);
      $('table').each((i, table) => {
        $(table).addClass('comparison-table');
        $(table).attr('style', "width: 100%; border-collapse: collapse; margin: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #374151; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;");
        $(table).find('th').attr('style', "border: 1px solid #E5E7EB; padding: 12px 16px; text-align: left; font-weight: 600; color: #111827; background-color: #F9FAFB;");
        $(table).find('td').attr('style', "border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151;");
        
        if (!$(table).parent().hasClass('ql-table-embed')) {
          $(table).wrap('<div class="ql-table-embed"></div>');
        }
      });

      post.content = $.html();
    }

    // Ensure seoDescription is filled if not provided
    if (!post.seoDescription) {
      const contentClean = (post.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      post.seoDescription = contentClean.slice(0, 145) || post.excerpt || '';
    }
    // Calculate SEO score if not explicitly set
    if (!post.seoScore) {
      const audit = calculateSeoScore({
        title: post.title,
        content: post.content,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        slug: post.slug,
        tags: post.tags,
        excerpt: post.excerpt,
        canonicalUrl: post.canonicalUrl,
        focusKeyword: post.focusKeyword
      });
      post.seoScore = audit.score || 0;
      if (!post.focusKeyword && audit.focusKeyword) {
        post.focusKeyword = audit.focusKeyword;
      }
    }
  } catch (err) {
    console.error('Error calculating seoScore in post pre-save hook:', err.message);
  }
  next();
});

blogPostSchema.post('save', async function (doc) {
  // Sync associated WebStory status (draft vs published)
  try {
    const WebStory = mongoose.model('WebStory');
    await WebStory.updateMany({ post: doc._id }, { $set: { status: doc.status } });
  } catch (storyErr) {
    console.error('[WebStory Sync] Failed to sync status in post-save hook:', storyErr.message);
  }

  if (doc.status === 'published') {
    // 1. 360° Universal Auto-Indexing Notification (Google Indexing API + IndexNow + Sitemap Pings)
    try {
      const { notifyAllIndexing } = require('../../shared/utils/google-indexing');
      const { logAutomation } = require('../../shared/utils/automationLogger');
      const catUrl = (doc.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
      const postUrl = `https://www.digitalhomeblog.in/blog/${catUrl}/${doc.slug}`;
      console.log(`[Auto-Indexing Pipeline] Triggering 360° pings for published post: ${postUrl}`);
      
      notifyAllIndexing(postUrl, 'URL_UPDATED')
        .then(({ google, indexNow }) => {
          logAutomation({
            service: 'SEO_INDEXING',
            level: 'SUCCESS',
            action: '360° Auto-Index Dispatch',
            message: `Dispatched instant index pings (Google & IndexNow) for published post "${doc.title}"`,
            metadata: { title: doc.title, url: postUrl, google: google?.success, indexNow: indexNow?.success }
          });
        })
        .catch(err => {
          console.warn('[Auto-Indexing Pipeline] Notice:', err.message);
        });
    } catch (err) {
      console.error('[Auto-Indexing Pipeline] Failed in post-save index notifier:', err.message);
    }

    // 2. Two-Way Internal Linking Builder
    try {
      require('../settings/settings.model'); // Ensure Settings model schema is loaded
      const Settings = mongoose.model('Settings');
      const linkSetting = await Settings.findOne({ key: 'disableTwoWayLinking' });
      const isLinkDisabled = linkSetting ? linkSetting.value === true : false; // Default to active (false)
      
      if (isLinkDisabled) {
        console.log('[Two-Way Linking] Auto-linking skipped: Two-Way Internal Linking is disabled in settings.');
      } else {
        const { addTwoWayInternalLink } = require('../../shared/utils/linkBuilder');
        await addTwoWayInternalLink(doc);
      }
    } catch (linkErr) {
      console.error('[Two-Way Linking] Failed in post-save linking builder:', linkErr.message);
    }

    // 4. Auto Image ALT SEO Telemetry Log
    try {
      const { logAutomation } = require('../../shared/utils/automationLogger');
      logAutomation({
        service: 'SEO_INDEXING',
        level: 'SUCCESS',
        action: 'Auto Image ALT SEO Fix',
        message: `Auto-optimized image ALT tags for Google Image Search: "${doc.title}"`,
        metadata: { title: doc.title }
      });
    } catch (logErr) {}

    // 3. Meta WhatsApp Cloud API Auto-Broadcast Trigger (Temporarily Disabled by User Request)
    /*
    try {
      const { sendWhatsappChannelMessage } = require('../../shared/services/whatsappService');
      sendWhatsappChannelMessage(doc).catch(err => {
        console.warn('[WhatsApp Auto-Broadcast] Post-save trigger notice:', err.message);
      });
    } catch (waErr) {}
    */
  }
});

blogPostSchema.post('remove', async function (doc) {
  try {
    const WebStory = mongoose.model('WebStory');
    await WebStory.deleteMany({ post: doc._id });
  } catch (err) {
    console.error('[WebStory Delete] Failed to clean up story on post remove:', err.message);
  }
});

blogPostSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const WebStory = mongoose.model('WebStory');
      await WebStory.deleteMany({ post: doc._id });
    } catch (err) {
      console.error('[WebStory Delete] Failed to clean up story on post findOneAndDelete:', err.message);
    }
  }
});

blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogPostSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
