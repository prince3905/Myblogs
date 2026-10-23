const SiteSeoConfig = require('./siteSeoConfig.model');
const { sanitizeAndDeduplicateTitle } = require('../../shared/utils/titleSanitizer');

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
 * Clean job title for high-CTR SEO rendering and deduplicate repeated words
 */
function sanitizeTitleForSeo(rawTitle = '') {
  return sanitizeAndDeduplicateTitle(rawTitle);
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
      metaTitle = sanitizeAndDeduplicateTitle(metaTitle);
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

    // 7. Auto-calculate High-Demand Indexing Priority
    doc.indexingPriority = calculateIndexingPriority(doc.title, doc.boardName, doc.category);

    return doc.seoEngine;
  } catch (err) {
    console.error('[SEO Automation Hook] Error processing SEO:', err);
    return doc.seoEngine || {};
  }
}

// High-Demand Indexing Pattern Matchers
const URGENT_REGEX = /upsssc|up police|bssc|bihar police|csbc|jssc|railway|rrb|ssc gd|ssc cgl|admit card|result/i;
const LOW_REGEX = /contractual|guest|echs|district|anganwadi|consultant|trainee|apprentice/i;

/**
 * Auto-calculate indexing priority score:
 * - URGENT (Score 1.0): UPSSSC, UP Police, BSSC, Bihar Police, CSBC, JSSC, Railway/RRB, SSC GD, SSC CGL, Admit Card, Result
 * - LOW (Score 0.3): contractual, guest, echs, district, anganwadi, consultant, trainee, apprentice
 * - NORMAL (Score 0.7): All other Indian state vacancies
 */
function calculateIndexingPriority(title = '', boardName = '', category = '') {
  const t = String(title || '');
  const b = String(boardName || '');
  const c = String(category || '');
  const combined = `${t} ${b} ${c}`;

  // Check LOW first if title specifically indicates temporary/district/contractual roles
  // (unless board/title explicitly signifies a mass commission exam like UPSSSC, Railway, CSBC, SSC)
  if (LOW_REGEX.test(t) && !URGENT_REGEX.test(t) && !URGENT_REGEX.test(b)) {
    return 'LOW';
  }

  // URGENT if title, board, or category matches high-demand recruitment keywords
  if (URGENT_REGEX.test(combined)) {
    return 'URGENT';
  }

  // LOW if title matches LOW_REGEX
  if (LOW_REGEX.test(t)) {
    return 'LOW';
  }

  return 'NORMAL';
}

// In-Memory Batched Indexing Queue for NORMAL priority items (Flushed every 15 minutes)
const normalBatchQueue = new Set();
let batchIntervalTimer = null;

async function processNormalBatchQueue() {
  if (normalBatchQueue.size === 0) return { processed: 0 };
  const urlsToPing = Array.from(normalBatchQueue);
  normalBatchQueue.clear();

  console.log(`[Batch Indexing Queue] Flushing ${urlsToPing.length} NORMAL priority URLs to search engines...`);
  try {
    const { notifyBatchIndexNow, notifyAllIndexing } = require('../../shared/utils/google-indexing');

    // 1. Notify IndexNow engines in batch (zero daily quota penalty)
    await notifyBatchIndexNow(urlsToPing).catch(err => console.warn('[Batch IndexNow Error]:', err.message));

    // 2. Dispatch to Google Indexing API sequentially with jitter
    for (const url of urlsToPing.slice(0, 20)) {
      await notifyAllIndexing(url, 'URL_UPDATED').catch(() => {});
      await new Promise(r => setTimeout(r, 800));
    }
    return { processed: urlsToPing.length };
  } catch (err) {
    console.warn('[Batch Indexing Queue Warning]:', err.message);
    return { error: err.message };
  }
}

function initBatchQueueTimer() {
  if (!batchIntervalTimer) {
    batchIntervalTimer = setInterval(processNormalBatchQueue, 15 * 60 * 1000); // 15 minutes
    if (batchIntervalTimer.unref) batchIntervalTimer.unref();
  }
}

/**
 * Conditional Google & Multi-Engine Indexing Dispatch:
 * - If priority === 'URGENT': Dispatch instant ping to Google API & IndexNow immediately.
 * - If priority === 'NORMAL': Add to a 15-minute batched queue.
 * - If priority === 'LOW': SKIP instant ping completely (save daily API quota).
 */
async function dispatchSeoIndexing(doc, url) {
  if (!doc || doc.isIndexable === false || doc.isGlobal === true) {
    console.log(`[SEO Indexing Hook] Bypassing search engine ping for global/non-indexable item: ${url || doc?.title}`);
    return { skipped: true, reason: 'GLOBAL_OR_NOINDEX' };
  }

  const priority = doc.indexingPriority || calculateIndexingPriority(doc.title, doc.boardName, doc.category);

  if (priority === 'LOW') {
    console.log(`[SEO Indexing Hook] Skipping instant ping for LOW priority item (quota saved): ${url || doc?.title}`);
    return { skipped: true, reason: 'LOW_PRIORITY_QUOTA_SAVED', priority: 'LOW' };
  }

  if (priority === 'NORMAL') {
    initBatchQueueTimer();
    normalBatchQueue.add(url);
    console.log(`[SEO Indexing Hook] Queued URL into 15-minute batched queue (NORMAL priority): ${url}`);
    return { queued: true, queueSize: normalBatchQueue.size, priority: 'NORMAL' };
  }

  // URGENT: Dispatch instant ping to Google Indexing API & IndexNow immediately
  try {
    console.log(`[SEO Indexing Hook] ⚡ DISPATCHING INSTANT PING (URGENT priority): ${url}`);
    const { notifyAllIndexing } = require('../../shared/utils/google-indexing');
    const result = await notifyAllIndexing(url, 'URL_UPDATED');
    return { dispatched: true, result, priority: 'URGENT' };
  } catch (err) {
    console.warn(`[SEO Indexing Hook] Ping warning: ${err.message}`);
    return { error: err.message, priority: 'URGENT' };
  }
}

module.exports = {
  processSeoAutomation,
  dispatchSeoIndexing,
  calculateIndexingPriority,
  processNormalBatchQueue,
  normalBatchQueue,
  sanitizeAndDeduplicateTitle,
  sanitizeTitleForSeo,
  extractShortTailKeywords,
  buildLongTailKeywords,
  calculateSeoScore,
  generateCoreFaqs
};


