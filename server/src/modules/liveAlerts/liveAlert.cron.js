const axios = require('axios');
const cheerio = require('cheerio');
const LiveAlert = require('./liveAlert.model');

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
  let lastDate = 'Check Detail Page';

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
    $('tr').each((i, el) => {
      const text = $(el).text();
      if (text.includes('Post Date / Update :') || text.includes('Post Date:')) {
        const val = $(el).find('td').last().text().trim();
        if (val) {
          postDate = val;
        } else {
          const parts = text.split(':');
          if (parts.length > 1) {
            postDate = parts[1].trim();
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

    // 2. Extract lastDate from the detail page text if possible
    const dateRegex = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g;
    const wordDateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
    const bodyText = $('body').text();
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

    // 3. Extract links from Table or Paragraph structure
    const cleanAndResolve = (href) => {
      if (!href) return '';
      const baseUrl = 'https://www.sarkariresult.com';
      let resolved = href.trim();
      if (resolved.startsWith('/') || !resolved.startsWith('http')) {
        resolved = resolved.startsWith('/') ? `${baseUrl}${resolved}` : `${baseUrl}/${resolved}`;
      }
      
      const lower = resolved.toLowerCase();
      if (
        (lower.includes('sarkariresult') || lower.includes('freejobalert') || lower.includes('ilovepdf') || lower.includes('imageresizer') || lower.includes('pdfresizer')) &&
        (lower.includes('tool') || lower.includes('resize') || lower.includes('compress') || lower.includes('crop') || lower.includes('convert') || lower.includes('age'))
      ) {
        return '/tools';
      }
      
      return resolved;
    };

    // Exclude social media and common static pages
    const excludes = [
      'instagram.com', 'facebook.com', 'twitter.com', 'x.com', 't.me', 'telegram.me',
      'whatsapp.com', 'youtube.com', 'threads.net', 'threads.com', 'play.google.com',
      'apps.apple.com', 'itunes.apple.com', 'contactus', 'about-us', 'terms-and-conditions', 'disclaimer',
      'privacy-policy', 'googlesyndication.com', 'doubleclick.net', 'share.google'
    ];

    const classifyLink = (href, context) => {
      if (
        context.includes('apply online') || 
        context.includes('online apply') || 
        context.includes('apply link') || 
        context.includes('registration') || 
        context.includes('login') || 
        context.includes('apply now') ||
        context.includes('admit card') ||
        context.includes('hall ticket') ||
        context.includes('admitcard') ||
        context.includes('result') ||
        context.includes('score card') ||
        context.includes('scorecard') ||
        context.includes('answer key') ||
        context.includes('answerkey') ||
        context.includes('solution')
      ) {
        if (!officialApplyUrl) {
          officialApplyUrl = href;
        }
      } else if (
        context.includes('notification') || 
        context.includes('advertisement') || 
        context.includes('advt') || 
        context.includes('download pdf') || 
        context.includes('circular') || 
        context.includes('download details')
      ) {
        if (!officialPdfUrl) {
          officialPdfUrl = href;
        }
      } else if (
        context.includes('official website') || 
        context.includes('website') || 
        context.includes('home page') || 
        context.includes('board website') || 
        context.includes('visit website')
      ) {
        if (!officialUrl) {
          officialUrl = href;
        }
      }
    };

    // 3a. Try to find the "Useful Important Links" table
    let linksContainer = null;
    $('table').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('useful important links') || text.includes('some useful important')) {
        linksContainer = $(el);
      }
    });

    if (linksContainer) {
      const anchors = linksContainer.find('a');
      anchors.each((i, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('javascript:')) return;
        
        const resolvedHref = cleanAndResolve(href);
        const lowerHref = resolvedHref.toLowerCase();
        if (excludes.some(ex => lowerHref.includes(ex))) return;
        if (lowerHref === 'https://www.sarkariresult.com' || lowerHref === 'https://www.sarkariresult.com/') return;

        const text = $(el).text().trim();
        const cell = $(el).closest('td, th');
        const row = $(el).closest('tr');

        const contexts = [text];
        if (cell.length > 0) {
          contexts.push(cell.text());
          const prevCell = cell.prev();
          if (prevCell.length > 0) {
            contexts.push(prevCell.text());
          } else {
            const allRowCells = row.find('td, th');
            const cellIndex = allRowCells.index(cell);
            if (cellIndex > 0) {
              contexts.push($(allRowCells[cellIndex - 1]).text());
            }
          }
        }

        const contextStr = contexts.join(' | ').toLowerCase().replace(/\s+/g, ' ');
        classifyLink(resolvedHref, contextStr);
      });
    } else {
      // 3b. If no table is found, find the heading/element containing "Some Useful Important Links"
      let headerEl = null;
      $('h1, h2, h3, h4, p, div, td').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        if (text === 'some useful important links' || text === 'useful important links' || text.includes('useful important links')) {
          headerEl = $(el);
        }
      });

      if (headerEl) {
        const nextElements = headerEl.nextAll();
        let currentLabel = '';
        nextElements.each((i, el) => {
          const text = $(el).text().trim();
          const anchors = $(el).find('a');
          if (anchors.length > 0) {
            anchors.each((aIdx, aEl) => {
              const href = $(aEl).attr('href');
              if (!href || href.startsWith('javascript:')) return;
              
              const resolvedHref = cleanAndResolve(href);
              const lowerHref = resolvedHref.toLowerCase();
              if (excludes.some(ex => lowerHref.includes(ex))) return;
              if (lowerHref === 'https://www.sarkariresult.com' || lowerHref === 'https://www.sarkariresult.com/') return;

              const anchorText = $(aEl).text().trim();
              const contextStr = `${currentLabel} | ${text} | ${anchorText}`.toLowerCase().replace(/\s+/g, ' ');
              classifyLink(resolvedHref, contextStr);
            });
          } else {
            currentLabel = text;
          }
        });
      }
    }

    // Fallbacks if not found by the targeted parser
    if (!officialUrl) {
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const resolvedHref = cleanAndResolve(href);
        const lowerHref = resolvedHref.toLowerCase();
        if (excludes.some(ex => lowerHref.includes(ex))) return;
        if (lowerHref === 'https://www.sarkariresult.com' || lowerHref === 'https://www.sarkariresult.com/') return;

        if ((lowerHref.includes('.gov.in') || lowerHref.includes('.nic.in')) && !lowerHref.includes('sarkariresult')) {
          officialUrl = resolvedHref;
        }
      });
    }

    officialApplyUrl = cleanAndResolve(officialApplyUrl);
    officialPdfUrl = cleanAndResolve(officialPdfUrl);
    officialUrl = cleanAndResolve(officialUrl);

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
    detailsText = detailsText.trim();
    detailsText = cleanDetailsText(detailsText);

    return { postDate, lastDate, officialUrl, officialPdfUrl, officialApplyUrl, detailsText };
  } catch (err) {
    console.error('[LiveAlert Scraper] Detail scrape failed for', pageUrl, err.message);
    return { postDate: '', lastDate: '', officialUrl: '', officialPdfUrl: '', officialApplyUrl: '' };
  }
}

