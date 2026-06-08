const axios = require('axios');
const LiveAlert = require('./liveAlert.model');

const FEEDS = [
  'https://www.freejobalert.com/feed/',
  'https://sarkariresult.info/feed/'
];

// Keywords to filter government jobs/exams
const VACANCY_KEYWORDS = [
  'admit card', 'vacancy', 'exam form', 'government job', 'recruitment',
  'online form', 'apply online', 'result', 'answer key', 'hall ticket',
  'exam date', 'notification', 'jobs', 'careers', 'eligibility', 'result'
];

// Regex to identify board/organisation names
const BOARD_PATTERNS = [
  /\bUPSC\b/i, /\bSSC\b/i, /\bRRB\b/i, /\bIBPS\b/i, /\bISRO\b/i, /\bDRDO\b/i,
  /\bLIC\b/i, /\bSBI\b/i, /\bRBI\b/i, /\bNavy\b/i, /\bArmy\b/i, /\bAir Force\b/i,
  /\bPSC\b/i, /\bHigh Court\b/i, /\bRailway\b/i, /\bPolice\b/i, /\bCSIR\b/i, /\bUGC\b/i,
  /\bCBSE\b/i, /\bNTA\b/i, /\bICAR\b/i, /\bBARC\b/i, /\bHAL\b/i, /\bIOCL\b/i,
  /\bBPCL\b/i, /\bONGC\b/i, /\bHPCL\b/i, /\bGAIL\b/i, /\bNTPC\b/i, /\bBHEL\b/i, /\bSAIL\b/i
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

function extractLastDate(title, description) {
  // Look for date patterns (e.g. DD-MM-YYYY, DD/MM/YYYY, or Month DD, YYYY)
  const dateRegex = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g;
  const wordDateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
  
  const text = `${title} ${description || ''}`;
  
  let match = dateRegex.exec(text);
  if (match) return match[0];
  
  match = wordDateRegex.exec(text);
  if (match) return match[0];

  // Try finding "Last Date" or similar indicators in text
  const lastDateIndicator = /(?:last\s+date|apply\s+till|deadline|closing\s+date)\s*[:\-\s]\s*([^\n<]+)/i;
  const indicatorMatch = text.match(lastDateIndicator);
  if (indicatorMatch) {
    return indicatorMatch[1].trim().slice(0, 20);
  }

  return 'Check Official Link';
}

function extractOfficialDomain(description) {
  if (!description) return '';
  // Match standard domains ending in .in, .gov.in, .nic.in, .ac.in, .res.in, .org
  const domainRegex = /\b([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:gov\.in|nic\.in|ac\.in|res\.in|edu\.in|org\.in|co\.in|in|org|net|com))\b/i;
  const match = description.match(domainRegex);
  if (match) {
    const domain = match[1].toLowerCase();
    // Exclude common scrapers/socials
    if (!domain.includes('freejobalert') && 
        !domain.includes('sarkariresult') && 
        !domain.includes('google') && 
        !domain.includes('facebook') &&
        !domain.includes('twitter') &&
        !domain.includes('youtube')) {
      return `https://${domain}`;
    }
  }
  return '';
}

async function scrapeFeeds() {
  console.log('[LiveAlert Scraper] Starting feed parsing...');
  let totalSaved = 0;

  for (const url of FEEDS) {
    try {
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const xml = res.data;
      if (typeof xml !== 'string') continue;

      const itemRegex = /<item>[\s\S]*?<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[0];
        
        // Extract title, link, description
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);

        if (!titleMatch || !linkMatch) continue;

        const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").trim();
        const link = linkMatch[1].trim();
        const description = descMatch ? descMatch[1].trim() : '';

        // Keyword filter check
        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();
        const matchesKeywords = VACANCY_KEYWORDS.some(kw => lowerTitle.includes(kw) || lowerDesc.includes(kw));

        if (!matchesKeywords) continue;

        const boardName = extractBoardName(title);
        const lastDate = extractLastDate(title, description);
        const officialUrl = extractOfficialDomain(description);
        const sourceName = url.includes('freejobalert') ? 'FreeJobAlert' : 'SarkariResult';

        // Upsert into MongoDB (prevents duplicate sourceUrls)
        await LiveAlert.updateOne(
          { sourceUrl: link },
          {
            $set: {
              title,
              boardName,
              lastDate,
              officialUrl,
              source: sourceName
            },
            $setOnInsert: {
              status: 'active'
            }
          },
          { upsert: true }
        );
        totalSaved++;
      }
    } catch (err) {
      console.error(`[LiveAlert Scraper] Scrape failed for ${url}:`, err.message);
    }
  }

  console.log(`[LiveAlert Scraper] Completed! Parsed & saved/updated ${totalSaved} raw alerts.`);
  return totalSaved;
}

function initScheduler() {
  const cron = require('node-cron');
  
  // Run every 6 hours: 0 */6 * * *
  cron.schedule('0 */6 * * *', async () => {
    try {
      await scrapeFeeds();
    } catch (err) {
      console.error('[LiveAlert Scheduler] Cron task error:', err.message);
    }
  });

  console.log('[LiveAlert Scheduler] Node-cron initialized to fetch alerts every 6 hours.');
}

module.exports = { scrapeFeeds, initScheduler };
