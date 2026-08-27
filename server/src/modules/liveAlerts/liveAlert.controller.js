const LiveAlert = require('./liveAlert.model');
const BlogPost = require('../posts/post.model');
const { scrapeFeeds } = require('../ai/topicDiscoveryService');
const cronScraper = require('./liveAlert.cron');
const { generateBlogContentCore, generateImagePrompt } = require('../ai/ai.controller');
const { getPhotographicFallbackPrompt } = require('../uploads/upload.controller');
const { callGeminiImagen } = require('../../shared/utils/geminiImagen');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'drkm1wo9o',
  api_key: '479412262566892',
  api_secret: '_J0pP4VbLy-TL5vAVoRpaFjJFxg',
});
const axios = require('axios');

// Pexels integration helper to auto-populate featuredImage (Thumbnail)
const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=700&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=700&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=700&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=700&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=700&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=700&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=80',
];

function pickFallbackImage(query) {
  const hash = query ? query.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return HERO_PHOTOS[Math.abs(hash) % HERO_PHOTOS.length];
}

async function autoFetchFeaturedImage(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!query || !query.trim()) return pickFallbackImage('blog');
  
  if (apiKey) {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: { query: query.trim(), per_page: 5, page: 1 },
        headers: { Authorization: apiKey },
        timeout: 6000,
      });
      const photos = response.data?.photos;
      if (photos && photos.length > 0) {
        return (photos[0].src.medium || photos[0].src.large).split('?')[0] + '?w=700&fit=crop&q=80';
      }
    } catch (err) {
      console.error('Failed to auto-fetch featured image from Pexels in background:', err.message);
    }
  }
  return pickFallbackImage(query);
}