function cleanDetailsText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanedLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    
    // Check if this row is a tools row
    const isToolsRow = lower.includes('resizer') || lower.includes('compressor') || lower.includes('cropper') || 
                       lower.includes('maker') || lower.includes('age calculator') || lower.includes('pdf tools') || 
                       lower.includes('resume cv') || lower.includes('signature crop') || lower.includes('photo resize') ||
                       (lower.includes('link:') && (lower.includes('tools') || lower.includes('resize') || lower.includes('compress')));

    if (isToolsRow) {
      cleanedLines.push('Student Utility Tools: Photo Resizer, Signature Cropper, Age Calculator, PDF Compressor (Link: /tools)');
      continue;
    }

    // Check if the line is a generic sarkari result homepage link or logo line
    if (
      lower.includes('www.sarkariresult.com') || 
      lower.includes('sarkariresult®') || 
      lower.includes('sarkariresult.com/') || 
      lower.includes('sarkari result official') ||
      lower.includes('visit sarkariresult.com')
    ) {
      continue;
    }

    // Otherwise, clean any remaining bad urls inside the line
    let cleanedLine = trimmed.replace(/\(Link:\s*([^\)]+)\)/gi, (match, linksStr) => {
      const links = linksStr.split(',').map(l => l.trim());
      const sanitized = links.map(link => {
        const lowerLink = link.toLowerCase();
        if (
          (lowerLink.includes('sarkariresult') || lowerLink.includes('freejobalert') || lowerLink.includes('ilovepdf') || lowerLink.includes('imageresizer') || lowerLink.includes('pdfresizer')) &&
          (lowerLink.includes('tool') || lowerLink.includes('resize') || lowerLink.includes('compress') || lowerLink.includes('crop') || lowerLink.includes('convert') || lowerLink.includes('age') || lowerLink.includes('portal'))
        ) {
          return '/tools';
        }
        // Remove direct homepage links or portal tools domains
        if (lowerLink.includes('sarkariresult.com') || lowerLink.includes('sarkariresult.info') || lowerLink.includes('sarkariresult.tools') || lowerLink.includes('sarkariresultportal.com')) {
          if (lowerLink === 'https://www.sarkariresult.com' || lowerLink === 'https://www.sarkariresult.com/' || lowerLink.includes('sarkariresultportal')) {
            return '';
          }
        }
        return link;
      }).filter(Boolean);

      if (sanitized.length === 0) return '';
      return `(Link: ${sanitized.join(', ')})`;
    });

    cleanedLine = cleanedLine.replace(/\s*\(Link:\s*\)/gi, '').trim();

    if (cleanedLine) {
      cleanedLines.push(cleanedLine);
    }
  }

  return cleanedLines.join('\n');
}

