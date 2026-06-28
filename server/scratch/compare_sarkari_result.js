const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const LiveAlert = require('../src/modules/liveAlerts/liveAlert.model');
const env = require('../src/config/env');

// Helper to check if a URL is a details page
function isDetailUrl(href) {
  if (!href || !href.startsWith('http')) return false;
  if (!href.includes('sarkariresult.com')) return false;
  
  const lower = href.toLowerCase();
  const excludes = [
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com', 't.me', 'telegram.me',
    'whatsapp.com', 'youtube.com', 'threads.net', 'threads.com', 'play.google.com',
    'apps.apple.com', 'contactus', 'about-us', 'terms-and-conditions', 'disclaimer',
    'privacy-policy', 'googlesyndication.com', 'doubleclick.net', 'share.google'
  ];
  if (excludes.some(ex => lower.includes(ex))) return false;

  let path = '';
  try {
    const urlObj = new URL(href);
    path = urlObj.pathname;
  } catch (e) {
    return false;
  }

  if (path.endsWith('/')) path = path.slice(0, -1);
  if (path.startsWith('/')) path = path.slice(1);
  if (!path) return false;

  const parts = path.split('/');
  const categoryPages = [
    'latestjob', 'admitcard', 'result', 'syllabus', 'answerkey', 'admission',
    'important', 'certificate', 'outsourcing', 'certificateverification',
    'up-scholarship', 'page'
  ];
  if (parts.length === 1 && categoryPages.includes(parts[0])) return false;

  const isArchive = parts[parts.length - 1].endsWith('all') || 
                    (parts.length === 1 && parts[0].length <= 8 && !parts[0].includes('-'));
  if (isArchive) return false;

  return true;
}

async function compare() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to local database");

  // Fetch Sarkari Result homepage
  const targetUrl = 'https://www.sarkariresult.com/';
  console.log(`Fetching live listings from: ${targetUrl}`);
  
  const res = await axios.get(targetUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const $ = cheerio.load(res.data);
  const scrapedListings = [];

  // Find all detail page links
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href && text) {
      const fullHref = href.startsWith('http') 
        ? href 
        : (href.startsWith('/') ? `https://www.sarkariresult.com${href}` : `https://www.sarkariresult.com/${href}`);

      if (isDetailUrl(fullHref)) {
        if (!scrapedListings.some(l => l.href === fullHref)) {
          scrapedListings.push({ text, href: fullHref });
        }
      }
    }
  });

  console.log(`\nSarkariResult has ${scrapedListings.length} total listings on its homepage.`);
  
  // Fetch existing items from DB
  const dbAlerts = await LiveAlert.find({});
  const dbMap = new Map(dbAlerts.map(a => [a.sourceUrl, a]));

  console.log(`Your database has ${dbAlerts.length} total alerts.\n`);
  console.log("--- SIDE-BY-SIDE COMPARISON (Top 30 Live Listings on Homepage) ---");
  
  let matchings = 0;
  let missing = [];

  // Look at the top 30 homepage listings
  const topListings = scrapedListings.slice(0, 30);
  topListings.forEach((listing, index) => {
    const dbAlert = dbMap.get(listing.href);
    const statusSymbol = dbAlert 
      ? `✅ (DB status: ${dbAlert.status}, details length: ${dbAlert.detailsText ? dbAlert.detailsText.length : 0} chars)` 
      : '❌ MISSING IN DB';
    
    if (dbAlert) {
      matchings++;
    } else {
      missing.push(listing);
    }
    
    console.log(`${index + 1}. Live Title: "${listing.text}"\n   Link: ${listing.href}\n   Sync Status: ${statusSymbol}\n`);
  });

  console.log("--- SUMMARY ---");
  console.log(`Out of the top 30 live listings checked:`);
  console.log(`- Matchings in DB: ${matchings}`);
  console.log(`- Missing in DB: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log(`\nExample of missing listings (First 5):`);
    missing.slice(0, 5).forEach((m, idx) => {
      console.log(`  ${idx + 1}. "${m.text}" (${m.href})`);
    });
  }

  await mongoose.disconnect();
}

compare().catch(console.error);
