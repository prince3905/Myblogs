const axios = require('axios');
const mongoose = require('mongoose');

// Google Autocomplete Endpoint (Firefox client returns clean JSON array)
const GOOGLE_SUGGEST_URL = 'https://suggestqueries.google.com/complete/search?client=firefox';

/**
 * High-CTR, Zero-KD Curated Seed Topics organized by Intent:
 * [WHAT] -> In-depth Explainers
 * [HOW]  -> Step-by-Step Application & Verification Guides
 * [WHY]  -> Rules, Scrutiny & Rejection Prevention
 * [BEST] -> High-Paying / Low Competition Listicles
 */
const CURATED_JOB_SEEDS = {
  // 🇮🇳 INDIAN SARKARI GUIDES
  indian: {
    what: [
      'What is Central Government Pay Matrix Level 7 In-Hand Salary & Perks? (2026 Complete Breakdown)',
      'What is Gazetted vs Non-Gazetted Officer in Indian Government? Roles, Powers & Salary Compared',
      'What Documents Are Required for State PSC Document Verification? (Avoid Instant Form Rejection)',
      'What is Difference Between Permanent Commission and Short Service Commission in Indian Defence?',
      'What is UPSC Civil Services Cadre Allocation Policy & How Home Cadre Is Decided?'
    ],
    how: [
      'How to Calculate Exact Age Limit & Cut-Off Date for Sarkari Job Forms (Zero Rejection Guide)',
      'How to Correct Application Form Mistakes in Sarkari Portals After Final Submission (Step-by-Step)',
      'How to Prepare for UPSC Prelims While Working Full-Time (Realistic Daily Study Timetable 2026)',
      'How to Claim OBC Non-Creamy Layer (NCL) Certificate & Income Criteria for Central Jobs',
      'How to Clear Physical Standard Test (PST) and Medical Fitness for Police & Defence Recruitment'
    ],
    why: [
      'Why Sarkari Job Application Forms Get Rejected in Scrutiny: Top 7 Common Errors to Avoid',
      'Why UPS (Unified Pension Scheme) vs NPS Matters for New Government Employees in 2026',
      'Why Candidates Fail in Railway RRB & Police Medical Tests: Medical Disqualification Rules Explained',
      'Why EWS Certificate Gets Rejected in Central Recruitment: Valid Date, Format & Authority Guide'
    ],
    best: [
      'Top 10 High-Paying Government Jobs in India Without Any Interview (Direct Merit Selection 2026)',
      'Best Central Government Jobs for Women Offering High Pay Scale & Work-Life Balance',
      'Best Indian State PSC Exams With Low Competition & High Vacancy Ratios in 2026',
      'Top 5 Highest Paying Public Sector (PSU) Maharatna Jobs for Engineers & Science Graduates'
    ]
  },

  // 🌍 GLOBAL & EXPAT GOVERNMENT PATHWAYS
  global: {
    what: [
      'What is United Nations (UN) Young Professionals Programme (YPP)? Complete Eligibility for Indians',
      'What is USAJOBS Pathways Internship & Expat Hiring System? Step-by-Step Eligibility Guide',
      'What is UK Civil Service Fast Stream & Can International Candidates Apply? (Official Criteria)',
      'What Are The Working Hours, Tax Rules & Expat Benefits in Dubai & UAE Government Ministries?'
    ],
    how: [
      'How to Apply for WHO (World Health Organization) Government Healthcare Careers from India',
      'How to Get Police Clearance Certificate (PCC) for Foreign Government & Expat Job Visas in India',
      'How to Register on UAE Ministry of Health (MOH) Portal for Government Medical Jobs 2026',
      'How to Format a International Standard CV for UN & World Bank Government Vacancies'
    ],
    why: [
      'Why Gulf Government Jobs Offer 100% Tax-Free Salary: Expat Savings, Visa & Reality Explained',
      'Why International Government Job Applications Get Rejected in Automated ATS Scanners'
    ],
    best: [
      'Top 7 Foreign Government Jobs That Offer Verified Work Visa Sponsorship for Indian Citizens',
      'Best High-Paying Multilateral Public Sector Careers at UN, World Bank & IMF (2026 Guide)'
    ]
  }
};

