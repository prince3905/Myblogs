/**
 * Job SEO & Keyword Targeting Optimization Engine
 *digitalhomeblog.in
 *
 * Implements high-intent long-tail keywords, deterministic high-CTR titles,
 * 140-155 char transactional meta descriptions, clean URL slug sanitization,
 * and valid FAQPage + JobPosting JSON-LD schemas.
 */

function sanitizeJobSlug(title = '', boardName = '', fallbackId = '') {
  let text = `${title}`.toLowerCase();

  // Strip file extensions, brackets, and quotes
  text = text.replace(/\.pdf|\.doc|\.html?/gi, '');
  text = text.replace(/[\(\)\[\]\{\}\<\>]/g, ' ');

  // Remove noise filler words to make slugs punchy & search-focused
  const noiseWords = [
    /\bonline form\b/gi,
    /\bapply online\b/gi,
    /\bclick here\b/gi,
    /\bvarious post\b/gi,
    /\bvarious posts\b/gi,
    /\bdirect link\b/gi,
    /\bofficial portal\b/gi,
    /\bnotification\b/gi,
    /\bdownload\b/gi,
    /\bcheck\b/gi,
    /\bhere\b/gi,
    /\bdetails\b/gi,
    /\blatest\b/gi,
    /\bupdate\b/gi,
    /\bupdated\b/gi,
    /\bnew\b/gi
  ];
  for (const nw of noiseWords) {
    text = text.replace(nw, ' ');
  }

  // Replace special characters with hyphens
  text = text.replace(/[^a-z0-9]+/g, '-');
  // Collapse consecutive hyphens
  text = text.replace(/-+/g, '-');
  // Trim leading/trailing hyphens
  text = text.replace(/^-+|-+$/g, '');

  // Extract year or default to 2026
  const hasYear = /(?:202[4-9]|2030)/.test(text);
  if (!hasYear) {
    text = `${text}-2026`;
  }

  // Ensure 'recruitment' or 'admission' or 'exam' is present for high-intent SEO
  if (!text.includes('recruitment') && !text.includes('admission') && !text.includes('exam') && !text.includes('bharti') && !text.includes('admit-card') && !text.includes('result')) {
    text = text.replace(/-(202[4-9]|2030)$/, '-recruitment-$1');
  }

  // Limit slug length safely
  if (text.length > 80) {
    const parts = text.split('-');
    let truncated = '';
    for (const part of parts) {
      if ((truncated + '-' + part).length > 70) break;
      truncated = truncated ? `${truncated}-${part}` : part;
    }
    const yearMatch = text.match(/(202[4-9]|2030)$/);
    if (yearMatch && !truncated.endsWith(yearMatch[1])) {
      truncated = `${truncated}-${yearMatch[1]}`;
    }
    text = truncated || text.slice(0, 75).replace(/-+$/, '');
  }

  return text || (fallbackId ? `job-${fallbackId}` : 'sarkari-recruitment-2026');
}

/**
 * Extracts structured metadata (Job Name, Year, Vacancy Count, Qualification, Board) from raw alert
 */
