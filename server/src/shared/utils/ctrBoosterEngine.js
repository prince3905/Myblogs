/**
 * 100% Authentic Natural Indian SEO & Schema Engine
 * Crafts natural, high-converting Indian Hindi-English titles, meta descriptions, and FAQ schemas
 * matching how millions of Indian candidates search Google daily.
 */

const CATEGORY_EMOJIS = {
  'Sarkari Jobs & Exams': '💼',
  'Health & Wellness': '🏥',
  'Tech & Tutorials': '⚡',
  'AI & Web Tools': '🤖',
  'News & Trends': '🔥',
  'Finance & Business': '💰',
  'default': '📌'
};

const NATURAL_INDIAN_HOOKS = [
  ': जानिए कैसे डाउनलोड करें (Direct Link)',
  ': डायरेक्ट लिंक व ऑनलाइन फॉर्म यहाँ देखें',
  ': परीक्षा तिथि व हॉल टिकट जारी, तुरंत देखें',
  ': कटऑफ मार्क्स व मेरिट लिस्ट यहाँ चेक करें',
  ': 100% आधिकारिक नोटिफिकेशन व अप्लाई लिंक'
];

/**
 * 1. Crafts a 100% Natural Indian Hinglish SEO Title
 */
function optimizeHighCtrTitle(title = '', category = '') {
  if (!title) return title;

  let clean = title.trim();

  // Strip excessive punctuation or weird tags
  clean = clean.replace(/^(🔥|⚡|💼|🏥|🤖|💰|📌)\s*/, '');
  clean = clean.replace(/\s*\|\s*(Digital Home|Sarkari Result|Inkspire Blog)\s*$/i, '');

  // Add current year naturally if missing
  if (!clean.includes('2026') && !clean.includes('2027')) {
    clean += ' 2026';
  }

  // Inject natural Indian phrase suffix if no bracket/colon exists
  if (!clean.includes(':') && !clean.includes('(') && clean.length < 52) {
    const hook = NATURAL_INDIAN_HOOKS[Math.abs(hashString(clean)) % NATURAL_INDIAN_HOOKS.length];
    clean += hook;
  }

  // Prepend clean category emoji
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.default;
  if (!clean.startsWith(emoji)) {
    clean = `${emoji} ${clean}`;
  }

  return clean.slice(0, 72);
}

function extractCleanSnippet(content = '', maxLength = 155) {
  if (!content) return '';
  let plain = String(content)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  let truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 100) {
    truncated = truncated.slice(0, lastSpace);
  }
  return `${truncated}...`;
}

function isJobCategory(category = '', title = '') {
  const catLower = String(category).toLowerCase();
  const titleLower = String(title).toLowerCase();
  if (catLower.includes('sarkari') || catLower.includes('job') || catLower.includes('exam')) return true;
  if (
    titleLower.includes('recruitment') || titleLower.includes('online form') ||
    titleLower.includes('admit card') || titleLower.includes('bharti') ||
    titleLower.includes('vacancy') || titleLower.includes('answer key') ||
    titleLower.includes('cutoff') || titleLower.includes('result 202')
  ) return true;
  return false;
}

/**
 * 2. Synthesizes a 100% Natural Meta Description (120-155 characters)
 * Category-aware: Sarkari recruitment fallback ONLY for Sarkari Jobs & Exams.
 * For Tech, Health, AI, Finance, News: Extracts clean text snippet from content body.
 */
function optimizeHighCtrMetaDescription(title = '', content = '', focusKeyword = '', category = '') {
  const isJob = isJobCategory(category, title);

  if (isJob) {
    const keyword = (focusKeyword || title).replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
    let naturalDesc = `${keyword} का आधिकारिक नोटिफिकेशन व डायरेक्ट लिंक जारी हो चुका है। ऑनलाइन फॉर्म भरने की तिथि, पात्रता, आयु सीमा व जरूरी दस्तावेज यहाँ तुरंत चेक करें!`;
    if (naturalDesc.length > 158) {
      naturalDesc = `${keyword}: आधिकारिक नोटिफिकेशन जारी। पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक यहाँ देखें!`;
    }
    return naturalDesc;
  }

  // Non-Job categories (Tech, Health, AI, Finance, News, etc.)
  const snippet = extractCleanSnippet(content, 155);
  if (snippet && snippet.length >= 30) {
    return snippet;
  }

  // Neutral non-job fallback summary based on title
  const cleanTitle = title.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
  return `${cleanTitle}: जानिए इस विषय की पूरी जानकारी, मुख्य तथ्य और विस्तृत गाइड डिजिटल होम ब्लॉग पर।`;
}

