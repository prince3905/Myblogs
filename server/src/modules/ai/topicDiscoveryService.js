const axios = require('axios');
const { aggregateKeywordData } = require('./keywordResearchService');

const NEWS_RSS_BASE = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';
const SUGGEST_URL = 'https://suggestqueries.google.com/complete/search';

function newsRssUrl(topic) {
  const base = topic
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`
    : NEWS_RSS_BASE;
  return `${base}&cb=${Date.now()}`;
}

// Complete domain-to-category mapping (checked in order, first match wins)
// specialized domains get confidence 5, general news domains get confidence 3
const DOMAIN_CATEGORY_MAP = [
  // Tech-specific domains/subdomains
  { domain: 'tech.hindustantimes.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'gadgets360.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'gadgetsnow.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'digit.in', cat: 'Tech & Tutorials', conf: 5 },
  { domain: '91mobiles.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'trak.in', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'inc42.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'yourstory.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'techcrunch.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'theverge.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'wired.com', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'timesofindia.indiatimes.com/technology', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'indianexpress.com/technology', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'thehindu.com/technology', cat: 'Tech & Tutorials', conf: 5 },
  { domain: 'ht.com/technology', cat: 'Tech & Tutorials', conf: 5 },
  // Health-specific domains/subdomains
  { domain: 'healthline.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'webmd.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'mayoclinic.org', cat: 'Health & Wellness', conf: 5 },
  { domain: 'nhs.uk', cat: 'Health & Wellness', conf: 5 },
  { domain: 'medicalxpress.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'onlymyhealth.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'thehealthsite.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'fit.thequint.com', cat: 'Health & Wellness', conf: 5 },
  { domain: 'timesofindia.indiatimes.com/life-style/health-fitness', cat: 'Health & Wellness', conf: 5 },
  // AI-specific domains
  { domain: 'analyticsvidhya.com', cat: 'AI & Web Tools', conf: 5 },
  { domain: 'towardsdatascience.com', cat: 'AI & Web Tools', conf: 5 },
  { domain: 'venturebeat.com/category/ai', cat: 'AI & Web Tools', conf: 5 },
  // Sarkari Jobs-specific domains
  { domain: 'sarkariexam.com', cat: 'Sarkari Jobs & Exams', conf: 5 },
  { domain: 'examrace.com', cat: 'Sarkari Jobs & Exams', conf: 5 },
  { domain: 'jagranjosh.com/jobs', cat: 'Sarkari Jobs & Exams', conf: 5 },
  // Finance/Business-specific domains
  { domain: 'livemint.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'moneycontrol.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'zeebiz.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'businessworld.in', cat: 'Finance & Business', conf: 5 },
  { domain: 'entrepreneur.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'economictimes.indiatimes.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'business-standard.com', cat: 'Finance & Business', conf: 5 },
  { domain: 'financialexpress.com', cat: 'Finance & Business', conf: 5 },
  // General news domains (lower confidence so title keywords can override)
  { domain: 'thehindu.com', cat: 'News & Trends', conf: 3 },
  { domain: 'hindustantimes.com', cat: 'News & Trends', conf: 3 },
  { domain: 'timesofindia.indiatimes.com', cat: 'News & Trends', conf: 3 },
  { domain: 'indiatoday.in', cat: 'News & Trends', conf: 3 },
  { domain: 'ndtv.com', cat: 'News & Trends', conf: 3 },
  { domain: 'news18.com', cat: 'News & Trends', conf: 3 },
  { domain: 'indianexpress.com', cat: 'News & Trends', conf: 3 },
  { domain: 'deccanherald.com', cat: 'News & Trends', conf: 3 },
  { domain: 'thequint.com', cat: 'News & Trends', conf: 3 },
  { domain: 'thewire.in', cat: 'News & Trends', conf: 3 },
  { domain: 'scroll.in', cat: 'News & Trends', conf: 3 },
  { domain: 'theprint.in', cat: 'News & Trends', conf: 3 },
  { domain: 'republicworld.com', cat: 'News & Trends', conf: 3 },
  { domain: 'timesnownews.com', cat: 'News & Trends', conf: 3 },
  { domain: 'dw.com', cat: 'News & Trends', conf: 3 },
  { domain: 'bbc.com', cat: 'News & Trends', conf: 3 },
  { domain: 'bbc.co.uk', cat: 'News & Trends', conf: 3 },
  { domain: 'aljazeera.com', cat: 'News & Trends', conf: 3 },
  { domain: 'reuters.com', cat: 'News & Trends', conf: 3 },
  { domain: 'apnews.com', cat: 'News & Trends', conf: 3 },
  { domain: 'theguardian.com', cat: 'News & Trends', conf: 3 },
  { domain: 'nytimes.com', cat: 'News & Trends', conf: 3 },
];

const GENERIC_WORDS = new Set([
  'how to', 'what is', 'why is', 'guide', 'tips', 'tricks', 'ways',
  'ideas', 'list', 'best', 'top', 'new', 'latest', 'update', 'online',
  'simple', 'easy', 'fast', 'free', '2024', '2025', '2026', '2027',
  'lose', 'reduce', 'increase', 'improve', 'says', 'said', 'live',
]);

const CATEGORY_RULES = [
  {
    cat: 'Sarkari Jobs & Exams', weight: 3,
    primary: ['sarkari', 'government job', 'govt job', 'recruitment', 'vacancy', 'apply online',
      'admit card', 'syllabus', 'cutoff', 'merit list', 'answer key',
      'upsc', 'ssc cgl', 'ssc chsl', 'bank po', 'railway', 'defence', 'police',
      'ias officer', 'ips officer', 'nda exam', 'cds exam'],
    secondary: ['exam date', 'registration', 'notification', 'career', 'government', 'job alert'],
    negative: [],
  },
  {
    cat: 'Health & Wellness', weight: 3,
    primary: ['weight loss', 'lose weight', 'weight gain', 'diet plan', 'workout', 'exercise',
      'fat loss', 'belly fat', 'muscle', 'calories', 'protein', 'vitamin',
      'blood pressure', 'sugar', 'diabetes', 'cholesterol',
      'hair care', 'skin care', 'immunity', 'mental health', 'depression',
      'yoga poses', 'fitness tips', 'healthy diet'],
    secondary: ['health tips', 'fitness', 'disease', 'symptoms', 'treatment', 'hospital',
      'medicine', 'doctor', 'yoga', 'nutrition', 'healthy', 'weight'],
    negative: [],
  },
  {
    cat: 'Tech & Tutorials', weight: 3,
    primary: ['smartphone', 'laptop', 'smartwatch', 'earbuds', 'tablet', 'gadget',
      'launch', 'price in india', 'specs', 'camera', 'battery', 'processor',
      '5g', 'android', 'ios', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'realme',
      'windows', 'macbook', 'chromebook', 'gaming',
      'coding', 'programming', 'javascript', 'python', 'react', 'node.js',
      'web development', 'app development', 'software', 'github', 'api', 'database',
      'tutorial', 'step by step', 'vs code', 'developer', 'technology'],
    secondary: ['features', 'update', 'review', 'unveils', 'unveiled', 'flagship',
      'display', 'charging', 'wireless', 'bluetooth', 'wi-fi', 'usb-c',
      'artificial intelligence', 'internet', 'digital', 'tech'],
    negative: ['breaking', 'news', 'live', 'war', 'attack', 'arrest', 'election', 'politics',
      'match', 'score', 'sports', 'ipl', 'killed', 'dies', 'death', 'rescue', 'collapse'],
  },
  {
    cat: 'AI & Web Tools', weight: 3,
    primary: ['chatgpt', 'gpt-4', 'gpt-5', 'gemini ai', 'artificial intelligence',
      'machine learning', 'deep learning', 'ai tool', 'ai generator',
      'ai image', 'ai video', 'prompt engineering', 'ai prompts',
      'llm', 'neural network', 'openai', 'copilot'],
    secondary: ['automation', 'calculator', 'online tool', 'website builder', 'seo tool',
      'content generator', 'digital tool', 'ai', 'chatbot'],
    negative: ['breaking', 'news', 'war', 'attack', 'arrest', 'election', 'politics',
      'sports', 'cricket', 'match'],
  },
  {
    cat: 'News & Trends', weight: 3,
    primary: ['live', 'breaking', 'war', 'attack', 'arrest', 'killed', 'dies', 'death',
      'rescue', 'collapses', 'earthquake', 'storm', 'flood', 'crisis',
      'election', 'budget', 'protest', 'violence', 'ceasefire', 'deal',
      'talks', 'meet', 'launches', 'announces', 'approves', 'clears',
      'says', 'claims', 'accuses', 'slams', 'targets', 'captures',
      'ipl', 'cricket', 'match', 'score', 'points table', 'tournament',
      'sports', 'football', 't20', 'champions'],
    secondary: ['news', 'today', 'update', 'report', 'india', 'world',
      'government', 'court', 'minister', 'prime minister', 'president',
      'security', 'probe', 'investigation', 'inquiry'],
    negative: ['recipe', 'diet plan', 'workout', 'coding', 'tutorial',
      'mutual fund', 'investment', 'chatgpt prompt', 'ai prompt'],
  },
  {
    cat: 'Finance & Business', weight: 3,
    primary: ['mutual fund', 'stock market', 'share market', 'sensex', 'nifty',
      'crypto currency', 'bitcoin', 'ethereum', 'investment',
      'income tax', 'gst', 'loan', 'insurance', 'home loan',
      'saving account', 'fixed deposit', 'sip', 'business idea',
      'startup funding', 'ipo'],
    secondary: ['finance', 'money', 'budget', 'profit', 'startup', 'entrepreneur',
      'earning', 'income', 'payment', 'credit card', 'interest rate'],
    negative: ['breaking', 'war', 'attack', 'arrest', 'election', 'sports', 'cricket', 'ipl'],
  },
];

function domainFromLink(link) {
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function guessCategoryFromDomain(link) {
  if (!link) return null;
  let fullUrl = link.toLowerCase();
  try {
    const parsed = new URL(link);
    fullUrl = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
  } catch { fullUrl = link.toLowerCase(); }

  for (const entry of DOMAIN_CATEGORY_MAP) {
    if (fullUrl.includes(entry.domain)) {
      return { cat: entry.cat, confidence: entry.conf || 3 };
    }
  }
  return null;
}

function guessCategoryFromUrl(link) {
  if (!link) return null;
  try {
    const url = new URL(link);
    const path = url.pathname;
    const rules = [
      { pattern: /\/jobs?\//i, cat: 'Sarkari Jobs & Exams', weight: 4 },
      { pattern: /\/recruitment\//i, cat: 'Sarkari Jobs & Exams', weight: 4 },
      { pattern: /\/exam\//i, cat: 'Sarkari Jobs & Exams', weight: 3 },
      { pattern: /\/health\//i, cat: 'Health & Wellness', weight: 4 },
      { pattern: /\/fitness\//i, cat: 'Health & Wellness', weight: 4 },
      { pattern: /\/yoga\//i, cat: 'Health & Wellness', weight: 3 },
      { pattern: /\/tech\//i, cat: 'Tech & Tutorials', weight: 4 },
      { pattern: /\/technology\//i, cat: 'Tech & Tutorials', weight: 4 },
      { pattern: /\/gadgets?\//i, cat: 'Tech & Tutorials', weight: 3 },
      { pattern: /\/mobile\//i, cat: 'Tech & Tutorials', weight: 2 },
      { pattern: /\/tutorial\//i, cat: 'Tech & Tutorials', weight: 3 },
      { pattern: /\/coding\//i, cat: 'Tech & Tutorials', weight: 3 },
      { pattern: /\/ai\//i, cat: 'AI & Web Tools', weight: 3 },
      { pattern: /\/chatgpt\//i, cat: 'AI & Web Tools', weight: 3 },
      { pattern: /\/cricket\//i, cat: 'News & Trends', weight: 3 },
      { pattern: /\/sports?\//i, cat: 'News & Trends', weight: 3 },
      { pattern: /\/news\//i, cat: 'News & Trends', weight: 2 },
      { pattern: /\/finance\//i, cat: 'Finance & Business', weight: 4 },
      { pattern: /\/business\//i, cat: 'Finance & Business', weight: 3 },
      { pattern: /\/invest\//i, cat: 'Finance & Business', weight: 3 },
      { pattern: /\/stock\//i, cat: 'Finance & Business', weight: 3 },
      { pattern: /\/crypto\//i, cat: 'Finance & Business', weight: 3 },
      { pattern: /\/loan\//i, cat: 'Finance & Business', weight: 3 },
    ];
    for (const rule of rules) {
      if (rule.pattern.test(path)) {
        return { cat: rule.cat, confidence: rule.weight };
      }
    }
  } catch { /* ignore invalid URLs */ }
  return null;
}

function guessCategory(title, link) {
  const lower = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = lower.split(/\s+/).filter(w => w.length > 1);

  const domainHint = guessCategoryFromDomain(link);
  const urlHint = guessCategoryFromUrl(link);

  let best = 'Tech & Tutorials';
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const matchedPrimary = [];

    for (const kw of rule.primary) {
      if (lower.includes(kw)) {
        const boost = kw.length / words.length > 0.4 ? 4 : 1;
        score += kw.length * rule.weight * boost;
        matchedPrimary.push(kw);
      }
    }

    for (const kw of rule.secondary) {
      if (lower.includes(kw)) {
        score += kw.length * 0.5;
      }
    }

    for (const kw of rule.negative) {
      if (lower.includes(kw)) {
        score -= kw.length * 3;
      }
    }

    const nonGenericScore = matchedPrimary.filter(k => !GENERIC_WORDS.has(k)).reduce((s, k) => s + k.length, 0);
    if (nonGenericScore === 0 && matchedPrimary.length > 0) {
      score *= 0.3;
    }

    // Domain hint gives BIG boost — but doesn't override strong title keywords
    if (domainHint && rule.cat === domainHint.cat && score > 0) {
      score += domainHint.confidence * 40;
    } else if (domainHint && rule.cat === domainHint.cat) {
      score += domainHint.confidence * 10;  // Even with no title match, domain gives baseline
    }

    // URL path hint gives medium boost
    if (urlHint && rule.cat === urlHint.cat) {
      score += urlHint.confidence * 20;
    }

    if (score > bestScore) {
      bestScore = score;
      best = rule.cat;
    }
  }

  return best;
}

function isRecent(pubDate, maxAgeHours = 48) {
  if (!pubDate) return false;
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) < maxAgeHours * 60 * 60 * 1000;
}

function extractRssItem(itemXml) {
  const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
  const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
  const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
  const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/i);

  const rawTitle = titleMatch ? titleMatch[1] : '';
  const clean = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

  return {
    title: clean,
    pubDate: pubDateMatch ? pubDateMatch[1].trim() : null,
    link: linkMatch ? linkMatch[1].trim() : null,
    sourceName: sourceMatch ? sourceMatch[1].trim() : null,
  };
}

function extractRssTitles(xml) {
  const items = [];
  const itemRegex = /<item>[\s\S]*?<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const parsed = extractRssItem(match[0]);
    if (parsed.title && parsed.title.length > 10 && !/^[A-Z\s]+$/.test(parsed.title)) {
      items.push(parsed);
    }
  }

  const seen = new Set();
  return items.filter(i => {
    const key = i.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30);
}

async function fetchGoogleNews() {
  try {
    const res = await axios.get(newsRssUrl(), {
      timeout: 10000,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
    });
    const items = extractRssTitles(res.data);
    return items
      .filter(i => isRecent(i.pubDate, 48))
      .map(t => ({
        title: t.title,
        pubDate: t.pubDate,
        link: t.link,
        sourceName: t.sourceName,
        source: 'Google News',
        category: guessCategory(t.title, t.link),
      }));
  } catch (err) {
    console.warn('Google News RSS fetch failed:', err.message);
    return [];
  }
}

async function fetchSearchSuggestions(query) {
  if (!query || query.length < 2) return [];
  try {
    const res = await axios.get(SUGGEST_URL, {
      params: { client: 'chrome', q: query, hl: 'en-IN', cb: Date.now() },
      timeout: 5000,
      responseType: 'text',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    let raw = typeof res.data === 'string' ? res.data : String(res.data);
    raw = raw.trim();
    const suggestions = [];
    const jsonMatch = raw.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 2 && Array.isArray(parsed[1])) {
          for (const entry of parsed[1]) {
            const sug = Array.isArray(entry) ? entry[0] : entry;
            if (sug && sug.toLowerCase() !== query.toLowerCase()) suggestions.push(sug);
          }
        }
      } catch { /* fallback */ }
    }
    if (suggestions.length === 0) {
      const xmlMatches = raw.match(/<suggestion\s+data="([^"]+)"/gi);
      if (xmlMatches) {
        for (const m of xmlMatches) {
          const val = m.replace(/<suggestion\s+data="/, '').replace(/"\s*\/?>/, '');
          if (val && val.toLowerCase() !== query.toLowerCase()) suggestions.push(val);
        }
      }
    }
    return [...new Set(suggestions)].slice(0, 15);
  } catch (err) {
    console.warn('Search suggestions fetch failed:', err.message);
    return [];
  }
}

const TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=IN';

async function fetchGoogleTrends() {
  const fetchTime = new Date().toISOString();
  try {
    const res = await axios.get(`${TRENDS_RSS_URL}&cb=${Date.now()}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSReader/1.0)',
        'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache',
      },
    });
    const results = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(res.data)) !== null) {
      const itemXml = match[0];
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const trafficMatch = itemXml.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/i);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").trim();
      if (title.length < 2) continue;
      const traffic = trafficMatch ? trafficMatch[1].trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : null;
      if (!isRecent(pubDate, 48)) continue;
      // Extract related news items
      const related = [];
      const newsRegex = /<ht:news_item_title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:news_item_title>/gi;
      let nm;
      while ((nm = newsRegex.exec(itemXml)) !== null) {
        related.push(nm[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").trim());
      }
      results.push({
        title, traffic, source: 'Google Trends', category: guessCategory(title, ''),
        related: related.slice(0, 3), fetchedAt: fetchTime,
      });
    }
    return results.slice(0, 20);
  } catch (err) {
    console.warn('Google Trends RSS fetch failed:', err.message.slice(0, 80));
    return [];
  }
}

