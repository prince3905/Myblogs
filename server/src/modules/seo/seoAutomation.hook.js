const SiteSeoConfig = require('./siteSeoConfig.model');

// Well-known recruiters and organizations in India
const KNOWN_ORGS = [
  'UPSC', 'SSC', 'RRB', 'Railway', 'NTA', 'IBPS', 'SBI', 'RBI', 'NABARD', 'LIC',
  'DSSSB', 'BPSC', 'UPPSC', 'MPPSC', 'RPSC', 'HSSC', 'UKPSC', 'JSSC', 'OSSC',
  'TSPSC', 'APPSC', 'KPSC', 'TNPSC', 'WBPSC', 'GPSC', 'MPSC', 'CGPSC', 'JKSSB',
  'Indian Army', 'Indian Navy', 'Indian Air Force', 'Air Force', 'Navy', 'Army',
  'CRPF', 'BSF', 'CISF', 'ITBP', 'SSB', 'Assam Rifles', 'Coast Guard',
  'Delhi Police', 'UP Police', 'Bihar Police', 'Rajasthan Police', 'MP Police',
  'ISRO', 'DRDO', 'BARC', 'BEL', 'BHEL', 'IOCL', 'ONGC', 'NTPC', 'SAIL', 'GAIL'
];

/**
 * Clean job title for high-CTR SEO rendering
 */
function sanitizeTitleForSeo(rawTitle = '') {
  let title = (rawTitle || '').trim();
  // Remove duplicate brackets, competitor names, messy characters
  title = title.replace(/\s+/g, ' ');
  title = title.replace(/[-–—]\s*(?:sarkariresult|freejobalert|sarkariexam)\S*/gi, '');
  title = title.replace(/\s*\(Link:\s*[^\)]*\)/gi, '');
  title = title.replace(/\s*#\|\|:\|\|\s*/g, ' ');
  return title.trim();
}

/**
 * Extract organization and short-tail keyword tokens
 */
function extractShortTailKeywords(title, boardName = '') {
  const shortKeywords = new Set();

  if (boardName && boardName !== 'Official Board' && boardName !== 'Sarkari Feed') {
    shortKeywords.add(boardName.trim());
  }

  const titleUpper = title.toUpperCase();
  for (const org of KNOWN_ORGS) {
    const orgUpper = org.toUpperCase();
    if (titleUpper.includes(orgUpper)) {
      shortKeywords.add(org);
    }
  }

  // Key generic high-intent terms
  shortKeywords.add('Sarkari Result 2026');
  shortKeywords.add('Sarkari Job');
  shortKeywords.add('Recruitment 2026');
  shortKeywords.add('Apply Online Form');

  return Array.from(shortKeywords).slice(0, 8);
}

/**
 * Build candidate long-tail queries
 */
function buildLongTailKeywords(title) {
  const clean = sanitizeTitleForSeo(title);
  return [
    `${clean} apply online form`,
    `${clean} notification pdf download`,
    `${clean} syllabus and exam date 2026`,
    `${clean} eligibility and age limit`,
    `${clean} salary and selection process`
  ];
}

/**
 * Calculate SEO Quality Score (0–100)
 */
