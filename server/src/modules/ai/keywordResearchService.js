const googleTrends = require('google-trends-api');
const KeywordResearch = require('../keywords/keyword.model');

const STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'of', 'for', 'to', 'and', 'is', 'it', 'on', 'at', 'with', 'by', 'from', 'as', 'are', 'was', 'were', 'been', 'be', 'has', 'have', 'had', 'its', 'all', 'can', 'you', 'per', 'this', 'that', 'not', 'but']);

function splitTopic(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function generateKeywordVariations(topic) {
  const raw = topic.toLowerCase().trim();
  const words = splitTopic(topic);
  const base = words.join(' ');
  const results = [];
  let id = 0;

  if (!base) return [];

  // --- 1. SHORT-TAIL (1-2 keywords, high volume) ---
  results.push({
    keyword: raw, type: 'short-tail',
    placement: 'Title, URL slug, H1, first paragraph'
  });
  if (words.length >= 2) {
    results.push({
      keyword: words.slice(0, 2).join(' '), type: 'short-tail',
      placement: 'Meta title, H2 intro'
    });
  }

  // --- 2. MID-TAIL (3-4 words, moderate competition) ---
  const handledMid = new Set([raw]);
  const topicWordsSet = new Set(words);
  const midModifiers = ['best', 'guide', 'list', 'top', 'latest', 'new', 'complete'];
  if (words.length >= 2 || !/\d{4}/.test(raw)) midModifiers.unshift('2026');
  for (const mod of midModifiers.slice(0, 5)) {
    if (topicWordsSet.has(mod)) continue;
    const kw = `${mod} ${raw}`.trim();
    if (!handledMid.has(kw) && !handledMid.has(kw.toLowerCase())) {
      handledMid.add(kw);
      results.push({
        keyword: kw, type: 'mid-tail',
        placement: 'H2 headings (e.g., Best ..., Guide ...)'
      });
    }
  }
  if (words.length >= 3) {
    const firstWord = words[0];
    const restWords = words.slice(1).filter(w => w !== firstWord);
    const rest = restWords.join(' ');
    for (const mod of ['vs', 'for beginners', 'without']) {
      if (topicWordsSet.has(mod.replace(/s$/, '').replace(/out$/, ''))) continue;
      const kw = rest ? `${firstWord} ${mod} ${rest}`.trim() : '';
      if (kw && kw !== raw && !handledMid.has(kw.toLowerCase())) {
        handledMid.add(kw);
        results.push({
          keyword: kw, type: 'mid-tail',
          placement: 'Comparison / list paragraphs'
        });
      }
    }
  }

  // --- 3. LONG-TAIL (specific phrases, low difficulty) ---
  const longTailPrefixes = ['how to', 'ways to', 'tips for', 'step by step', 'easy way to', 'simple method for'];
  for (const prefix of longTailPrefixes.slice(0, 4)) {
    const kw = `${prefix} ${raw}`.trim();
    if (kw.length > 10 && kw !== raw) {
      results.push({
        keyword: kw, type: 'long-tail',
        placement: 'Body paragraphs, sub-sections (H3)'
      });
    }
  }

  // --- 4. LSI SEMANTIC KEYWORDS ---
  const lsiMap = {
    'sarkari': ['govt job', 'recruitment 2026', 'apply online', 'vacancy', 'exam date'],
    'exam': ['syllabus', 'previous year paper', 'cutoff marks', 'eligibility', 'admit card'],
    'health': ['fitness tips', 'diet plan', 'workout', 'wellness', 'nutrition'],
    'diet': ['nutrition', 'weight loss', 'calorie', 'meal plan', 'healthy food'],
    'yoga': ['meditation', 'pranayama', 'asana', 'fitness', 'mental health'],
    'tech': ['technology', 'software', 'gadgets', 'digital', 'tools'],
    'coding': ['programming', 'web development', 'javascript', 'react', 'python'],
    'react': ['next.js', 'javascript', 'frontend', 'web app', 'components'],
    'ai': ['machine learning', 'chatgpt', 'artificial intelligence', 'prompt', 'automation'],
    'chatgpt': ['gpt', 'ai chatbot', 'prompt engineering', 'openai', 'content generation'],
    'finance': ['investment', 'saving', 'mutual fund', 'tax', 'budget'],
    'money': ['earning', 'saving tips', 'investment', 'income', 'budget'],
    'cricket': ['ipl', 't20', 'match score', 'points table', 'player stats'],
    'news': ['trending', 'today', 'breaking', 'current affairs', 'latest'],
    'study': ['notes', 'question bank', 'practice test', 'online classes', 'revision'],
    'job': ['career', 'government job', 'placement', 'salary', 'interview tips'],
    'business': ['startup', 'entrepreneur', 'marketing', 'sales', 'profit'],
    'mobile': ['smartphone', 'android', 'iphone', '5g', 'battery'],
    'earning': ['make money', 'online income', 'freelancing', 'side hustle', 'passive income'],
    'blog': ['content writing', 'blogging tips', 'seo', 'wordpress', 'domain'],
  };

  const addedLsi = new Set();
  for (const w of words) {
    const matches = Object.entries(lsiMap).filter(([k]) => w.includes(k) || k.includes(w));
    for (const [, lsiList] of matches) {
      for (const lsi of lsiList) {
        if (!addedLsi.has(lsi)) {
          addedLsi.add(lsi);
          results.push({
            keyword: lsi, type: 'lsi',
            placement: 'Natural throughout content (H2, body paragraphs)'
          });
        }
      }
    }
  }
  if (addedLsi.size === 0) {
    const genericLsi = ['guide', 'tips', 'benefits', 'features', 'importance'];
    for (const g of genericLsi) {
      results.push({
        keyword: `${base} ${g}`, type: 'lsi',
        placement: 'Natural throughout content'
      });
    }
  }

  // --- 5. QUESTION-BASED ---
  const questionPrefixes = ['what is', 'how to', 'why is', 'when to', 'which is', 'how does', 'what are'];
  for (const prefix of questionPrefixes.slice(0, 4)) {
    const q = `${prefix} ${raw}`.trim();
    if (q.length > 10 && q !== `what is ${raw}`) {
      results.push({
        keyword: q + '?', type: 'question-based',
        placement: 'FAQ section (H2) + intro hook'
      });
    }
  }

  return results;
}

function classifyIntent(keyword) {
  const kw = keyword.toLowerCase();
  if (/^(how|what|why|when|which|where|who)\s/.test(kw)) return 'informational';
  if (/\b(guide|tips|tutorial|ways|overview|benefits|examples|checklist|steps|meaning|definition)\b/.test(kw)) return 'informational';
  if (/\b(best|top|vs|comparison|review|price|rating|alternative|recommended)\b/.test(kw)) return 'commercial';
  if (/\b(apply|result|registration|buy|purchase|order|download|discount|coupon|deal|shop|cost|cheap|renewal|enroll|subscribe|signup|register)\b/i.test(kw) || /apply online/i.test(kw)) return 'transactional';
  if (/\b(login|official|website|app|near me|location)\b/.test(kw)) return 'navigational';
  return 'informational';
}

function estimateMetrics(keyword, type) {
  const wordCount = keyword.split(/\s+/).length;
  const charLen = keyword.length;
  const specificity = wordCount + (charLen > 20 ? 2 : 0) + (/\?$/.test(keyword) ? 1 : 0);

  const baseVolumeMap = {
    'short-tail':    { min: 10000, max: 50000, kdMin: 20, kdMax: 45 },
    'mid-tail':      { min: 3000,  max: 15000, kdMin: 15, kdMax: 35 },
    'long-tail':     { min: 500,   max: 5000,  kdMin: 5,  kdMax: 22 },
    'lsi':           { min: 1000,  max: 8000,  kdMin: 10, kdMax: 30 },
    'question-based':{ min: 500,   max: 5000,  kdMin: 8,  kdMax: 25 },
  };
  const range = baseVolumeMap[type] || baseVolumeMap['long-tail'];

  const volumeRange = range.max - range.min;
  const volume = Math.round(range.min + volumeRange * (1 - specificity / (specificity + 5)));
  const kd = Math.round(range.kdMax - (range.kdMax - range.kdMin) * (specificity / (specificity + 3)));

  return {
    searchVolume: Math.min(50000, Math.max(300, volume)),
    kd: Math.max(2, kd),
  };
}

async function checkGoogleTrends(keywords) {
  if (!keywords || keywords.length === 0) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const results = [];
  for (const item of keywords) {
    try {
      const res = await googleTrends.interestOverTime({
        keyword: item.keyword,
        startTime: thirtyDaysAgo,
        endTime: now,
        geo: 'IN',
      });
      const data = JSON.parse(res);
      const timeline = data?.default?.timelineData || [];
      if (timeline.length === 0) {
        results.push({ ...item, trend: 'insufficient_data', trendScore: 0 });
        continue;
      }

      const values = timeline.map(t => t.value[0] || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

      let trend = 'stable';
      let trendScore = avg;
      if (secondAvg > firstAvg * 1.15) {
        trend = 'rising';
      } else if (secondAvg < firstAvg * 0.75) {
        trend = 'declining';
      }

      results.push({ ...item, trend, trendScore });
    } catch {
      results.push({ ...item, trend: 'insufficient_data', trendScore: 0 });
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

function filterByKD(items, maxKd = 35) {
  return items.filter(i => i.kd <= maxKd);
}

function prioritizeByTrend(items) {
  const order = { rising: 0, stable: 1, insufficient_data: 2, declining: 3 };
  return [...items].sort((a, b) => (order[a.trend] || 2) - (order[b.trend] || 2));
}

async function aggregateKeywordData(topic, category = '') {
  if (!topic || topic.trim().length < 2) return null;

  const raw = generateKeywordVariations(topic);
  if (raw.length === 0) return null;

  const withMetrics = raw.map(item => {
    const { searchVolume, kd } = estimateMetrics(item.keyword, item.type);
    return {
      keyword: item.keyword,
      type: item.type,
      searchVolume,
      kd,
      intent: classifyIntent(item.keyword),
      placement: item.placement,
    };
  });

  const withTrends = await checkGoogleTrends(withMetrics);
  const filtered = withTrends.filter(i => i.trend !== 'declining' && i.kd <= 35);
  const prioritized = prioritizeByTrend(filtered);

  const doc = {
    topic: topic.toLowerCase().trim(),
    category,
    keywords: withTrends,
    filteredKeywords: prioritized.map(i => i.keyword),
  };

  try {
    await KeywordResearch.findOneAndUpdate(
      { topic: doc.topic },
      doc,
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('KeywordResearch DB save failed:', err.message);
  }

  return {
    all: withTrends,
    filtered: prioritized,
    filteredKeywords: doc.filteredKeywords,
  };
}

async function getKeywordHistory(topic) {
  if (!topic) {
    return KeywordResearch.find().sort({ createdAt: -1 }).limit(50).lean();
  }
  return KeywordResearch.findOne({ topic: topic.toLowerCase().trim() }).lean();
}

async function deleteKeywordHistory(id) {
  if (!id) throw new Error('ID required');
  return KeywordResearch.findByIdAndDelete(id);
}

async function clearKeywordHistory() {
  const result = await KeywordResearch.deleteMany({});
  return { deleted: result.deletedCount };
}

module.exports = {
  generateKeywordVariations,
  classifyIntent,
  estimateMetrics,
  checkGoogleTrends,
  filterByKD,
  prioritizeByTrend,
  aggregateKeywordData,
  getKeywordHistory,
  deleteKeywordHistory,
  clearKeywordHistory,
};
