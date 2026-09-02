const axios = require('axios');
const cheerio = require('cheerio');
const LiveAlert = require('./liveAlert.model');
const { resolveOfficialGovtPortal, isDisallowedThirdPartyDomain } = require('../../shared/utils/govtPortalMap');
const { extractDateFromSlugOrText, parseFlexibleDate } = require('../../shared/utils/dateExtractor');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Regex to identify board/organisation names
const BOARD_PATTERNS = [
  /\bUPSC\b/i, /\bSSC\b/i, /\bRRB\b/i, /\bIBPS\b/i, /\bISRO\b/i, /\bDRDO\b/i,
  /\bLIC\b/i, /\bSBI\b/i, /\bRBI\b/i, /\bNavy\b/i, /\bArmy\b/i, /\bAir Force\b/i,
  /\bPSC\b/i, /\bHigh Court\b/i, /\bRailway\b/i, /\bPolice\b/i, /\bCSIR\b/i, /\bUGC\b/i,
  /\bCBSE\b/i, /\bNTA\b/i, /\bICAR\b/i, /\bBARC\b/i, /\bHAL\b/i, /\bIOCL\b/i,
  /\bBPCL\b/i, /\bONGC\b/i, /\bHPCL\b/i, /\bGAIL\b/i, /\bNTPC\b/i, /\bBHEL\b/i, /\bSAIL\b/i,
  /\bRPSC\b/i, /\bHCL\b/i, /\bCISF\b/i, /\bUPSSSC\b/i, /\bBPSC\b/i, /\bMPPSC\b/i, /\bDSSSB\b/i,
  /\bNFL\b/i, /\bBSNL\b/i, /\bCTET\b/i, /\bUPPBPB\b/i, /\bCSBC\b/i, /\bMPPEB\b/i
];

function extractBoardName(title) {
  for (const pattern of BOARD_PATTERNS) {
    const match = title.match(pattern);
    if (match) return match[0].toUpperCase();
  }
  // Fallback to first 2 words if no matched board
  const words = title.trim().split(/\s+/).slice(0, 2).join(' ');
  return words || 'Govt Board';
}

function parseIndianDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const str = dateStr.trim();
  if (str.includes("अधिसूचना") || str.includes("Check") || str.includes("Notify")) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  let m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), 23, 59, 59);
  }

  // DD Month YYYY e.g. "15 July 2026", "03 August 2026"
  const months = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };
  m = str.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (m) {
    const monthKey = m[2].toLowerCase().slice(0, 3);
    const monthIdx = months[monthKey];
    if (monthIdx !== undefined) {
      return new Date(parseInt(m[3]), monthIdx, parseInt(m[1]), 23, 59, 59);
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isOldOrExpiredAlert(title = '', parsedDate = null, lastDateStr = '') {
  const titleLower = title.toLowerCase();

  // 1. Check exact lastDate against current date
  if (lastDateStr) {
    const deadline = parseIndianDate(lastDateStr);
    if (deadline && deadline < new Date()) {
      return true; // Expired!
    }
  }

  // 2. Check past year in title (1990-2025)
  const hasPastYear = /\b(19\d\d|200\d|201\d|202[0-5])\b/.test(titleLower);
  const hasCurrentOrFutureYear = /\b(2026|2027|2028)\b/.test(titleLower);

  if (hasPastYear && !hasCurrentOrFutureYear) {
    return true;
  }

  if (parsedDate) {
    const postYear = new Date(parsedDate).getFullYear();
    if (postYear < 2026 && !hasCurrentOrFutureYear) {
      return true;
    }
  }

  return false;
}

function detectState(title, href) {
  const combined = `${title || ''} ${href || ''}`;

  const stateRules = [
    { name: "Uttar Pradesh", patterns: [/\bup\b/i, /\bupsssc\b/i, /\buppbpb\b/i, /\buppsc\b/i, /\buttar\s+pradesh\b/i, /\ballahabad\b/i, /\blucknow\b/i, /\/up\//i] },
    { name: "Bihar", patterns: [/\bbpsc\b/i, /\bcsbc\b/i, /\bbihar\b/i, /\bbpssc\b/i, /\bbtsc\b/i, /\bbssc\b/i, /\/bihar\//i] },
    { name: "Madhya Pradesh", patterns: [/\bmppeb\b/i, /\bmppsc\b/i, /\bmpesb\b/i, /\bmadhya\s+pradesh\b/i, /\/mp\//i, /\/mppsc\//i] },
    { name: "Delhi", patterns: [/\bdsssb\b/i, /\bdelhi\b/i, /\/delhi\//i] },
    { name: "Rajasthan", patterns: [/\brpsc\b/i, /\brsmssb\b/i, /\brajasthan\b/i, /\brssb\b/i, /\/rpsc\//i] },
    { name: "Haryana", patterns: [/\bhssc\b/i, /\bhpsc\b/i, /\bharyana\b/i, /\/haryana\//i, /\/hssc\//i] },
    { name: "Jharkhand", patterns: [/\bjpsc\b/i, /\bjssc\b/i, /\bjharkhand\b/i, /\/jharkhand\//i] },
    { name: "Uttarakhand", patterns: [/\bukpsc\b/i, /\buksssc\b/i, /\buttarakhand\b/i, /\/uttarakhand\//i] },
    { name: "Chhattisgarh", patterns: [/\bcgpsc\b/i, /\bchhattisgarh\b/i, /\/cg\//i, /\/cgpsc\//i] },
    { name: "Gujarat", patterns: [/\bgpsc\b/i, /\bgsssb\b/i, /\bgujarat\b/i, /\/gujarat\//i] },
    { name: "Maharashtra", patterns: [/\bmpsc\b/i, /\bmaharashtra\b/i, /\bpune\b/i, /\bmumbai\b/i, /\/maharashtra\//i] },
    { name: "Punjab", patterns: [/\bppsc\b/i, /\bpunjab\b/i, /\/punjab\//i] },
    { name: "West Bengal", patterns: [/\bwbpsc\b/i, /\bwest\s+bengal\b/i, /\bkolkata\b/i, /\/west-bengal\//i] },
    { name: "Odisha", patterns: [/\bopsc\b/i, /\bosssc\b/i, /\bodisha\b/i, /\/odisha\//i] },
    { name: "Andhra Pradesh", patterns: [/\bappsc\b/i, /\bandhra\s+pradesh\b/i, /\/andhra-pradesh\//i] },
    { name: "Telangana", patterns: [/\btspsc\b/i, /\btelangana\b/i, /\/telangana\//i] },
    { name: "Tamil Nadu", patterns: [/\btnpsc\b/i, /\btamil\s+nadu\b/i, /\/tamil-nadu\//i] },
    { name: "Karnataka", patterns: [/\bkpsc\b/i, /\bksp\b/i, /\bkarnataka\b/i, /\/karnataka\//i] },
    { name: "Kerala", patterns: [/\bkerala\b/i, /\/kerala\//i] },
    { name: "Assam", patterns: [/\bapsc\b/i, /\bassam\b/i, /\/assam\//i] }
  ];

  for (const rule of stateRules) {
    if (rule.patterns.some(pattern => pattern.test(combined))) {
      return rule.name;
    }
  }

  // Simple string fallbacks
  const lowerCombined = combined.toLowerCase();
  if (lowerCombined.includes("arunachal")) return "Arunachal Pradesh";
  if (lowerCombined.includes("manipur")) return "Manipur";
  if (lowerCombined.includes("meghalaya")) return "Meghalaya";
  if (lowerCombined.includes("mizoram")) return "Mizoram";
  if (lowerCombined.includes("nagaland")) return "Nagaland";
  if (lowerCombined.includes("tripura")) return "Tripura";
  if (lowerCombined.includes("sikkim")) return "Sikkim";
  if (lowerCombined.includes("goa")) return "Goa";
  if (lowerCombined.includes("himachal")) return "Himachal Pradesh";

  return "Central/All India";
}

function isDetailUrl(href) {
  if (!href || !href.startsWith('http')) return false;
  
  // Must be a link on sarkariresult.com
  if (!href.includes('sarkariresult.com')) {
    return false;
  }
  
  const lower = href.toLowerCase();
  
  // Exclude social media and common static pages
  const excludes = [
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com', 't.me', 'telegram.me',
    'whatsapp.com', 'youtube.com', 'threads.net', 'threads.com', 'play.google.com',
    'apps.apple.com', 'contactus', 'about-us', 'terms-and-conditions', 'disclaimer',
    'privacy-policy', 'googlesyndication.com', 'doubleclick.net', 'share.google'
  ];
  if (excludes.some(ex => lower.includes(ex))) {
    return false;
  }

  let path = '';
  try {
    const urlObj = new URL(href);
    path = urlObj.pathname;
  } catch (e) {
    return false;
  }

  // Clean trailing/leading slash
  if (path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  // If path is empty, it's homepage
  if (!path) return false;

  // Split path parts
  const parts = path.split('/');
  
  // Exclude category list pages themselves
  const categoryPages = [
    'latestjob', 'admitcard', 'result', 'syllabus', 'answerkey', 'admission',
    'important', 'certificate', 'outsourcing', 'certificateverification',
    'up-scholarship', 'page'
  ];
  if (parts.length === 1 && categoryPages.includes(parts[0])) {
    return false;
  }

  // Exclude generic board index pages (e.g. /sscall/, /upscall/, /bpsc/, /upsssc/)
  // These usually don't have hyphens and are very short (e.g., 'bpsc', 'upsssc', 'rpsc', 'sscall')
  const isArchive = parts[parts.length - 1].endsWith('all') || 
                    (parts.length === 1 && parts[0].length <= 8 && !parts[0].includes('-'));
  if (isArchive) {
    return false;
  }

  return true;
}

function detectCategory(title, href) {
  let cleanHref = href || '';
  try {
    if (cleanHref.startsWith('http')) {
      const urlObj = new URL(cleanHref);
      cleanHref = urlObj.pathname;
    }
  } catch (e) {
    // ignore
  }

  const text = `${title} ${cleanHref}`.toLowerCase();
  
  if (text.includes('admit card') || text.includes('admitcard') || text.includes('exam city') || text.includes('hall ticket')) {
    return 'Admit Card';
  }
  if (text.includes('result') || text.includes('score card') || text.includes('scorecard') || text.includes('merit list') || text.includes('merit-list')) {
    return 'Result';
  }
  if (text.includes('syllabus')) {
    return 'Syllabus';
  }
  if (text.includes('answer key') || text.includes('answerkey') || text.includes('solution')) {
    return 'Answer Key';
  }
  if (text.includes('admission') || text.includes('counseling')) {
    return 'Admission';
  }
  if (text.includes('certificate') || text.includes('verification')) {
    return 'Certificate Verification';
  }
  if (text.includes('outsourcing') || text.includes('offline')) {
    return 'Outsourcing / Offline Job';
  }
  return 'Latest Job';
}

function parseLinkText(text) {
  let title = text;
  let lastDate = 'अधिसूचना देखें';

  const parts = text.split('|');
  if (parts.length > 1) {
    title = parts[0].trim();
    const lastDatePart = parts[1];
    const match = lastDatePart.match(/(?:last\s+date\s*:?\s*)(.+)/i);
    if (match) {
      lastDate = match[1].trim();
    } else {
      lastDate = lastDatePart.replace(/last\s+date\s*:?/gi, '').trim();
    }
  } else {
    const lastDateIndex = text.toLowerCase().indexOf('last date');
    if (lastDateIndex !== -1) {
      title = text.substring(0, lastDateIndex).trim();
      const lastDatePart = text.substring(lastDateIndex);
      const match = lastDatePart.match(/(?:last\s+date\s*:?\s*)(.+)/i);
      if (match) {
        lastDate = match[1].trim();
      }
    }
  }

  // Clean trailing/leading dashes, colons from title
  title = title.replace(/^[\s\-:|]+|[\s\-:|]+$/g, '').trim();
  
  if (lastDate.toLowerCase().includes('check detail') || lastDate.toLowerCase().includes('check official')) {
    lastDate = 'अधिसूचना देखें';
  }

  return { title, lastDate };
}

function parsePostDate(str) {
  if (!str) return null;
  const monthMatch = str.match(/(\d{1,2})[\s\-/.]*([a-zA-Z]+)[\s\-/.]*(\d{4})/);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthStr = monthMatch[2];
    const year = parseInt(monthMatch[3], 10);
    const d = new Date(`${day} ${monthStr} ${year}`);
    if (!isNaN(d.getTime())) return d;
  }
  const numMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const month = parseInt(numMatch[2], 10) - 1;
    const year = parseInt(numMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
}

async function scrapeDetailedUrls(pageUrl) {
  try {
    const res = await axios.get(pageUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const $ = cheerio.load(res.data);
    
    let officialApplyUrl = '';
    let officialPdfUrl = '';
    let officialUrl = '';
    let postDate = '';
    let lastDate = '';

    // 1. Extract Post Date
    $('tr, li, p, td, div').each((i, el) => {
      if (postDate) return;
      const text = $(el).text();
      if (text.includes('Post Date / Update :') || text.includes('Post Date:') || text.includes('Post Date / Update:')) {
        const val = $(el).find('td').last().text().trim();
        if (val && /\d{1,2}/.test(val)) {
          postDate = val;
        } else {
          const parts = text.split(':');
          if (parts.length > 1) {
            postDate = parts.slice(1).join(':').trim();
          }
        }
      }
    });

    if (!postDate) {
      const bodyText = $('body').text();
      const match = bodyText.match(/Post Date\s*\/?\s*Update\s*:\s*([^\n|]+)/i);
      if (match) {
        postDate = match[1].trim();
      }
    }

    if (postDate) {
      postDate = postDate.replace(/[\s\-:|]+/g, ' ').trim();
    }

    // 2. Extract authentic lastDate (End Date) from Table / List / Body
    $('tr, li, p, td').each((i, el) => {
      if (lastDate) return;
      const text = $(el).text().trim();
      const lower = text.toLowerCase();
      if (
        lower.includes('last date for apply') ||
        lower.includes('last date to apply') ||
        lower.includes('last date apply') ||
        lower.includes('registration last date') ||
        lower.includes('application last date') ||
        lower.includes('apply online last date') ||
        lower.includes('closing date') ||
        lower.includes('last date :') ||
        lower.includes('last date:')
      ) {
        const dateMatch = text.match(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/);
        if (dateMatch) {
          lastDate = dateMatch[0];
        } else {
          const wordDateMatch = text.match(/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i);
          if (wordDateMatch) {
            lastDate = wordDateMatch[0];
          }
        }
      }
    });

    if (!lastDate) {
      const bodyText = $('body').text();
      const dateRegex = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g;
      const wordDateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
      const lastDateMatch = bodyText.match(/(?:last\s+date|apply\s+till|deadline|closing\s+date)[^\n]{0,50}/i);
      if (lastDateMatch) {
        const lineText = lastDateMatch[0];
        const match = dateRegex.exec(lineText);
        if (match) {
          lastDate = match[0];
        } else {
          const wordMatch = wordDateRegex.exec(lineText);
          if (wordMatch) {
            lastDate = wordMatch[0];
          }
        }
      }
    }

    // 3. Extract direct official links specifically from the "Important Links" table
    const isCompetitorDomain = (url = '') => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return (
        lower.includes('sarkariresult') ||
        lower.includes('sarkari-result') ||
        lower.includes('freejobalert') ||
        lower.includes('sarkariexam') ||
        lower.includes('jobalerts')
      );
    };

    const excludes = [
      'instagram.com', 'facebook.com', 'twitter.com', 'x.com', 't.me', 'telegram.me',
      'whatsapp.com', 'youtube.com', 'threads.net', 'threads.com', 'play.google.com',
      'apps.apple.com', 'itunes.apple.com', 'contactus', 'about-us', 'terms-and-conditions', 'disclaimer',
      'privacy-policy', 'googlesyndication.com', 'doubleclick.net', 'share.google'
    ];

    $('table').each((i, tbl) => {
      $(tbl).find('tr').each((rIdx, tr) => {
        const rowCells = $(tr).find('td, th');
        if (rowCells.length < 2) return;

        const labelText = $(rowCells[0]).text().replace(/\s+/g, ' ').trim().toLowerCase();
        const actionCell = $(rowCells[rowCells.length - 1]);

        actionCell.find('a').each((aIdx, a) => {
          let href = ($(a).attr('href') || '').trim();
          if (!href || href.startsWith('javascript:') || href === '#') return;
          if (excludes.some(ex => href.toLowerCase().includes(ex))) return;

          // Catch tool URLs → redirect to our own tools page
          if (
            (href.toLowerCase().includes('tool') || href.toLowerCase().includes('resize') || href.toLowerCase().includes('compress') || href.toLowerCase().includes('crop') || href.toLowerCase().includes('convert') || href.toLowerCase().includes('age')) &&
            isCompetitorDomain(href)
          ) {
            return;
          }

          // 1. Row: Apply Online / Online Form / Registration
          if (
            labelText.includes('apply online') ||
            labelText.includes('online apply') ||
            labelText === 'apply online' ||
            labelText.includes('online form') ||
            labelText.includes('apply link')
          ) {
            if (!officialApplyUrl && !isCompetitorDomain(href)) {
              officialApplyUrl = href;
            }
          }

          // 2. Row: Download Notification / Exam Notice / PDF
          if (
            labelText.includes('notification') ||
            labelText.includes('exam notice') ||
            labelText.includes('advertisement') ||
            labelText.includes('download pdf') ||
            labelText.includes('download details')
          ) {
            if (!officialPdfUrl && !isCompetitorDomain(href)) {
              officialPdfUrl = href;
            }
          }

          // 3. Row: Official Website / Portal
          if (
            labelText.includes('official website') ||
            labelText.includes('official portal') ||
            labelText.includes('board website') ||
            labelText === 'official website'
          ) {
            if (!officialUrl && !isCompetitorDomain(href)) {
              officialUrl = href;
            }
          }
        });
      });
    });

    // Fallback search across all page anchors for official gov/nic domains (never competitor links)
    if (!officialUrl) {
      $('a').each((i, el) => {
        const href = ($(el).attr('href') || '').trim();
        if (!href || href.startsWith('javascript:') || isCompetitorDomain(href)) return;
        const lowerHref = href.toLowerCase();
        if (excludes.some(ex => lowerHref.includes(ex))) return;

        if ((lowerHref.includes('.gov.in') || lowerHref.includes('.nic.in') || lowerHref.includes('.ac.in') || lowerHref.includes('.edu.in')) && !isCompetitorDomain(href)) {
          officialUrl = href;
        }
      });
    }

    // 4. Extract vacancy details tables text
    let detailsText = '';
    $('table').each((tIdx, el) => {
      $(el).find('tr').each((rIdx, trEl) => {
        const rowText = $(trEl).text().toLowerCase();
        
        // Skip social media/app links rows
        if (
          rowText.includes('telegram') || 
          rowText.includes('whatsapp') || 
          rowText.includes('mobile app') || 
          rowText.includes('android app') || 
          rowText.includes('apple ios app') ||
          rowText.includes('join sarkari') ||
          rowText.includes('itunes.apple.com') ||
          rowText.includes('play.google.com') ||
          rowText.includes('facebook.com') ||
          rowText.includes('twitter.com') ||
          rowText.includes('instagram.com') ||
          rowText.includes('youtube.com') ||
          rowText.includes('sarkariresult.com/app')
        ) {
          return;
        }

        const rowCells = [];
        $(trEl).find('td, th').each((cIdx, tdEl) => {
          let cellText = $(tdEl).text().trim().replace(/\s+/g, ' ');
          
          // Extract and resolve links in this cell
          const cellLinks = [];
          $(tdEl).find('a').each((aIdx, aEl) => {
            const href = $(aEl).attr('href');
            if (href && !href.startsWith('javascript:')) {
              const baseUrl = 'https://www.sarkariresult.com';
              let resolvedHref = href.startsWith('http') 
                ? href 
                : (href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`);
              
              const lower = resolvedHref.toLowerCase();
              
              // Skip promotional / third-party brand links entirely
              if (
                lower.includes('telegram') ||
                lower.includes('whatsapp') ||
                lower.includes('itunes.apple.com') ||
                lower.includes('play.google.com') ||
                lower.includes('facebook') ||
                lower.includes('twitter') ||
                lower.includes('instagram') ||
                lower.includes('youtube.com') ||
                lower.includes('sarkariresult.com/app')
              ) {
                return;
              }

              if (
                (lower.includes('sarkariresult') || lower.includes('freejobalert') || lower.includes('ilovepdf') || lower.includes('imageresizer') || lower.includes('pdfresizer')) &&
                (lower.includes('tool') || lower.includes('resize') || lower.includes('compress') || lower.includes('crop') || lower.includes('convert') || lower.includes('age'))
              ) {
                resolvedHref = '/tools';
              } else if (lower.includes('sarkariresult') || lower.includes('freejobalert') || lower.includes('sarkari-result') || lower.includes('sarkariexam') || lower.includes('jobalerts')) {
                // Block ALL competitor links — don't add to cellLinks
                return;
              }
              
              cellLinks.push(resolvedHref);
            }
          });
          
          if (cellLinks.length > 0) {
            cellText += ` (Link: ${cellLinks.join(', ')})`;
          }
          
          // Clean cell text from third-party tools branding
          cellText = cellText
            .replace(/sarkari\s*result\s*tools?/gi, 'Student Utility Tools')
            .replace(/sarkari\s*result\s*(?:image|photo|signature|document)?\s*(?:resizer|compressor|cropper|maker|tool)/gi, 'Student Utility Tools')
            .replace(/sarkari\s*(?:image|photo|signature|document)?\s*(?:resizer|compressor|cropper|maker|tool)/gi, 'Student Utility Tools')
            .replace(/sarkariresult\s*(?:image|photo|signature|document)?\s*(?:resizer|compressor|cropper|maker|tool)/gi, 'Student Utility Tools')
            .replace(/\bphoto\s*resizer\b/gi, 'Student Utility Tools')
            .replace(/\bsignature\s*cropper\b/gi, 'Student Utility Tools');

          rowCells.push(cellText);
        });
        
        if (rowCells.length > 0) {
          detailsText += rowCells.join(' | ') + '\n';
        }
      });
      detailsText += '\n';
    });

    if (!detailsText || detailsText.trim().length < 100) {
      const container = $('.entry-content, #content, .post, article, main, body');
      container.find('h1, h2, h3, h4, h5, p, li, tr, div').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 20 && !detailsText.includes(text)) {
          detailsText += text + '\n';
        }
      });
    }

    detailsText = detailsText.trim();
    detailsText = cleanDetailsText(detailsText);

    return { postDate, lastDate, officialUrl, officialPdfUrl, officialApplyUrl, detailsText };
  } catch (err) {
    console.error('[LiveAlert Scraper] Detail scrape failed for', pageUrl, err.message);
    return { postDate: '', lastDate: '', officialUrl: '', officialPdfUrl: '', officialApplyUrl: '' };
  }
}

function stripSarkariResultMentionsAndLinks(str = '', title = '', boardName = '') {
  if (!str || typeof str !== 'string') return str;

  let cleaned = str;

  // 1. Remove Source Link rows entirely
  cleaned = cleaned.replace(/^.*(?:source\s*link|source\s*url|source\s*:).*$/gim, '');

  // 2. Replace raw competitor URLs with authentic government portal or /job-alerts
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?(?:sarkariresult|freejobalert|sarkariexam|jobalerts|rojgarresult)\.com[^\s"'\)<>]*/gi, () => {
    return resolveOfficialGovtPortal(title, boardName, '');
  });

  // 3. Remove/replace text mentions & brand phrases
  cleaned = cleaned
    .replace(/sarkari\s*result\s*official\s*(?:website|app|portal|tools?)/gi, 'Official Government Portal')
    .replace(/sarkari\s*result\s*(?:tools?|resizer|cropper|compressor)/gi, 'Student Utility Tools')
    .replace(/sarkari\s*result/gi, 'Official Portal')
    .replace(/sarkariresult/gi, 'Official Portal')
    .replace(/sarkari\s*resut/gi, 'Official Portal')
    .replace(/sarkari\s*reult/gi, 'Official Portal')
    .replace(/freejobalert/gi, 'Official Portal')
    .replace(/sarkariexam/gi, 'Official Portal')
    .replace(/rojgarresult/gi, 'Official Portal');

  return cleaned;
}

function cleanDetailsText(text) {
  if (!text) return '';
  const lowerAll = text.toLowerCase();
  if (
    lowerAll.includes('menu home latest job') ||
    lowerAll.includes('powered by wordpress') ||
    lowerAll.includes('username or email address') ||
    lowerAll.includes('wp_attempt_focus') ||
    lowerAll.includes('lost your password')
  ) {
    return '';
  }

  const lines = text.split('\n');
  const cleanedLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    
    // 1. Drop competitor promotional / social / app rows completely
    if (
      lower.includes('join sarkari') ||
      lower.includes('telegram') ||
      lower.includes('whatsapp') ||
      lower.includes('t.me/') ||
      lower.includes('whatsapp.com/channel') ||
      lower.includes('android app') ||
      lower.includes('apple ios app') ||
      lower.includes('mobile app') ||
      lower.includes('play.google.com') ||
      lower.includes('itunes.apple.com') ||
      lower.includes('registered trademark') ||
      lower.includes('intellectual property') ||
      lower.includes('application no. 4531613') ||
      lower.includes('since 2012') ||
      lower.includes('welcome to this official website') ||
      lower.includes('for feedback / advertising') ||
      lower.includes('support@sarkariresult') ||
      lower.includes('for the latest updates on sarkari') ||
      lower.includes('www.sarkariresult.com') || 
      lower.includes('sarkariresult®') || 
      lower.includes('sarkariresult.com/') || 
      lower.includes('sarkari result official') ||
      lower.includes('visit sarkariresult.com') ||
      lower.includes('freejobalert.com') ||
      lower.includes('sarkariexam.com')
    ) {
      continue;
    }

    // 2. Check if this row is a tools row -> convert to our internal /tools
    const isToolsRow = lower.includes('resizer') || lower.includes('compressor') || lower.includes('cropper') || 
                       lower.includes('maker') || lower.includes('age calculator') || lower.includes('pdf tools') || 
                       lower.includes('resume cv') || lower.includes('signature crop') || lower.includes('photo resize') ||
                       (lower.includes('link:') && (lower.includes('tools') || lower.includes('resize') || lower.includes('compress')));

    if (isToolsRow) {
      cleanedLines.push('Student Utility Tools: Photo Resizer, Signature Cropper, Age Calculator, PDF Compressor (Link: /tools)');
      continue;
    }

    // 3. Clean any remaining bad strings inside the line
    let cleanedLine = stripSarkariResultMentionsAndLinks(trimmed);
    cleanedLine = cleanedLine.replace(/\s*\(Link:\s*\)/gi, '').trim();

    if (cleanedLine) {
      cleanedLines.push(cleanedLine);
    }
  }

  return stripSarkariResultMentionsAndLinks(cleanedLines.join('\n'));
}

async function scrapeFeeds() {
  console.log('[LiveAlert Scraper] Starting multi-source DOM scraping...');
  // Clean up any old listings from other sources
  await LiveAlert.deleteMany({ source: { $nin: ['SarkariResult', 'Official Portal'] } });



  let totalSaved = 0;
  const listLinks = [];

  const targets = [
    'https://www.sarkariresult.com/',
    'https://www.sarkariresult.com/latestjob/',
    'https://www.sarkariresult.com/admitcard/',
    'https://www.sarkariresult.com/result/',
    'https://www.sarkariresult.com/syllabus/',
    'https://www.sarkariresult.com/answerkey/',
    'https://www.sarkariresult.com/admission/',
    'https://www.sarkariresult.com/important/',
    'https://www.sarkariresult.com/certificate/',
    'https://www.sarkariresult.com/outsourcing/'
  ];

  for (const targetUrl of targets) {
    try {
      console.log(`[LiveAlert Scraper] Fetching target list: ${targetUrl}`);
      const res = await axios.get(targetUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      
      const $ = cheerio.load(res.data);
      
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const rawText = $(el).text().trim();
        if (href && rawText) {
          const fullHref = href.startsWith('http') 
            ? href 
            : (href.startsWith('/') ? `https://www.sarkariresult.com${href}` : `https://www.sarkariresult.com/${href}`);

          if (isDetailUrl(fullHref)) {
            if (!listLinks.some(l => l.href === fullHref)) {
              listLinks.push({ text: rawText, href: fullHref });
            }
          }
        }
      });
    } catch (err) {
      console.error(`[LiveAlert Scraper] List fetch failed for ${targetUrl}:`, err.message);
    }
  }

  console.log(`[LiveAlert Scraper] Found ${listLinks.length} total unique listings across sources.`);

  // Caching optimization: fetch all existing sourceUrls from the database that already have details
  const existingAlerts = await LiveAlert.find({}, { sourceUrl: 1, detailsText: 1 });
  const existingMap = new Map(existingAlerts.map(doc => [doc.sourceUrl, !!doc.detailsText]));

  // Filter listLinks to only include those that either don't exist in DB, or exist but have no detailsText
  const pendingListings = listLinks.filter(listing => {
    const hasDetails = existingMap.get(listing.href);
    return hasDetails === undefined || hasDetails === false;
  });

  console.log(`[LiveAlert Scraper] ${pendingListings.length} of ${listLinks.length} listings are new or pending detail fetch.`);

  // Limit processing to top 150 pending listings to prevent API/network overload per sync run
  const listingsToProcess = pendingListings.slice(0, 150);
  console.log(`[LiveAlert Scraper] Processing top ${listingsToProcess.length} pending listings...`);

  for (const listing of listingsToProcess) {
    try {
      const { text, href } = listing;

      // Handle direct PDF links
      if (href.toLowerCase().endsWith('.pdf')) {
        const dateInfo = extractDateFromSlugOrText(href, text, '');
        const board = extractBoardName(text);
        const safeGovtUrl = resolveOfficialGovtPortal(text, board, href);

        await LiveAlert.updateOne(
          { sourceUrl: href },
          {
            $set: {
              title: text,
              boardName: extractBoardName(text),
              lastDate: 'Check PDF Notice',
              postDate: dateInfo.postDate,
              parsedPostDate: dateInfo.parsedDate,
              officialUrl: safeGovtUrl,
              officialPdfUrl: safeGovtUrl,
              officialApplyUrl: safeGovtUrl,
              source: 'Official Portal',
              state: detectState(text, href),
              category: detectCategory(text, href),
              detailsText: 'Direct PDF notification link'
            },
            $setOnInsert: {
              status: 'active'
            }
          },
          { upsert: true }
        );
        console.log(`[LiveAlert Scraper] Saved direct PDF alert: "${text}"`);
        totalSaved++;
        continue;
      }

      // Random sleep multiplier (1-2 seconds delay)
      const delay = 1000 + Math.floor(Math.random() * 1000);
      console.log(`[LiveAlert Scraper] Sleeping for ${delay}ms before detail fetch...`);
      await sleep(delay);

      console.log(`[LiveAlert Scraper] Fetching details for: ${href}`);
      const details = await scrapeDetailedUrls(href);

      const { title, lastDate } = parseLinkText(text);
      const boardName = extractBoardName(title);
      const state = detectState(title, href);

      const dateInfo = extractDateFromSlugOrText(href, title, details.detailsText);
      const parsedDate = parseFlexibleDate(details.postDate) || dateInfo.parsedDate;
      const finalPostDate = details.postDate || dateInfo.postDate;

      // Fallback detailsText generator if scraping yields short text so NO job alert is ever skipped
      let finalDetailsText = details.detailsText ? details.detailsText.trim() : '';
      const safeGovtFallback = resolveOfficialGovtPortal(title, boardName, href);

      if (finalDetailsText.length < 50) {
        console.log(`[LiveAlert Scraper] Applying fallback detailsText for alert: "${title}"`);
        finalDetailsText = `Official Notification Alert: ${title}\nBoard/Organisation: ${boardName}\nState: ${state}\nCategory: ${detectCategory(title, href)}\nOfficial Portal: ${safeGovtFallback}\n\nKey Highlights:\n- Official recruitment announcement for ${title}.\n- Online application form and official notification links are active.\n- Interested candidates should check eligibility details and apply via the official link below.`;
      }

      // CRITICAL: Preserve exact scraped direct official links (SSO/IBPS/RRB/PDFs), and only use portal map if empty or competitor URL
      const isCleanDirectUrl = (u) => {
        if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
        return !isDisallowedThirdPartyDomain(u) && !u.includes('digitalhomeblog.in');
      };

      const finalLastDate = details.lastDate || lastDate || 'Check Official Notice';
      const finalOfficialApplyUrl = isCleanDirectUrl(details.officialApplyUrl)
        ? details.officialApplyUrl
        : resolveOfficialGovtPortal(title, boardName, safeGovtFallback);

      const finalOfficialPdfUrl = isCleanDirectUrl(details.officialPdfUrl)
        ? details.officialPdfUrl
        : resolveOfficialGovtPortal(title, boardName, safeGovtFallback);

      const finalOfficialUrl = isCleanDirectUrl(details.officialUrl)
        ? details.officialUrl
        : resolveOfficialGovtPortal(title, boardName, safeGovtFallback);

      // Final text sanitization — strip any remaining competitor mentions
      const cleanTitle = stripSarkariResultMentionsAndLinks(title);
      finalDetailsText = stripSarkariResultMentionsAndLinks(finalDetailsText);

      const isExpired = isOldOrExpiredAlert(title, parsedDate, finalLastDate);
      const computedStatus = isExpired ? 'expired' : 'active';

      // Save or update to DB
      await LiveAlert.updateOne(
        { sourceUrl: href },
        {
          $set: {
            title: cleanTitle,
            boardName,
            lastDate: finalLastDate,
            postDate: finalPostDate,
            parsedPostDate: parsedDate,
            officialUrl: finalOfficialUrl,
            officialPdfUrl: finalOfficialPdfUrl,
            officialApplyUrl: finalOfficialApplyUrl,
            source: 'Official Portal',
            state,
            category: detectCategory(title, href),
            detailsText: finalDetailsText,
            status: computedStatus
          }
        },
        { upsert: true }
      );
      
      console.log(`[LiveAlert Scraper] Saved alert: "${cleanTitle}" [State: ${state}]`);
      totalSaved++;
    } catch (err) {
      console.error(`[LiveAlert Scraper] Failed to process listing:`, listing.href, err.message);
    }
  }

  console.log(`[LiveAlert Scraper] Completed! Saved/updated ${totalSaved} raw alerts.`);

  // Autopilot Trigger: Find all active alerts and automatically draft blog posts for them in the background
  try {
    const Settings = require('../settings/settings.model');
    const disableSetting = await Settings.findOne({ key: 'disableAutopilot' });
    const isAutopilotDisabled = disableSetting ? disableSetting.value === true : process.env.DISABLE_AUTOPILOT === 'true';

    if (isAutopilotDisabled) {
      console.log('[Autopilot] Automatic drafting is disabled via settings toggle.');
      return totalSaved;
    }
  } catch (dbErr) {
    console.error('[Autopilot] Settings database check failed:', dbErr.message);
  }

  try {
    // Process active alerts created within the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    console.log(`[Autopilot] Scanning for active alerts (created after: ${threeDaysAgo.toISOString()})...`);
    const activeAlerts = await LiveAlert.find({ 
      status: 'active',
      createdAt: { $gte: threeDaysAgo }
    }).limit(3);
    if (activeAlerts.length > 0) {
      console.log(`[Autopilot] Found active alerts. Processing a limited batch of ${activeAlerts.length} alerts to prevent API overload...`);
      const Settings = require('../settings/settings.model');
      const { draftAlertToPostDoc } = require('./liveAlert.controller');
      for (const alert of activeAlerts) {
        try {
          const disableSetting = await Settings.findOne({ key: 'disableAutopilot' });
          const isAutopilotDisabled = disableSetting ? disableSetting.value === true : process.env.DISABLE_AUTOPILOT === 'true';
          if (isAutopilotDisabled) {
            console.log('[Autopilot] Mid-run cancellation detected: Autopilot was turned OFF. Aborting remaining batch.');
            break;
          }
        } catch (checkErr) {
          console.warn('[Autopilot] Failed to check status mid-run:', checkErr.message);
        }

        try {
          console.log(`[Autopilot] Automatically drafting post for alert: "${alert.title}"`);
          await draftAlertToPostDoc(alert);
          
          // Introduce a 20-second delay between alerts to respect API rate limits
          console.log(`[Autopilot] Waiting 20 seconds before next auto-draft to respect API rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 20000));
        } catch (draftErr) {
          console.error(`[Autopilot] Failed to auto-draft alert "${alert.title}":`, draftErr.message);
          
          if (draftErr.message && (draftErr.message.includes('429') || draftErr.message.includes('Rate limit'))) {
            console.warn(`[Autopilot] Rate limit (429) detected! Aborting the remaining batch to let the API cooldown.`);
            break; // Abort this scraper run's loop
          }
          
          // 10 second cooldown on other failures
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
  } catch (autoErr) {
    console.error(`[Autopilot] Main auto-draft trigger failed:`, autoErr.message);
  }

  return totalSaved;
}

async function publishNextQueuedPost() {
  try {
    const Settings = require('../settings/settings.model');
    const disableSetting = await Settings.findOne({ key: 'disableQueuePublisher' });
    // Default to false (ENABLED) so scheduled posts automatically publish and share to Telegram
    const isPublisherDisabled = disableSetting ? disableSetting.value === true : false;

    if (isPublisherDisabled) {
      console.log('[Queue Publisher] Auto-publishing skipped: Queue Publisher is disabled in settings.');
      return;
    }

    const BlogPost = require('../posts/post.model');
    // Find the oldest draft post (FIFO queue)
    const oldestDraft = await BlogPost.findOne({ status: 'draft' }).sort({ createdAt: 1 });
    if (!oldestDraft) {
      console.log('[Queue Publisher] No draft posts in queue to publish.');
      return;
    }

    console.log(`[Queue Publisher] Automatically publishing oldest queued draft: "${oldestDraft.title}"`);
    oldestDraft.status = 'published';
    oldestDraft.publishedAt = new Date();
    await oldestDraft.save(); // Automatically triggers Google Indexing & Two-Way linking hooks!

    // Auto share to Telegram & WhatsApp Channel
    try {
      const { sendTelegramMessage } = require('../../shared/services/telegramService');
      await sendTelegramMessage(oldestDraft);
      console.log(`[Queue Publisher] Successfully shared auto-published post to Telegram: "${oldestDraft.title}"`);
    } catch (tgErr) {
      console.error('[Queue Publisher] Failed to send Telegram message for auto-published post:', tgErr.message);
    }

    try {
      const { sendWhatsappChannelMessage } = require('../../shared/services/whatsappService');
      await sendWhatsappChannelMessage(oldestDraft);
      console.log(`[Queue Publisher] Successfully shared auto-published post to WhatsApp: "${oldestDraft.title}"`);
    } catch (waErr) {
      console.error('[Queue Publisher] Failed to send WhatsApp message for auto-published post:', waErr.message);
    }
  } catch (err) {
    console.error('[Queue Publisher] Error during scheduled auto-publish:', err.message);
  }
}
function initScheduler() {
  const cron = require('node-cron');
  const { logAutomation } = require('../../shared/utils/automationLogger');
  const { runCompetitorPurge } = require('../../shared/utils/purgeCompetitorLinksDaemon');
  
  // 1. Competitor Link Purge & Official Link Resolver: Runs every 2 hours (saves CPU & database resources)
  cron.schedule('0 */2 * * *', async () => {
    try {
      await runCompetitorPurge();
    } catch (err) {
      console.error('[LiveAlert Scheduler] 2h Competitor Purge error:', err.message);
    }
  });

  // Helper to sweep all live alerts whose deadline has passed or belong to past years
  async function sweepExpiredLiveAlerts() {
    try {
      const now = new Date();
      const activeAlerts = await LiveAlert.find({ status: { $in: ['active', 'published'] } });
      let expiredCount = 0;
      for (const a of activeAlerts) {
        let isExpired = false;
        if (a.lastDate) {
          const deadline = parseIndianDate(a.lastDate);
          if (deadline && deadline < now) {
            isExpired = true;
          }
        }
        if (!isExpired && isOldOrExpiredAlert(a.title, a.parsedPostDate, a.lastDate)) {
          isExpired = true;
        }
        if (isExpired) {
          await LiveAlert.updateOne({ _id: a._id }, { $set: { status: 'expired' } });
          expiredCount++;
        }
      }
      if (expiredCount > 0) {
        console.log(`[Auto Expiry Sweep] Automatically transitioned ${expiredCount} expired alerts to 'expired' status.`);
      }
    } catch (err) {
      console.error('[Auto Expiry Sweep] Error:', err.message);
    }
  }

  // Scraper Run: Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await sweepExpiredLiveAlerts();
      logAutomation({ service: 'SCRAPER', level: 'INFO', action: '15m Scraper Start', message: 'Cron job initiated multi-source DOM scrape' });
      const totalSaved = await scrapeFeeds();
      await sweepExpiredLiveAlerts();
      logAutomation({ service: 'SCRAPER', level: 'SUCCESS', action: '15m Scraper Finish', message: `Scraper completed successfully. Processed/Saved ${totalSaved || 0} updates.`, metadata: { totalSaved } });
    } catch (err) {
      console.error('[LiveAlert Scheduler] Cron task error:', err.message);
      logAutomation({ service: 'SCRAPER', level: 'ERROR', action: '15m Scraper Failed', message: err.message });
    }
  });

  // Queue Publisher: Daily at 9:00 AM and 6:00 PM (IST / Server Time)
  cron.schedule('0 9,18 * * *', async () => {
    try {
      const Settings = require('../settings/settings.model');
      const disableSetting = await Settings.findOne({ key: 'disableQueuePublisher' });
      const isPublisherDisabled = disableSetting ? disableSetting.value === true : true;

      if (isPublisherDisabled) {
        console.log('[LiveAlert Scheduler] Queue publisher skipped: Queue Publisher is disabled in settings.');
        return;
      }

      console.log('[LiveAlert Scheduler] Executing scheduled peak-hour queue publisher...');
      logAutomation({ service: 'SYSTEM_CRON', level: 'INFO', action: 'Peak-Hour Queue Publisher', message: 'Executing scheduled peak-hour queue publisher for Telegram/WhatsApp' });
      await publishNextQueuedPost();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Queue publisher error:', err.message);
      logAutomation({ service: 'SYSTEM_CRON', level: 'ERROR', action: 'Queue Publisher Failed', message: err.message });
    }
  });

  // Expiry Daemon: Daily at midnight (00:00 AM Server Time)
  cron.schedule('0 0 * * *', async () => {
    try {
      const Settings = require('../settings/settings.model');
      const expirySetting = await Settings.findOne({ key: 'disableExpiryDaemon' });
      const isExpiryDisabled = expirySetting ? expirySetting.value === true : false;
      
      if (isExpiryDisabled) {
        console.log('[LiveAlert Scheduler] Daily post expiry check skipped: Expiry Daemon is disabled in settings.');
        return;
      }

      console.log('[LiveAlert Scheduler] Running daily post expiry check...');
      logAutomation({ service: 'SYSTEM_CRON', level: 'INFO', action: 'Midnight Expiry Daemon', message: 'Running daily job alert expiry check' });
      const { checkAndFlagExpiredPosts } = require('../../shared/utils/expiryDaemon');
      await checkAndFlagExpiredPosts();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Expiry Daemon error:', err.message);
      logAutomation({ service: 'SYSTEM_CRON', level: 'ERROR', action: 'Expiry Daemon Failed', message: err.message });
    }
  });

  // Auto GSC Traffic Booster Daemon: Runs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('[LiveAlert Scheduler] Running Auto GSC Traffic Booster Daemon...');
      const { runAutoGscBoost } = require('../../shared/utils/gscAutoBooster');
      await runAutoGscBoost();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Auto GSC Booster Daemon error:', err.message);
    }
  });

  // PageSpeed 2x Daily Performance Monitor (8:00 AM & 8:00 PM IST)
  try {
    const { initPageSpeedMonitorCron } = require('../../shared/services/pageSpeedMonitorCron');
    initPageSpeedMonitorCron();
  } catch (psErr) {
    console.error('[LiveAlert Scheduler] PageSpeed Monitor Cron init failed:', psErr.message);
  }

  console.log('[LiveAlert Scheduler] Node-cron initialized: Scraper (15m), Queue (9AM, 6PM), PageSpeed Monitor (8AM, 8PM), Auto-GSC Boost (6h) & Expiry (00:00).');
  logAutomation({ service: 'SYSTEM_CRON', level: 'SUCCESS', action: 'Scheduler Initialized', message: 'Node-cron active for Scraper (15m), Queue (9AM, 6PM), PageSpeed Monitor (8AM, 8PM), Auto-GSC Boost (6h) & Expiry (00:00)' });

  // Run initial startup tasks immediately (asynchronously in the background)
  Promise.resolve().then(async () => {
    const { logAutomation } = require('../../shared/utils/automationLogger');
    console.log('[LiveAlert Scheduler] Running initial startup scrape...');
    logAutomation({ service: 'SCRAPER', level: 'INFO', action: 'Startup Scraper Start', message: 'Triggered initial background DOM scrape for job alert feeds' });
    try {
      const totalSaved = await scrapeFeeds();
      console.log('[LiveAlert Scheduler] Initial startup scrape completed successfully.');
      logAutomation({ service: 'SCRAPER', level: 'SUCCESS', action: 'Startup Scraper Finish', message: `Initial background DOM scrape finished. ${totalSaved || 0} alerts processed/saved.`, metadata: { totalSaved } });
    } catch (err) {
      console.error('[LiveAlert Scheduler] Initial startup scrape failed:', err.message);
      logAutomation({ service: 'SCRAPER', level: 'ERROR', action: 'Startup Scraper Failed', message: err.message });
    }

    console.log('[LiveAlert Scheduler] Running initial startup post expiry check...');
    try {
      const Settings = require('../settings/settings.model');
      const expirySetting = await Settings.findOne({ key: 'disableExpiryDaemon' });
      const isExpiryDisabled = expirySetting ? expirySetting.value === true : false;
      
      if (isExpiryDisabled) {
        console.log('[LiveAlert Scheduler] Startup post expiry check skipped: Expiry Daemon is disabled in settings.');
      } else {
        const { checkAndFlagExpiredPosts } = require('../../shared/utils/expiryDaemon');
        await checkAndFlagExpiredPosts();
        console.log('[LiveAlert Scheduler] Initial startup post expiry check completed.');
        logAutomation({ service: 'SYSTEM_CRON', level: 'SUCCESS', action: 'Startup Expiry Check', message: 'Initial startup job alert expiry check completed' });
      }
    } catch (err) {
      console.error('[LiveAlert Scheduler] Initial startup post expiry check failed:', err.message);
      logAutomation({ service: 'SYSTEM_CRON', level: 'ERROR', action: 'Startup Expiry Check Failed', message: err.message });
    }

    try {
      require('../posts/webstory.model');
      const WebStory = mongoose.model('WebStory');
      const count = await WebStory.countDocuments();
      logAutomation({ service: 'WEB_STORY', level: 'SUCCESS', action: 'Web Stories System Sync', message: `Web Story Engine active with ${count} total visual Google Discover Web Stories ready`, metadata: { totalStories: count } });
    } catch (wsErr) {}

    // Initial Startup Competitor Link Purge
    try {
      console.log('[LiveAlert Scheduler] Running initial startup Competitor Link Purge...');
      await runCompetitorPurge();
    } catch (purgeErr) {
      console.error('[LiveAlert Scheduler] Startup Competitor Link Purge error:', purgeErr.message);
    }
  });
}

module.exports = { scrapeFeeds, initScheduler, publishNextQueuedPost, scrapeDetailedUrls };