/**
 * 3. Generates 100% Natural FAQ Schema (Google Accordion) for Job Posts
 */
function generateFaqSchema(title = '', content = '', category = '') {
  const isJob = isJobCategory(category, title);
  if (!isJob) {
    return null;
  }

  const cleanTitle = title.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  const questions = [
    {
      q: `${cleanTitle} का आधिकारिक नोटिफिकेशन कैसे देखें?`,
      a: `${cleanTitle} का आधिकारिक नोटिफिकेशन और भर्ती विवरण इस पृष्ठ के महत्वपूर्ण लिंक (Important Links) सेक्शन में दिए गए डायरेक्ट लिंक से चेक कर सकते हैं।`
    },
    {
      q: `ऑनलाइन फॉर्म भरने के लिए कौन-कौन से मुख्य दस्तावेज चाहिए?`,
      a: `आवेदन के लिए 10वीं/12वीं/स्नातक अंकपत्र, पासपोर्ट साइज फोटो, हस्ताक्षर, आधार कार्ड और जाति/निवास प्रमाण पत्र (यदि लागू हो) होना आवश्यक है।`
    },
    {
      q: `क्या आवेदन शुल्क का भुगतान ऑनलाइन माध्यम से किया जा सकता है?`,
      a: `जी हाँ, आप यूपीआई (UPI), नेट बैंकिंग, क्रेडिट कार्ड या डेबिट कार्ड से ऑनलाइन आवेदन शुल्क जमा कर सकते हैं।`
    },
    {
      q: `डायरेक्ट ऑनलाइन अप्लाई लिंक कहाँ मिलेगा?`,
      a: `इस लेख के अंत में 'Important Direct Links' तालिका दी गई है, जहाँ से आप सीधे ऑफिशियल पोर्टल पर जाकर ऑनलाइन आवेदन कर सकते हैं।`
    }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };
}