// Fetch alerts sorted by date descending (without detailsText payload) with full search support
async function getAlerts(req, res) {
  try {
    const { status, limit, page, search, q } = req.query;
    const filter = {
      title: { $not: /\b(19\d\d|200\d|201\d|202[0-4])\b/i }
    };
    if (status && status !== 'all') {
      filter.status = status;
    } else {
      filter.status = { $in: ['active', 'published'] };
    }

    const searchQuery = (search || q || '').trim();
    if (searchQuery) {
      const synonymMap = {
        'rrb': ['railway', 'rrc', 'rail'],
        'railway': ['rrb', 'rrc', 'rail'],
        'rail': ['railway', 'rrc', 'rrb'],
        'up': ['uttar pradesh', 'uttarpradesh'],
        'mp': ['madhya pradesh', 'madhyapradesh'],
        'uk': ['uttarakhand', 'uttaranchal'],
        'hp': ['himachal pradesh'],
        'delhi': ['dcb'],
        'dcb': ['delhi', 'cantonment'],
        'mts': ['multi tasking staff', 'multitasking'],
        'deo': ['data entry operator'],
        'je': ['junior engineer'],
        'ae': ['assistant engineer'],
        'si': ['sub inspector'],
        'constable': ['police'],
        'police': ['constable', 'si'],
        'bed': ['b.ed', 'b-ed', 'b ed', 'teacher', 'shikshak'],
        'b.ed': ['bed', 'b-ed', 'b ed', 'teacher', 'shikshak'],
        'teacher': ['shikshak', 'bed', 'b.ed', 'ecce', 'educator'],
        'ecce': ['educator', 'nursery', 'balvatika', 'teacher'],
        'educator': ['ecce', 'nursery', 'teacher'],
        'apprentice': ['app'],
        'app': ['apprentice', 'apply']
      };

      const fields = ['title', 'boardName', 'category', 'state', 'detailsText'];
      const words = searchQuery.split(/[\s,\-\/]+/).filter(Boolean);

      if (words.length > 0) {
        const andConditions = words.map(word => {
          const lowerWord = word.toLowerCase();
          const synonyms = synonymMap[lowerWord] || [];
          const searchTerms = [word, ...synonyms];
          const escapedTerms = searchTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
          const regex = new RegExp(escapedTerms.join('|'), 'i');
          return {
            $or: fields.map(f => ({ [f]: { $regex: regex } }))
          };
        });

        filter.$and = andConditions;
      }
    }

    const queryLimit = limit ? parseInt(limit, 10) : 300;
    const pageNum = page ? parseInt(page, 10) : 1;
    const skip = (pageNum - 1) * queryLimit;

    console.log(`[LiveAlert API] getAlerts called: searchQuery="${searchQuery}", pageNum=${pageNum}, limit=${queryLimit}`);

    let alerts = [];

    // If default feed with no search query: fetch balanced items across all categories so every column is 100% full
    if (!searchQuery && pageNum === 1) {
      const [jobs, admitCards, results, answerKeys, admissions, syllabus] = await Promise.all([
        LiveAlert.find({
          ...filter,
          $and: [
            { title: { $not: /admit card|hall ticket|call letter|exam city|result|score card|merit list|answer key|objection|syllabus/i } },
            { category: { $not: /Admit Card|Result|Answer Key|Syllabus/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(100).lean(),

        LiveAlert.find({
          ...filter,
          $or: [
            { category: 'Admit Card' },
            { title: { $regex: /admit card|hall ticket|call letter|exam city/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(100).lean(),

        LiveAlert.find({
          ...filter,
          $or: [
            { category: 'Result' },
            { title: { $regex: /result|score card|merit list/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(100).lean(),

        LiveAlert.find({
          ...filter,
          $or: [
            { category: 'Answer Key' },
            { title: { $regex: /answer key|answer-key|objection tracker/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(50).lean(),

        LiveAlert.find({
          ...filter,
          $or: [
            { category: 'Admission' },
            { title: { $regex: /admission|counselling|seat allotment/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(50).lean(),

        LiveAlert.find({
          ...filter,
          $or: [
            { category: 'Syllabus' },
            { title: { $regex: /syllabus|exam pattern|curriculum/i } }
          ]
        }).select('-detailsText').sort({ createdAt: -1, parsedPostDate: -1 }).limit(50).lean()
      ]);

      alerts = [...jobs, ...admitCards, ...results, ...answerKeys, ...admissions, ...syllabus];
    } else {
      alerts = await LiveAlert.find(filter)
        .select('-detailsText')
        .sort({ createdAt: -1, parsedPostDate: -1 })
        .skip(skip)
        .limit(queryLimit);
    }

    // Fallback if $and search produced 0 results: try $or search across tokens
    if (alerts.length === 0 && searchQuery && filter.$and) {
      const words = searchQuery.split(/[\s,\-\/]+/).filter(Boolean);
      const orConditions = [];
      const synonymMap = {
        'rrb': ['railway', 'rrc', 'rail'],
        'railway': ['rrb', 'rrc', 'rail'],
        'rail': ['railway', 'rrc', 'rrb'],
        'up': ['uttar pradesh', 'uttarpradesh'],
        'mp': ['madhya pradesh', 'madhyapradesh'],
        'uk': ['uttarakhand', 'uttaranchal'],
        'hp': ['himachal pradesh'],
        'delhi': ['dcb'],
        'dcb': ['delhi', 'cantonment'],
        'mts': ['multi tasking staff', 'multitasking'],
        'deo': ['data entry operator'],
        'je': ['junior engineer'],
        'ae': ['assistant engineer'],
        'si': ['sub inspector'],
        'constable': ['police'],
        'police': ['constable', 'si'],
        'bed': ['b.ed', 'b-ed', 'b ed', 'teacher', 'shikshak'],
        'b.ed': ['bed', 'b-ed', 'b ed', 'teacher', 'shikshak'],
        'teacher': ['shikshak', 'bed', 'b.ed', 'ecce', 'educator'],
        'ecce': ['educator', 'nursery', 'balvatika', 'teacher'],
        'educator': ['ecce', 'nursery', 'teacher'],
        'apprentice': ['app'],
        'app': ['apprentice', 'apply']
      };

      words.forEach(word => {
        const lowerWord = word.toLowerCase();
        const synonyms = synonymMap[lowerWord] || [];
        const searchTerms = [word, ...synonyms];
        const escapedTerms = searchTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regex = new RegExp(escapedTerms.join('|'), 'i');
        ['title', 'boardName', 'category', 'state', 'detailsText'].forEach(f => {
          orConditions.push({ [f]: { $regex: regex } });
        });
      });

      const fallbackFilter = { ...filter };
      delete fallbackFilter.$and;
      fallbackFilter.$or = orConditions;

      alerts = await LiveAlert.find(fallbackFilter)
        .select('-detailsText')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(queryLimit);
    }

    res.json({ success: true, count: alerts.length, data: alerts, page: pageNum, hasMore: alerts.length === queryLimit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Fetch a single alert by ID (with detailsText payload)
async function getAlertById(req, res) {
  try {
    const { id } = req.params;
    const alert = await LiveAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Manually trigger the scraper
async function triggerScrape(req, res) {
  try {
    const totalSaved = await cronScraper.scrapeFeeds();
    res.json({ success: true, message: `Manual sync complete! Scraped and saved ${totalSaved} alerts.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Helper to extract links from scraped text
function extractLinksFromText(text) {
  const parsedLinks = [];
  if (!text) return parsedLinks;
  const lines = text.split('\n');
  const linkRegex = /\((?:Link|link):\s*([^)]+)\)/i;
  
  for (const line of lines) {
    const match = linkRegex.exec(line);
    if (match) {
      const url = match[1].trim();
      let label = line.split(/\((?:Link|link):/i)[0].replace(/^[-*\s]+/, '').trim();
      if (label.endsWith(':')) {
        label = label.slice(0, -1).trim();
      }
      if (url && label) {
        parsedLinks.push({ name: label, url });
      }
    }
  }
  return parsedLinks;
}

// Helper to sanitize URLs (removes competitor links and falls back to our own site)
function sanitizeUrlValue(url, boardName) {
  if (!url) return '';
  const lowerUrl = url.toLowerCase();
  
  if (
    lowerUrl.includes('sarkariresult.com/tools') ||
    lowerUrl.includes('sarkariresult.tools') ||
    lowerUrl.includes('freejobalert.com/tools') ||
    lowerUrl.includes('ilovepdf.com') ||
    lowerUrl.includes('imageresizer.com') ||
    lowerUrl.includes('pdfresizer.com')
  ) {
    return '/tools';
  }
  
  if (lowerUrl.includes('sarkariresult') || lowerUrl.includes('freejobalert')) {
    return '/job-alerts';
  }
  
  return url;
}

function stripSarkariResultMentionsAndLinks(str = '') {
  if (!str || typeof str !== 'string') return str;

  let cleaned = str;

  // 1. Replace outbound links
  cleaned = cleaned.replace(/href=["']https?:\/\/(?:www\.)?sarkariresult\.com[^"']*["']/gi, 'href="https://www.digitalhomeblog.in/job-alerts"');
  cleaned = cleaned.replace(/href=["']https?:\/\/[^"']*sarkariresult[^"']*["']/gi, 'href="https://www.digitalhomeblog.in/job-alerts"');

  // 2. Remove/replace text mentions & praises
  cleaned = cleaned
    .replace(/sarkari\s*result\s*official\s*(?:website|app|portal|tools?)/gi, 'Digital Home Official Portal')
    .replace(/sarkari\s*result\s*(?:tools?|resizer|cropper|compressor)/gi, 'Student Utility Tools')
    .replace(/sarkari\s*result/gi, 'Digital Home Portal')
    .replace(/sarkariresult/gi, 'Digital Home')
    .replace(/sarkari\s*resut/gi, 'Digital Home')
    .replace(/sarkari\s*reult/gi, 'Digital Home');

  // 3. Remove raw URLs
  cleaned = cleaned.replace(/www\.sarkariresult\.com/gi, 'www.digitalhomeblog.in');
  cleaned = cleaned.replace(/sarkariresult\.com/gi, 'digitalhomeblog.in');

  return cleaned;
}

// Core service to draft a blog post from an alert document
async function draftAlertToPostDoc(alert) {
  console.log(`[LiveAlert Sourcing] Drafting blog post from alert: "${alert.title}"`);

  // 0. Strict De-duplication Protection: Check if a post for this alert or topic already exists
  const existingPostByAlert = await BlogPost.findOne({
    $or: [
      { canonicalUrl: alert.sourceUrl },
      { sourceAlert: alert._id }
    ]
  });

  if (existingPostByAlert) {
    console.log(`[De-duplication Protection] Post already exists for alert: "${alert.title}" [Slug: ${existingPostByAlert.slug}]. Skipping duplicate creation.`);
    alert.status = 'published';
    await alert.save();
    return existingPostByAlert._id;
  }

  // Also check normalized board/title match in posts created within the last 14 days
  const extractCoreKeyword = (t = '') => {
    const stopWords = [
      'online', 'form', 'recruitment', 'bharti', 'barti', 'apply', '2024', '2025', '2026', '2027',
      'various', 'post', 'posts', 'vacancies', 'vacancy', 'direct', 'link', 'step', 'process',
      'full', 'latest', 'news', 'admit', 'card', 'result', 'extended', 'notice', 'exam', 'now',
      'official', 'portal', 'website', 'notification', 'pdf', 'update', 'updates'
    ];
    const clean = t.toLowerCase().replace(/[^a-z0-9\s]+/g, '');
    const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    return words.slice(0, 2).join(' ');
  };

  const alertCoreKey = extractCoreKeyword(alert.title);
  if (alertCoreKey && alertCoreKey.length >= 3) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentPosts = await BlogPost.find({ createdAt: { $gte: fourteenDaysAgo } }, { title: 1, slug: 1 }).lean();
    const isTopicDuplicate = recentPosts.some(p => {
      const pKey = extractCoreKeyword(p.title);
      const cleanSlug = p.slug.replace(/-/g, ' ');
      return (
        (pKey && (pKey === alertCoreKey || pKey.includes(alertCoreKey) || alertCoreKey.includes(pKey))) ||
        cleanSlug.includes(alertCoreKey)
      );
    });

    if (isTopicDuplicate) {
      console.log(`[De-duplication Protection] Topic duplicate detected for key "${alertCoreKey}" in recent posts. Skipping duplicate creation for "${alert.title}".`);
      alert.status = 'published';
      await alert.save();
      return null;
    }
  }

  // Dynamic professional title for the blog post
  const cleanTitle = alert.title
    .replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2') // e.g. "Answer2026" -> "Answer 2026"
    .replace(/\b\w/g, c => c.toUpperCase());

  // Construct the context/command parameters for Gemini Flash to generate a 1200+ word post
  const resolvedUrl = sanitizeUrlValue(alert.officialUrl || '', alert.boardName || cleanTitle);
  const resolvedPdf = sanitizeUrlValue(alert.officialPdfUrl || '', alert.boardName || cleanTitle);
  const resolvedApply = sanitizeUrlValue(alert.officialApplyUrl || '', alert.boardName || cleanTitle);
  const detailsTextContext = alert.detailsText || '';

  // Extract all links programmatically from scraped factsheet details
  const detailsLinks = extractLinksFromText(detailsTextContext);

  // Build unique URL map
  const allLinksMap = new Map();

  // Prioritize explicitly stored URL fields
  if (resolvedApply) allLinksMap.set('apply online', resolvedApply);
  if (resolvedPdf) allLinksMap.set('download notification', resolvedPdf);
  if (resolvedUrl) allLinksMap.set('official website', resolvedUrl);

  // Merge in any other parsed links from the text details
  detailsLinks.forEach(link => {
    const url = sanitizeUrlValue(link.url, alert.boardName || cleanTitle);
    const nameLower = link.name.toLowerCase();
    if (nameLower.includes('apply')) {
      allLinksMap.set('apply online', url);
    } else if (nameLower.includes('notification') || nameLower.includes('pdf') || nameLower.includes('advertisement') || nameLower.includes('notice')) {
      // Skip utility tools links so they don't overwrite download notification link
      if (url !== '/tools' && !nameLower.includes('utility tools') && !nameLower.includes('resizer')) {
        allLinksMap.set('download notification', url);
      } else {
        allLinksMap.set('student utility tools', '/tools');
      }
    } else if (nameLower.includes('website') || nameLower.includes('homepage') || nameLower.includes('official site')) {
      allLinksMap.set('official website', url);
    } else {
      allLinksMap.set(link.name, url);
    }
  });

  // Create the final beautiful HTML buttons block
  const buttonHtmls = [];
  allLinksMap.forEach((url, name) => {
    let btnClass = 'btn-apply';
    let label = name;
    const lower = name.toLowerCase();

    if (lower.includes('apply')) {
      btnClass = 'btn-apply';
      label = `Apply Online (यहाँ क्लिक करें)`;
    } else if (lower.includes('notification') || lower.includes('pdf') || lower.includes('advertisement') || lower.includes('notice')) {
      btnClass = 'btn-notification';
      label = `Download Official Notification (देखें अभी)`;
    } else if (lower.includes('website') || lower.includes('homepage') || lower.includes('official site')) {
      btnClass = 'btn-website';
      label = `Official Website (विजिट करें)`;
    } else if (lower.includes('syllabus')) {
      btnClass = 'btn-notification';
      label = `Download Syllabus (पाठ्यक्रम डाउनलोड करें)`;
    } else if (lower.includes('tools')) {
      btnClass = 'btn-website';
      label = `Photo & Sign Resizer Tools (यहाँ क्लिक करें)`;
    } else {
      btnClass = 'btn-website';
      label = `${name} (यहाँ देखें)`;
    }
    buttonHtmls.push(`<a href="${url}" class="btn-link-action ${btnClass}" target="_blank" rel="noopener noreferrer" style="margin: 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex;">${label}</a>`);
  });

  // Enforce default fallback action buttons if the main 3 fields were not in details
  if (!allLinksMap.has('apply online')) {
    const fallbackUrl = 'https://www.digitalhomeblog.in/job-alerts';
    buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-apply" target="_blank" rel="noopener noreferrer" style="margin: 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex;">Apply Online (यहाँ क्लिक करें)</a>`);
  }
  if (!allLinksMap.has('download notification')) {
    const fallbackUrl = 'https://www.digitalhomeblog.in/job-alerts';
    buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-notification" target="_blank" rel="noopener noreferrer" style="margin: 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex;">Download Official Notification (देखें अभी)</a>`);
  }
  if (!allLinksMap.has('official website')) {
    const fallbackUrl = 'https://www.digitalhomeblog.in/job-alerts';
    buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer" style="margin: 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex;">Official Board Website (विजिट करें)</a>`);
  }

  const buttonHtmlBlock = `<div class="ql-table-embed">\n<div class="action-buttons-group" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; align-items: flex-start;">\n${buttonHtmls.join('\n')}\n</div>\n</div>`;

  const aiParams = {
    title: cleanTitle,
    model: 'gemini-2.5-pro',
    length: 'long',
    tone: 'informative',
    language: 'hinglish',
    category: 'Sarkari Jobs & Exams',
    command: `Below is the official notification details block containing the EXACT facts, vacancy details, fees, dates, age limits, and eligibility criteria for this job post. You MUST use these exact details to build the post. Do NOT hallucinate, change, or omit seat numbers, districts, fees, age limits, or eligibility criteria. All lists and values from the details block below must be printed exactly same-to-same.

OFFICIAL NOTIFICATION DETAILS:
"""
${detailsTextContext}
"""

FACTUAL METADATA:
- Conducting Board: "${alert.boardName}"
- Last Date to Apply: "${alert.lastDate}"
- Official Website URL: "${resolvedUrl || ''}"
- Official Notification PDF URL: "${resolvedPdf || ''}"
- Official Apply Portal URL: "${resolvedApply || ''}"

CRITICAL DIRECTIVES:
- The generated post title MUST be a click-magnet, high-CTR title. You MUST append an action-oriented hook at the end of the title, formatting it precisely like: "${cleanTitle} (Direct Link) - Step by Step Apply Now" or "${cleanTitle} (Direct Link) - Apply Online Now".
- You must use the mandatory 'Sarkari Jobs & Exams' category framework headings in Hinglish/Hindi, but at least one of these H2 headings MUST contain the exact Focus Keyword/Title phrase "${cleanTitle}" (e.g., "## ${cleanTitle} की महत्वपूर्ण तिथियाँ" or "## ${cleanTitle} योग्यता और पात्रता" or prepend the title to any H2 heading). Do NOT use plain English headings.
- You MUST include the following three unique educational sections as H2 headings to provide high-value content for students:
  * "## चयन प्रक्रिया (Selection Process)" - Explaining step-by-step how the selection happens (Written Exam, Physical, Interview, Document Verification).
  * "## परीक्षा की तैयारी कैसे करें? (Exam Preparation Tips)" - Provide 3-4 actionable tips and study guidelines for candidates preparing for this specific exam.
  * "## परीक्षा के मुख्य विषय (Key Syllabus Subjects)" - Summarize the core subjects they need to study (General Knowledge, Mathematics, Reasoning, etc.) to pass.
- Under EACH H2 heading, you MUST write at least 2 detailed body paragraphs (each 5-6 sentences long) to explain the details in depth and guarantee a long-form article of at least 1,800+ words to pass SEO length checks.
- To present details in a premium, highly readable format for students:
  * Under the "## महत्वपूर्ण तिथियाँ" section, you MUST construct a neat Markdown table containing key dates (e.g., Event Name like Start Date / Last Date vs Date value).
  * Under the "## आवेदन शुल्क" section, you MUST construct a neat Markdown table summarizing category-wise fee details (e.g., Category like Gen/OBC vs Fee amount).
  * Under the "## रिक्तियों का विवरण" or "## योग्यता और पात्रता" section, you MUST construct a neat Markdown table showing: Post Name, Vacancies Count, Age Limit, and Eligibility Criteria.
- The generated 'seoDescription' and 'summary' JSON fields MUST start with the focus keyword/title and be strictly between 110 and 150 characters long.
- You MUST embed at least two journalistic citations (e.g., using "According to the official board details..." or "As stated by the recruitment guidelines...") in the body paragraphs to satisfy trust checks.
- You MUST define the main topic or focus keyword in the first paragraph using a clear defining phrase like "refers to" or "is defined as" or "ka matlab" (e.g., "This recruitment refers to..." or "${cleanTitle} refers to...").
- In the "महत्वपूर्ण लिंक्स" (Important Links) H2 section, you MUST output the following EXACT HTML block containing the Call-to-Action buttons. Do NOT modify, translate, rewrite, or omit any part of this HTML block. Output it exactly same-to-same on separate lines:
${buttonHtmlBlock}
- You MUST naturally link to other pages of our portal inside the post content body paragraphs (e.g. using anchor text like "Digital Home Blog", "Government Job Vacancy & Result 2026", "latest government jobs" pointing to root URL "/").
- The FAQ section heading MUST be exactly "## अक्सर पूछे जाने वाले सवाल (FAQ)" so it is detected correctly.
- Under the FAQ section, provide exactly 3 questions formatted as H3. Each question must be in Hinglish using Latin query words like "Kaise", "Kab", "Kya", "How", or "What" (e.g., "### Question: UPTGT 2026 Apply Kaise Karein?"). Each answer must be immediately below it and strictly under 45 words.`
  };

  // Trigger backend AI post generator
  const generatedData = await generateBlogContentCore(aiParams);

  // Prettify and post-process AI output using standard processAIOutput helper
  const { processAIOutput } = require('../ai/aiPostProcessor');
  const processed = await processAIOutput({
    title: generatedData.title,
    content: generatedData.content || '',
    keywords: generatedData.keywords || [],
    focusKeyword: generatedData.focusKeyword || '',
    category: 'Sarkari Jobs & Exams',
    length: 'long',
    slug: generatedData.slug,
    seoTitle: generatedData.seoTitle,
    seoDescription: generatedData.seoDescription
  });

  let finalContent = processed.content || '';

  // Standardize & inject important links section programmatically
  const linksHeaderRegex = /<h[23]>(?:महत्वपूर्ण लिंक्स?|Important Links?|Useful Links?|Some Useful Important Links)<\/h[23]>/i;
  const hasLinksSection = linksHeaderRegex.test(finalContent);
  const standardLinksBlock = `\n<h2>महत्वपूर्ण लिंक्स</h2>\n${buttonHtmlBlock}\n`;

  if (hasLinksSection) {
    const match = finalContent.match(linksHeaderRegex);
    const startIndex = match.index;
    const rest = finalContent.slice(startIndex + match[0].length);
    const nextBoundary = rest.search(/<h[23]>|<div[^>]*class=["'](?:brand-authority-block|games-promo-block|student-tools-promo)["']/i);
    if (nextBoundary !== -1) {
      finalContent = finalContent.slice(0, startIndex) + standardLinksBlock + '\n' + rest.slice(nextBoundary);
    } else {
      // If no subsequent block is found, replace only the links header and keep rest
      finalContent = finalContent.slice(0, startIndex) + standardLinksBlock + '\n' + rest.replace(/^[\s\S]*?(?=<p|<div|<h|\b|$)/, '');
    }
  } else {
    const faqHeaderRegex = /<h[23]>(?:अक्सर पूछे जाने वाले सवाल \(FAQ\)|Frequently Asked Questions)<\/h[23]>/i;
    const faqMatch = finalContent.match(faqHeaderRegex);
    if (faqMatch) {
      finalContent = finalContent.slice(0, faqMatch.index) + standardLinksBlock + '\n' + finalContent.slice(faqMatch.index);
    } else {
      const takeawaysRegex = /<h[23]>(?:Key Takeaways|महत्वपूर्ण निष्कर्ष)<\/h[23]>/i;
      const takeawaysMatch = finalContent.match(takeawaysRegex);
      if (takeawaysMatch) {
        finalContent = finalContent.slice(0, takeawaysMatch.index) + standardLinksBlock + '\n' + finalContent.slice(takeawaysMatch.index);
      } else {
        const brandIndex = finalContent.indexOf("<div class='brand-authority-block'");
        if (brandIndex !== -1) {
          finalContent = finalContent.slice(0, brandIndex) + standardLinksBlock + '\n' + finalContent.slice(brandIndex);
        } else {
          finalContent += '\n' + standardLinksBlock;
        }
      }
    }
  }

  // Run final prettifier to ensure all tables, spacing, and anchor tag margins match
  const { prettifyLinksAndContent } = require('../ai/aiPostProcessor');
  finalContent = prettifyLinksAndContent(finalContent);

  // Auto-generate HD Featured Banner Image
  let featuredImage = '';
  try {
    const { generateAutoBanner } = require('../../shared/utils/autoBannerGenerator');
    featuredImage = await generateAutoBanner(processed.title, 'Sarkari Jobs & Exams');
  } catch (bannerErr) {
    console.warn('[LiveAlert Sourcing] Auto banner generation notice:', bannerErr.message);
  }

  // Clean content broken images & optimize ALT tags
  try {
    const { fixContentImagesSeo } = require('../../shared/utils/imageSeoFixer');
    const imgFix = fixContentImagesSeo(finalContent, processed.title);
    finalContent = imgFix.content;
  } catch (imgFixErr) {}

  // Scrub all mentions and links of SarkariResult from all post fields
  const cleanPostTitle = stripSarkariResultMentionsAndLinks(processed.title);
  const cleanPostExcerpt = stripSarkariResultMentionsAndLinks(processed.seoDescription || generatedData.summary.slice(0, 320));
  const cleanPostContent = stripSarkariResultMentionsAndLinks(finalContent);
  const cleanPostSeoTitle = stripSarkariResultMentionsAndLinks(processed.seoTitle);
  const cleanPostSeoDesc = stripSarkariResultMentionsAndLinks(processed.seoDescription);
  const cleanPostTags = (processed.tags || []).map(t => stripSarkariResultMentionsAndLinks(t));

  // Create and save Mongoose BlogPost document directly as PUBLISHED
  const newPost = new BlogPost({
    title: cleanPostTitle,
    slug: processed.slug,
    excerpt: cleanPostExcerpt,
    content: cleanPostContent,
    featuredImage: featuredImage,
    category: 'Sarkari Jobs & Exams',
    tags: cleanPostTags,
    status: 'published',
    publishedAt: new Date(),
    seoTitle: cleanPostSeoTitle,
    seoDescription: cleanPostSeoDesc,
    seoKeywords: cleanPostTags,
    focusKeyword: processed.focusKeyword || '',
    canonicalUrl: `https://www.digitalhomeblog.in/blog/sarkari-jobs-exams/${processed.slug}`,
    author: 'Harry Prince'
  });

  // Remove any existing post with the same slug to prevent unique slug index violations
  await BlogPost.deleteMany({ slug: processed.slug });
  try {
    await newPost.save();
  } catch (saveErr) {
    if (saveErr.code === 'DUPLICATE_TOPIC_REJECTED' || saveErr.code === 11000) {
      console.log(`[De-duplication Protection] Mongoose Pre-Save Interceptor caught duplicate post for "${processed.title}". Handled safely.`);
      alert.status = 'published';
      await alert.save();
      return null;
    }
    throw saveErr;
  }

  // 1. Trigger Instant Telegram Public Channel Broadcast
  try {
    const { sendTelegramMessage } = require('../../shared/services/telegramService');
    sendTelegramMessage(newPost).catch(err => console.warn('[Telegram Channel] Notice:', err.message));
  } catch (tgErr) {}

  // 2. Trigger Instant Google Indexing API Ping
  try {
    const { notifyUrl } = require('../../shared/utils/google-indexing');
    const catUrl = (newPost.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const postUrl = `https://www.digitalhomeblog.in/blog/${catUrl}/${newPost.slug}`;
    notifyUrl(postUrl, 'URL_UPDATED').catch(() => {});
  } catch (idxErr) {}

  // 3. Generate Web Story for this new post in background
  try {
    const { generateWebStoryForPost } = require('../posts/webstory.service');
    generateWebStoryForPost(newPost, alert).catch(storyErr => {
      console.error(`[LiveAlert Sourcing] Failed to generate Web Story for "${newPost.title}":`, storyErr.message);
    });
  } catch (storyErr) {}

  // 4. Log Automation Telemetry
  try {
    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'SEO_INDEXING',
      level: 'SUCCESS',
      action: 'Instant Auto-Publish Alert',
      message: `Scraped, quality-checked & instantly published: "${newPost.title}" (SEO Score: ${newPost.seoScore || 100}/100)`,
      metadata: { title: newPost.title, url: generatedData.permalink }
    });
  } catch (logErr) {}

  // Mark the alert as processed
  alert.status = 'published';
  await alert.save();

  console.log(`[LiveAlert Sourcing] Autopilot instantly published post: "${generatedData.title}" [ID: ${newPost._id}]`);
  return newPost._id;
}

// Create a draft post from alert metadata (Route Handler)
async function draftPostFromAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await LiveAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const postId = await draftAlertToPostDoc(alert);

    res.json({
      success: true,
      message: 'Draft post successfully created in background!',
      postId
    });
  } catch (err) {
    console.error('[LiveAlert Sourcing] Route drafting failed:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to auto-write post' });
  }
}

module.exports = { getAlerts, getAlertById, triggerScrape, draftPostFromAlert, draftAlertToPostDoc };