/**
 * Scrape Google Autocomplete for real-time long-tail search queries
 */
async function fetchGoogleAutocompleteQueries(queryPrefix) {
  try {
    const res = await axios.get(GOOGLE_SUGGEST_URL, {
      params: { q: queryPrefix, hl: 'en' },
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (Array.isArray(res.data) && Array.isArray(res.data[1])) {
      return res.data[1]
        .filter(q => typeof q === 'string' && q.length > 15 && q.split(' ').length >= 4)
        .slice(0, 8);
    }
  } catch (err) {
    // Graceful fallback to null
  }
  return [];
}

/**
 * Check if a topic was already published in BlogPost within the last 90 days
 */
async function isTopicAlreadyPublished(topicTitle) {
  if (mongoose.connection.readyState !== 1) return false;
  const BlogPost = mongoose.model('BlogPost');
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const cleanKeyword = topicTitle
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

  if (!cleanKeyword || cleanKeyword.length < 5) return false;

  const existing = await BlogPost.findOne({
    createdAt: { $gte: ninetyDaysAgo },
    $or: [
      { title: new RegExp(cleanKeyword, 'i') },
      { seoTitle: new RegExp(cleanKeyword, 'i') },
      { focusKeyword: new RegExp(cleanKeyword, 'i') }
    ]
  }).select('_id title slug').lean();

  return Boolean(existing);
}

/**
 * Discover the next high-value, un-published Job Guide topic
 * @param {'indian' | 'global'} targetRegion - 'indian' or 'global'
 */
async function discoverNextJobGuideTopic(targetRegion = 'indian') {
  const region = targetRegion === 'global' ? 'global' : 'indian';
  const seedsByIntent = CURATED_JOB_SEEDS[region];
  const intents = ['what', 'how', 'why', 'best'];
  const randomIntent = intents[Math.floor(Math.random() * intents.length)];
  const seedList = seedsByIntent[randomIntent] || seedsByIntent.what;

  // 1. First priority: Pick a fresh seed topic that hasn't been published recently
  const shuffledSeeds = [...seedList].sort(() => Math.random() - 0.5);
  for (const seed of shuffledSeeds) {
    const alreadyDone = await isTopicAlreadyPublished(seed);
    if (!alreadyDone) {
      return {
        topic: seed,
        intent: randomIntent.toUpperCase(),
        region: region
      };
    }
  }

  // 2. Second priority: Query Google Autocomplete for fresh live suggestions
  const seedPrefix = region === 'indian' 
    ? `sarkari job ${randomIntent}` 
    : `government jobs ${randomIntent}`;
    
  const liveSuggestions = await fetchGoogleAutocompleteQueries(seedPrefix);
  for (const suggestion of liveSuggestions) {
    const capitalized = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    const candidateTopic = `${capitalized} (Complete 2026 Guide)`;
    const alreadyDone = await isTopicAlreadyPublished(candidateTopic);
    if (!alreadyDone) {
      return {
        topic: candidateTopic,
        intent: randomIntent.toUpperCase(),
        region: region
      };
    }
  }

  // 3. Fallback: Add year variant to ensure continuous publication
  const fallbackBase = shuffledSeeds[0] || 'Government Jobs Eligibility & Career Guide';
  return {
    topic: `${fallbackBase.replace(/\(2026.*?\)/i, '').trim()} (Updated 2026 Guide)`,
    intent: randomIntent.toUpperCase(),
    region: region
  };
}

module.exports = {
  discoverNextJobGuideTopic,
  isTopicAlreadyPublished,
  CURATED_JOB_SEEDS
};