function generateJobPostingSchema(post = {}) {
  if (!post || !isJobCategory(post.category, post.title)) {
    return null;
  }

  const cleanTitle = (post.title || '').replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '').trim();
  const desc = post.excerpt || post.seoDescription || post.title;
  const lowerTitle = (post.title || '').toLowerCase();
  const content = (post.content || '');

  const datePosted = post.publishedAt 
    ? new Date(post.publishedAt).toISOString() 
    : (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString());

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 45);
  const validThrough = post.applicationDeadline ? new Date(post.applicationDeadline).toISOString() : futureDate.toISOString();

  // Location & Postal Address resolution
  let locState = 'Uttar Pradesh';
  let locLocality = 'Lucknow';
  let locStreet = 'State Recruitment Board Office, Civil Lines';
  let locPostal = '226001';

  if (lowerTitle.includes('bihar') || lowerTitle.includes('patna') || lowerTitle.includes('bpsc') || lowerTitle.includes('bpssc')) {
    locState = 'Bihar';
    locLocality = 'Patna';
    locPostal = '800001';
    locStreet = 'BPSC Recruitment HQ, Bailey Road, Patna';
  } else if (lowerTitle.includes('delhi') || lowerTitle.includes('dsssb') || lowerTitle.includes('ssc') || lowerTitle.includes('upsc')) {
    locState = 'Delhi';
    locLocality = 'New Delhi';
    locPostal = '110001';
    locStreet = 'Central Recruitment Complex, Lodhi Road, New Delhi';
  } else if (lowerTitle.includes('prayagraj') || lowerTitle.includes('allahabad')) {
    locLocality = 'Prayagraj';
    locPostal = '211001';
    locStreet = 'Recruitment Board HQ, Civil Lines, Prayagraj';
  } else if (lowerTitle.includes('kanpur')) {
    locLocality = 'Kanpur';
    locPostal = '208001';
    locStreet = 'UPSRTC Depot, Kanpur Central';
  } else if (lowerTitle.includes('rajasthan') || lowerTitle.includes('rpsc') || lowerTitle.includes('rsmssb')) {
    locState = 'Rajasthan';
    locLocality = 'Jaipur';
    locPostal = '302001';
    locStreet = 'Main Board Office, Tonk Road, Jaipur';
  } else if (lowerTitle.includes('madhya pradesh') || lowerTitle.includes('mppsc') || lowerTitle.includes('mp police')) {
    locState = 'Madhya Pradesh';
    locLocality = 'Bhopal';
    locPostal = '462001';
    locStreet = 'Chayan Bhawan, Main Road, Bhopal';
  } else if (lowerTitle.includes('maharashtra') || lowerTitle.includes('mumbai')) {
    locState = 'Maharashtra';
    locLocality = 'Mumbai';
    locPostal = '400001';
    locStreet = 'CST Area, Main Office, Mumbai';
  } else if (lowerTitle.includes('bijnor')) {
    locLocality = 'Bijnor';
    locPostal = '246701';
    locStreet = 'District Collectorate Office, Bijnor';
  } else if (lowerTitle.includes('azamgarh')) {
    locLocality = 'Azamgarh';
    locPostal = '276001';
    locStreet = 'District Education Office, Azamgarh';
  } else if (lowerTitle.includes('ghazipur')) {
    locLocality = 'Ghazipur';
    locPostal = '233001';
    locStreet = 'District Office, Ghazipur';
  }

  // Extract Salary / Pay Scale if present in content
  let salaryVal = 21700; // Standard 7th Pay Commission Pay Matrix Level 1/3 default (Rs. 21,700/mo)
  const salaryMatch = content.match(/(?:salary|pay\s*scale|मानदेय|वेतन|pay)[\s\S]{1,50}?(?:Rs\.?|₹|INR)?\s*([0-9]{1,2},[0-9]{3}|[0-9]{4,6})/i);
  if (salaryMatch && salaryMatch[1]) {
    const parsed = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
    if (parsed >= 5000 && parsed <= 250000) {
      salaryVal = parsed;
    }
  }

  // Determine Employment Type
  let empType = 'FULL_TIME';
  if (lowerTitle.includes('apprentice') || lowerTitle.includes('contract') || lowerTitle.includes('temporary')) {
    empType = 'CONTRACT';
  } else if (lowerTitle.includes('part time')) {
    empType = 'PART_TIME';
  }

  const boardName = post.author && post.author !== 'Harry Prince' && post.author !== 'Digital Home Team' 
    ? post.author 
    : 'Sarkari Recruitment Board';

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": cleanTitle,
    "description": desc,
    "datePosted": datePosted,
    "validThrough": validThrough,
    "employmentType": empType,
    "hiringOrganization": {
      "@type": "Organization",
      "name": boardName,
      "sameAs": "https://www.digitalhomeblog.in"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": locStreet,
        "addressLocality": locLocality,
        "addressRegion": locState,
        "postalCode": locPostal,
        "addressCountry": "IN"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": salaryVal,
        "unitText": "MONTH"
      }
    }
  };
}

function generateBreadcrumbSchema(post = {}) {
  if (!post || !post.title) return null;
  const { normalizeCanonicalUrl } = require('./urlUtils');
  const catSlug = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sarkari-jobs-exams';
  const postUrl = normalizeCanonicalUrl(post.canonicalUrl || `https://www.digitalhomeblog.in/blog/${catSlug}/${post.slug}`);
  const catUrl = normalizeCanonicalUrl(`https://www.digitalhomeblog.in/category/${catSlug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.digitalhomeblog.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": post.category || "Sarkari Jobs & Exams",
        "item": catUrl
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

module.exports = {
  optimizeHighCtrTitle,
  optimizeHighCtrMetaDescription,
  generateFaqSchema,
  generateJobPostingSchema,
  generateBreadcrumbSchema,
  extractCleanSnippet,
  isJobCategory
};