async function scrapeFeeds() {
  console.log('[LiveAlert Scraper] Starting SarkariResult multi-source DOM scraping...');
  // Clean up any old listings from other sources (like FreeJobAlert) to keep only SarkariResult
  await LiveAlert.deleteMany({ source: { $ne: 'SarkariResult' } });



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
        let pdfFallbackDate = new Date();
        const pdfYearMatch = text.match(/\b(20\d{2})\b/);
        if (pdfYearMatch) {
          pdfFallbackDate = new Date(parseInt(pdfYearMatch[1], 10), 5, 1);
        } else {
          const shortYearMatch = href.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(\d{2})\b/i);
          if (shortYearMatch) {
            pdfFallbackDate = new Date(2000 + parseInt(shortYearMatch[1], 10), 5, 1);
          }
        }

        await LiveAlert.updateOne(
          { sourceUrl: href },
          {
            $set: {
              title: text,
              boardName: extractBoardName(text),
              lastDate: 'Check PDF Notice',
              postDate: '',
              parsedPostDate: pdfFallbackDate,
              officialUrl: 'https://www.sarkariresult.com',
              officialPdfUrl: href,
              officialApplyUrl: 'https://www.sarkariresult.com',
              source: 'SarkariResult',
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

      const parsedDate = parsePostDate(details.postDate);

      // Resolve year fallback date
      let fallbackDate = new Date();
      const combinedText = `${title} ${href}`;
      const yearMatch = combinedText.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        fallbackDate = new Date(parseInt(yearMatch[1], 10), 5, 1);
      } else {
        const shortYearMatch = href.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(\d{2})\b/i);
        if (shortYearMatch) {
          fallbackDate = new Date(2000 + parseInt(shortYearMatch[1], 10), 5, 1);
        }
      }

      // Skip inserting if detailsText is empty/too short (e.g. homepage redirects or list pages)
      if (!details.detailsText || details.detailsText.trim().length < 100) {
        console.log(`[LiveAlert Scraper] Skipping saving alert: "${title}" (detailsText is empty or too short)`);
        continue;
      }

      // Save or update to DB
      await LiveAlert.updateOne(
        { sourceUrl: href },
        {
          $set: {
            title,
            boardName,
            lastDate: details.lastDate || lastDate, // prefer detail date if found, fallback to parsed link lastDate
            postDate: details.postDate,
            parsedPostDate: parsedDate || fallbackDate, // fallback to year fallback date if parsing failed
            officialUrl: details.officialUrl,
            officialPdfUrl: details.officialPdfUrl,
            officialApplyUrl: details.officialApplyUrl,
            source: 'SarkariResult',
            state,
            category: detectCategory(title, href),
            detailsText: details.detailsText
          },
          $setOnInsert: {
            status: 'active'
          }
        },
        { upsert: true }
      );
      
      console.log(`[LiveAlert Scraper] Saved alert: "${title}" [State: ${state}]`);
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
    // Default to true (disabled/OFF) to verify manual review stays active by default
    const isPublisherDisabled = disableSetting ? disableSetting.value === true : true;

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

    // Auto share to Telegram
    try {
      const { sendTelegramMessage } = require('../services/telegramService');
      await sendTelegramMessage(oldestDraft);
      console.log(`[Queue Publisher] Successfully shared auto-published post to Telegram: "${oldestDraft.title}"`);
    } catch (tgErr) {
      console.error('[Queue Publisher] Failed to send Telegram message for auto-published post:', tgErr.message);
    }
  } catch (err) {
    console.error('[Queue Publisher] Error during scheduled auto-publish:', err.message);
  }
}

function initScheduler() {
  const cron = require('node-cron');
  
  // Scraper Run: Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await scrapeFeeds();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Cron task error:', err.message);
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
      await publishNextQueuedPost();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Queue publisher error:', err.message);
    }
  });

  // Expiry Daemon: Daily at midnight (00:00 AM Server Time)
  cron.schedule('0 0 * * *', async () => {
    try {
      const Settings = require('../settings/settings.model');
      const expirySetting = await Settings.findOne({ key: 'disableExpiryDaemon' });
      const isExpiryDisabled = expirySetting ? expirySetting.value === true : false; // Default to active (false)
      
      if (isExpiryDisabled) {
        console.log('[LiveAlert Scheduler] Daily post expiry check skipped: Expiry Daemon is disabled in settings.');
        return;
      }

      console.log('[LiveAlert Scheduler] Running daily post expiry check...');
      const { checkAndFlagExpiredPosts } = require('../../shared/utils/expiryDaemon');
      await checkAndFlagExpiredPosts();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Expiry Daemon error:', err.message);
    }
  });

  console.log('[LiveAlert Scheduler] Node-cron initialized: Scraper (15m), Queue (9AM, 6PM) & Expiry (00:00).');

  // Run initial startup tasks immediately (asynchronously in the background)
  Promise.resolve().then(async () => {
    console.log('[LiveAlert Scheduler] Running initial startup scrape...');
    try {
      await scrapeFeeds();
      console.log('[LiveAlert Scheduler] Initial startup scrape completed successfully.');
    } catch (err) {
      console.error('[LiveAlert Scheduler] Initial startup scrape failed:', err.message);
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
      }
    } catch (err) {
      console.error('[LiveAlert Scheduler] Initial startup post expiry check failed:', err.message);
    }
  });
}

module.exports = { scrapeFeeds, initScheduler, publishNextQueuedPost };