function parseJobMetadata(alert = {}) {
  const rawTitle = (alert.title || '').trim();
  const rawBoard = (alert.boardName || '').trim();
  const details = (alert.detailsText || '').trim();

  // 1. Detect Year
  const yearMatch = rawTitle.match(/\b(202[5-9]|2030)\b/) || details.match(/\b(202[5-9]|2030)\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  // 2. Extract Vacancy Count
  let vacancyCount = '';
  const postPatterns = [
    /Total\s*(?:Post|Vacancy|Vacancies|Pad)\s*[:=\-]?\s*(\d{1,6})/i,
    /(\d{1,6})\s*(?:Post|Posts|Vacancy|Vacancies|पदों|पद)\b/i,
    /\b(\d{1,6})\s*Total Vacanc/i
  ];
  for (const pat of postPatterns) {
    const m = rawTitle.match(pat) || details.match(pat);
    if (m && m[1] && parseInt(m[1], 10) > 0) {
      vacancyCount = m[1];
      break;
    }
  }

  // 3. Clean Job Name / Department
  let jobName = rawTitle;
  // Strip trailing site names
  jobName = jobName.replace(/\s*\|\s*(?:Digital Home|Sarkari Result|Official).*$/i, '');
  // Strip redundant phrases at the end like "Online Form 2026", "Online Form", "Apply Online"
  jobName = jobName.replace(/\s*(?:Online Form|Apply Online|Recruitment|Notification)\s*(?:202[4-9]|2030)?\s*$/i, '');
  // Clean extra spaces
  jobName = jobName.replace(/\s+/g, ' ').trim();
  if (!jobName) {
    jobName = rawBoard || 'Government Department';
  }

  // 4. Board Name
  const board = rawBoard && rawBoard !== 'Official Board' ? rawBoard : (alert.state ? `${alert.state} Govt / Commission` : 'Government of India');

  // 5. Qualification Summary
  let qualification = '10th / 12th / ITI / Diploma / Graduate Degree';
  if (/Graduate|Bachelor|Degree|B\.?E|B\.?Tech/i.test(details) || /Graduate|Degree/i.test(rawTitle)) {
    qualification = 'Bachelor Degree / Graduation in Relevant Discipline';
  } else if (/12th|Intermediate|10\+2/i.test(details) || /12th|10\+2/i.test(rawTitle)) {
    qualification = '12th Pass (10+2 Intermediate)';
  } else if (/10th|Matric|High School/i.test(details) || /10th|Matric/i.test(rawTitle)) {
    qualification = '10th Pass (High School Matriculation)';
  } else if (/ITI/i.test(details) || /ITI/i.test(rawTitle)) {
    qualification = '10th Pass with ITI Certificate';
  } else if (/Post Graduate|Master|PG/i.test(details) || /PG|Master/i.test(rawTitle)) {
    qualification = 'Master Degree / Post Graduation';
  }

  return {
    jobName,
    year,
    vacancyCount,
    board,
    qualification,
    state: alert.state || 'All India',
    category: alert.category || 'Latest Job',
    lastDate: alert.lastDate && alert.lastDate !== 'N/A' ? alert.lastDate : 'As per Official Schedule',
    postDate: alert.postDate || '2026',
    applyUrl: alert.officialApplyUrl || alert.officialUrl || alert.sourceUrl || 'https://www.digitalhomeblog.in',
    pdfUrl: alert.officialPdfUrl || alert.sourceUrl || 'https://www.digitalhomeblog.in'
  };
}

const STATE_SHORT_MAP = {
  'uttar pradesh': 'UP',
  'madhya pradesh': 'MP',
  'himachal pradesh': 'HP',
  'andhra pradesh': 'AP',
  'west bengal': 'WB',
  'bihar': 'Bihar',
  'rajasthan': 'Rajasthan',
  'jharkhand': 'Jharkhand',
  'odisha': 'Odisha',
  'haryana': 'Haryana',
  'delhi': 'Delhi',
  'maharashtra': 'Maharashtra',
  'chhattisgarh': 'CG',
  'uttarakhand': 'Uttarakhand',
  'punjab': 'Punjab',
  'gujarat': 'Gujarat'
};

/**
 * Strict High-CTR Dynamic Title Template:
 * `Sarkari Job: ${job.state ? job.state + ' ' : ''}${job.organization} ${job.postName} Recruitment 2026 – Apply Online Form, Eligibility`
 */
function buildHighCtrJobTitle(meta) {
  const { jobName, year = '2026', board, state } = meta;
  const stateStr = (state && state !== 'Central/All India' && state !== 'All India') ? `${state} ` : '';
  const organization = (board && board !== 'Official Board') ? board : (state ? `${state} Govt` : 'Govt of India');
  const postName = jobName || 'Various Posts';

  // Prevent duplicate state prefix if organization already starts with state
  let cleanOrg = organization;
  if (stateStr && cleanOrg.toLowerCase().startsWith(state.toLowerCase())) {
    cleanOrg = cleanOrg.slice(state.length).trim();
  }

  // Prevent duplicate organization prefix if postName already starts with organization
  let cleanPost = postName;
  if (cleanOrg && cleanPost.toLowerCase().startsWith(cleanOrg.toLowerCase())) {
    cleanPost = cleanPost.slice(cleanOrg.length).trim();
  }

  const orgPart = cleanOrg ? `${cleanOrg} ` : '';
  const postPart = cleanPost || 'Vacancies';

  return `Sarkari Job: ${stateStr}${orgPart}${postPart} Recruitment ${year} – Apply Online Form, Eligibility`.replace(/\s+/g, ' ').trim();
}

/**
 * Strict Meta Description packed with high-intent keywords:
 * Starts with "Sarkari Result notification for..."
 */
function buildHighCtrMetaDesc(meta) {
  const { jobName, year = '2026', board, state } = meta;
  const stateStr = (state && state !== 'Central/All India' && state !== 'All India') ? `${state} ` : '';
  const organization = (board && board !== 'Official Board') ? board : (state ? `${state} Govt` : 'Govt of India');
  const postName = jobName || 'Various Posts';

  let baseDesc = `Sarkari Result notification for ${stateStr}${organization} ${postName} Vacancy ${year}. Check eligibility criteria, age limit, application fee, and Apply Online Form at Digital Home.`.replace(/\s+/g, ' ').trim();

  // Enforce 140-160 characters target range
  if (baseDesc.length > 160) {
    const prefix = `Sarkari Result notification for ${stateStr}${organization} `;
    const suffix = ` Vacancy ${year}. Apply Online Form & eligibility at Digital Home.`;
    const allowedPostLen = 160 - (prefix.length + suffix.length);
    if (allowedPostLen > 5) {
      const shortPost = postName.slice(0, allowedPostLen).trim();
      baseDesc = `${prefix}${shortPost}${suffix}`.replace(/\s+/g, ' ').trim();
    } else {
      baseDesc = `Sarkari Result notification for ${stateStr}${organization} Vacancy ${year}. Check eligibility criteria, age limit, and Apply Online Form at Digital Home.`.replace(/\s+/g, ' ').trim();
    }
  }

  return baseDesc;
}

/**
 * Generates Google-compliant FAQPage JSON-LD schema for Rich Snippets
 */
function generateJobFaqSchema(meta) {
  const { jobName, year, vacancyCount, qualification, lastDate, board, applyUrl } = meta;

  const faqs = [
    {
      question: `What is the last date to apply online for ${jobName} Recruitment ${year}?`,
      answer: `The official last date to submit online application for ${jobName} is ${lastDate}. Candidates are advised to submit forms before the deadline to avoid server rush.`
    },
    {
      question: `What is the eligibility qualification required for ${jobName}?`,
      answer: `Candidates must possess ${qualification} from a recognized board or university. Please check the official notification PDF for post-wise detailed eligibility.`
    },
    {
      question: `What is the age limit for ${jobName} ${year}?`,
      answer: `The minimum age is generally 18 years and maximum age is as prescribed in the official circular. Category-wise age relaxations apply for OBC (3 years), SC/ST (5 years), and PwD (10 years) candidates.`
    },
    {
      question: `How many total vacancies are announced for ${jobName}?`,
      answer: vacancyCount
        ? `A total of ${vacancyCount} vacancies have been notified for ${jobName} Recruitment ${year} under ${board}.`
        : `Vacancies for ${jobName} are announced as per the official recruitment gazette issued by ${board}. Refer to the vacancy breakdown table for category details.`
    },
    {
      question: `How to apply online for ${jobName} Recruitment ${year}?`,
      answer: `Visit the official portal at ${applyUrl}, register with your mobile number & email, fill in educational details, upload photo and signature, pay the examination fee online, and download the confirmation page.`
    }
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.answer
      }
    }))
  };
}

module.exports = {
  sanitizeJobSlug,
  parseJobMetadata,
  buildHighCtrJobTitle,
  buildHighCtrMetaDesc,
  generateJobFaqSchema
};