function calculateSeoScore(title = '', metaDesc = '', faqs = [], cleanTitle = '') {
  let score = 0;

  // 1. Title Length check (50-68 characters is optimal Google SERP length)
  const titleLen = (title || '').length;
  if (titleLen >= 50 && titleLen <= 70) {
    score += 20;
  } else if (titleLen >= 38 && titleLen <= 85) {
    score += 12;
  } else if (titleLen > 0) {
    score += 5;
  }

  // 2. Power Words check in Title
  const hasPowerWord = /\b(OUT|Apply Online|Notification|Direct Link|Form|Vacancy|Recruitment|Result|Admit Card)\b/i.test(title);
  if (hasPowerWord) {
    score += 15;
  }

  // 3. Current Year (2026) check
  if (/\b2026\b/.test(title) || /\b2026\b/.test(metaDesc)) {
    score += 15;
  }

  // 4. Meta Description Length check (120-158 characters is optimal)
  const descLen = (metaDesc || '').length;
  if (descLen >= 120 && descLen <= 158) {
    score += 20;
  } else if (descLen >= 90 && descLen <= 170) {
    score += 12;
  } else if (descLen > 0) {
    score += 5;
  }

  // 5. Keyword presence in Meta Description
  const firstWord = (cleanTitle.split(' ')[0] || '').toLowerCase();
  if (firstWord && metaDesc.toLowerCase().includes(firstWord)) {
    score += 15;
  } else if (/\b(apply|notification|eligibility|date)\b/i.test(metaDesc)) {
    score += 10;
  }

  // 6. FAQs presence (3 or more FAQs for rich SERP snippets)
  if (Array.isArray(faqs) && faqs.length >= 3) {
    score += 15;
  } else if (Array.isArray(faqs) && faqs.length > 0) {
    score += 8;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate 3 Core Job FAQs
 */
function generateCoreFaqs(title, lastDate, boardName) {
  const clean = sanitizeTitleForSeo(title);
  const org = boardName && boardName !== 'Official Board' ? boardName : 'the official board';
  const deadline = lastDate && lastDate !== 'N/A' && lastDate !== 'Check Detail Page'
    ? lastDate
    : 'specified in the official circular (Check official website)';

  return [
    {
      question: `What is the last date to apply online for ${clean}?`,
      answer: `The last date to submit online application form for ${clean} is ${deadline}. Candidates are strongly recommended to complete their registration before the closing date.`
    },
    {
      question: `What is the eligibility criteria and age limit for ${clean}?`,
      answer: `Eligibility conditions and age relaxation for ${clean} are determined by ${org}. Please verify the official notification PDF for category-wise education, physical standards, and age limits.`
    },
    {
      question: `How to apply online and what is the fee for ${clean}?`,
      answer: `Eligible candidates can apply directly through the official portal of ${org}. Application fee can be paid online via Net Banking, Debit/Credit Card, or UPI according to category reservation rules.`
    }
  ];
}

/**
 * Universal SEO Engine Automation Processor
 * Can be run in pre-save hooks or triggered via admin API
 */
async function processSeoAutomation(doc, options = {}) {
  try {
    if (!doc.seoEngine) {
      doc.seoEngine = { isAutoMode: true };
    }

    const isAuto = doc.seoEngine.isAutoMode !== false;
    const cleanTitle = sanitizeTitleForSeo(doc.title);
    const board = doc.boardName || '';
    const lastDate = doc.lastDate || '';

    // If in Auto Mode, regenerate meta title, description, keywords, and FAQs
    if (isAuto || options.forceRegenerate) {
      let config = null;
      try {
        config = await SiteSeoConfig.getOrCreate();
      } catch (e) {
        config = {
          jobTitlePattern: 'Sarkari Result 2026: {title} – Apply Online Form',
          jobMetaPattern: 'Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home.'
        };
      }

      // 1. Short-tail & Long-tail keywords
      doc.seoEngine.shortTailKeywords = extractShortTailKeywords(cleanTitle, board);
      doc.seoEngine.longTailKeywords = buildLongTailKeywords(cleanTitle);

      // 2. Generate Custom Meta Title using Pattern with front-loaded power words
      const titlePattern = config.jobTitlePattern || 'Sarkari Result 2026: {title} – Apply Online Form';
      let metaTitle = titlePattern.replace(/\{title\}/g, cleanTitle).trim();

      // Ensure power words if missing
      if (!/\b(OUT|Apply Online|Direct Link)\b/i.test(metaTitle)) {
        metaTitle = `${metaTitle} – Apply Online`;
      }
      if (metaTitle.length > 70) {
        metaTitle = metaTitle.slice(0, 68).trim();
      }
      doc.seoEngine.customMetaTitle = metaTitle;

      // 3. Generate Custom Meta Description capped at 155 characters
      const metaPattern = config.jobMetaPattern || 'Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home.';
      let metaDesc = metaPattern.replace(/\{title\}/g, cleanTitle).trim();
      if (metaDesc.length > 155) {
        metaDesc = metaDesc.slice(0, 152).trim() + '...';
      }
      doc.seoEngine.customMetaDescription = metaDesc;

      // 4. Auto-generate 3 Core FAQs
      if (!doc.seoEngine.faqs || doc.seoEngine.faqs.length === 0 || options.forceRegenerate) {
        doc.seoEngine.faqs = generateCoreFaqs(cleanTitle, lastDate, board);
      }
    }

    // 5. Canonical URL
    if (doc.slug) {
      doc.seoEngine.canonicalUrl = `https://www.digitalhomeblog.in/india/sarkari-jobs/${doc.slug}`;
    }

    // 6. Calculate On-Page SEO Score
    const effectiveTitle = doc.seoEngine.customMetaTitle || doc.title || '';
    const effectiveDesc = doc.seoEngine.customMetaDescription || '';
    const faqs = doc.seoEngine.faqs || [];

    doc.seoEngine.seoScore = calculateSeoScore(effectiveTitle, effectiveDesc, faqs, cleanTitle);

    return doc.seoEngine;
  } catch (err) {
    console.error('[SEO Automation Hook] Error processing SEO:', err);
    return doc.seoEngine || {};
  }
}

/**
 * Strict Regional-Indexed vs Global-Noindex Hook Isolation
 * Only dispatch notifyAllIndexing if job.isIndexable === true AND job.isGlobal === false.
 * Skips indexing pings completely for all Global posts.
 */
async function dispatchSeoIndexing(doc, url) {
  if (!doc || doc.isIndexable === false || doc.isGlobal === true) {
    console.log(`[SEO Indexing Hook] Bypassing search engine ping for global/non-indexable item: ${url || doc?.title}`);
    return { skipped: true, reason: 'GLOBAL_OR_NOINDEX' };
  }

  try {
    const { notifyAllIndexing } = require('../../shared/utils/google-indexing');
    return await notifyAllIndexing(url, 'URL_UPDATED');
  } catch (err) {
    console.warn(`[SEO Indexing Hook] Ping warning: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = {
  processSeoAutomation,
  dispatchSeoIndexing,
  sanitizeTitleForSeo,
  extractShortTailKeywords,
  buildLongTailKeywords,
  calculateSeoScore,
  generateCoreFaqs
};