const CATEGORY_SEARCHES = [
  { q: 'technology gadgets smartphones india', cat: 'Tech & Tutorials' },
  { q: 'weight loss health fitness yoga diet', cat: 'Health & Wellness' },
  { q: 'artificial intelligence chatgpt ai tools', cat: 'AI & Web Tools' },
  { q: 'sarkari jobs recruitment upsc ssc bank', cat: 'Sarkari Jobs & Exams' },
  { q: 'stock market mutual funds investment finance', cat: 'Finance & Business' },
  { q: 'india news latest headlines', cat: 'News & Trends' },
];

async function fetchNewsByCategory() {
  const results = [];
  for (const { q, cat } of CATEGORY_SEARCHES) {
    try {
      const res = await axios.get(newsRssUrl(q), {
        timeout: 8000,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const items = extractRssTitles(res.data);
      for (const item of items.filter(i => isRecent(i.pubDate, 48)).slice(0, 4)) {
        results.push({
          title: item.title, pubDate: item.pubDate, link: item.link,
          sourceName: item.sourceName, source: 'Google News',
          category: cat,
        });
      }
    } catch { /* skip failed category */ }
  }
  // Shuffle to mix categories
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results.slice(0, 30);
}

async function discoverTopics() {
  const [news, catNews, trends] = await Promise.all([
    fetchGoogleNews(), fetchNewsByCategory(), fetchGoogleTrends(),
  ]);
  // Merge & deduplicate
  const seen = new Set();
  const merged = [...news, ...catNews].filter(i => {
    const key = i.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Shuffle so categories are interleaved
  for (let i = merged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [merged[i], merged[j]] = [merged[j], merged[i]];
  }
  return { news: merged.slice(0, 30), trends, timestamp: new Date().toISOString() };
}

async function exploreTopic(topic) {
  if (!topic || topic.length < 3) return null;
  const [suggestions, kwData] = await Promise.all([
    fetchSearchSuggestions(topic), aggregateKeywordData(topic),
  ]);
  return {
    topic, suggestions, keywordResearch: kwData,
    category: guessCategory(topic, ''), timestamp: new Date().toISOString(),
  };
}

async function suggestFromBase(baseKeywords) {
  if (!Array.isArray(baseKeywords) || baseKeywords.length === 0) return [];
  const results = [];
  const seen = new Set();
  for (const base of baseKeywords.slice(0, 5)) {
    const suggestions = await fetchSearchSuggestions(base);
    for (const s of suggestions) {
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        results.push({ query: base, suggestion: s, category: guessCategory(s, '') });
      }
    }
  }
  return results.slice(0, 25);
}

const INTENT_RULES = {
  Informational: [/^(how|what|why|when|which|where|who)\s/i, /\b(guide|tutorial|tips|ways|overview|benefits|examples|checklist|steps|meaning|definition|explain)\b/i],
  Commercial: [/\b(best|top|vs|comparison|review|price|rating|alternative|recommended|worth|value|coupon|deal|premium)\b/i],
  Transactional: [/\b(buy|purchase|order|download|discount|shop|register|signup|login|subscribe|enroll|apply|renewal|book|pay)\b/i],
};

function serpAnalyze(keyword) {
  const wordCount = keyword.split(/\s+/).length;
  const charLen = keyword.length;

  // Determine recommended content length based on keyword type
  const isInformational = INTENT_RULES.Informational.some(r => r.test(keyword));
  const isCommercial = INTENT_RULES.Commercial.some(r => r.test(keyword));
  const isTransactional = INTENT_RULES.Transactional.some(r => r.test(keyword));

  let totalWordCount, headingCount;
  if (isTransactional) {
    totalWordCount = Math.max(800, wordCount * 250);
    headingCount = 3;
  } else if (isCommercial) {
    totalWordCount = Math.max(1200, wordCount * 300);
    headingCount = 5;
  } else {
    totalWordCount = Math.max(1500, wordCount * 350);
    headingCount = 6;
  }

  // Generate LSI keywords from the keyword itself
  const words = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const lsiModifiers = ['guide', 'benefits', 'tips', 'review', 'vs', 'examples', 'best', 'how to', 'what is'];
  const recommendedLSI = [];
  const seen = new Set();
  for (const mod of lsiModifiers) {
    const lsi = `${mod} ${keyword}`.toLowerCase();
    if (!seen.has(lsi)) { seen.add(lsi); recommendedLSI.push(lsi); }
    if (recommendedLSI.length >= 5) break;
  }
  // Add some LSI from individual words
  for (const w of words) {
    if (recommendedLSI.length >= 8) break;
    const lsi = keyword.includes(w) ? `${w} ${keyword.replace(w, '').trim()}` : `${keyword} ${w}`;
    if (!seen.has(lsi)) { seen.add(lsi); recommendedLSI.push(lsi); }
  }

  // Generate suggested headings
  const capitalize = s => s.replace(/\b\w/g, c => c.toUpperCase());
  const headings = [`Introduction`, `What is ${capitalize(keyword)}?`];
  if (isCommercial) {
    headings.push(`Top ${capitalize(keyword)} Options`, `${capitalize(keyword)} Comparison`, `Pros and Cons`);
  } else if (isTransactional) {
    headings.push(`How to ${capitalize(keyword)}`, `Step-by-Step Guide`, `Eligibility & Requirements`);
  } else {
    headings.push(`Key Benefits of ${capitalize(keyword)}`, `How ${capitalize(keyword)} Works`, `${capitalize(keyword)} Tips for 2026`);
  }
  headings.push(`FAQ About ${capitalize(keyword)}`, `Conclusion`);

  return {
    keyword,
    totalRecommendedWords: Math.min(2500, Math.max(600, Math.round(totalWordCount / 100) * 100)),
    recommendedLSI: [...new Set(recommendedLSI)].slice(0, 8),
    suggestedHeadings: headings.slice(0, headingCount + 2),
    serpFeatures: {
      featuredSnippet: isInformational ? 'likely' : 'possible',
      peopleAlsoAsk: Math.max(2, Math.min(5, wordCount + 2)),
      imagePack: !isTransactional,
      videoResult: keyword.length > 15,
    },
  };
}

module.exports = {
  discoverTopics, exploreTopic, fetchSearchSuggestions,
  suggestFromBase, guessCategory, serpAnalyze,
  newsRssUrl, extractRssTitles, fetchGoogleNews,
};
