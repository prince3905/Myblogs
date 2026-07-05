const googleTrends = require('google-trends-api');
const KeywordResearch = require('../keywords/keyword.model');
const axios = require('axios');

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

  const promises = keywords.map(async (item) => {
    let timer;
    try {
      const apiCall = googleTrends.interestOverTime({
        keyword: item.keyword,
        startTime: thirtyDaysAgo,
        endTime: now,
        geo: 'IN',
      });

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout')), 1500);
      });

      const res = await Promise.race([apiCall, timeoutPromise]);
      clearTimeout(timer);

      const data = JSON.parse(res);
      const timeline = data?.default?.timelineData || [];
      if (timeline.length === 0) {
        return { ...item, trend: 'insufficient_data', trendScore: 0 };
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

      return { ...item, trend, trendScore };
    } catch {
      if (timer) clearTimeout(timer);
      return { ...item, trend: 'insufficient_data', trendScore: 0 };
    }
  });

  return Promise.all(promises);
}

function filterByKD(items, maxKd = 35) {
  return items.filter(i => i.kd <= maxKd);
}

function prioritizeByTrend(items) {
  const order = { rising: 0, stable: 1, insufficient_data: 2, declining: 3 };
  return [...items].sort((a, b) => (order[a.trend] || 2) - (order[b.trend] || 2));
}

async function fetchGoogleSuggestions(topic) {
  const suggestions = new Set();
  const queries = [
    topic,
    `latest ${topic}`
  ];
  
  const fetchPromise = (async () => {
    const promises = queries.map(async (q) => {
      try {
        const res = await axios.get(`https://suggestqueries.google.com/complete/search`, {
          params: {
            client: 'firefox',
            hl: 'en',
            gl: 'in',
            q: q.trim()
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 2500
        });
        const list = res.data[1] || [];
        list.forEach(item => {
          if (item && item.toLowerCase().trim() !== topic.toLowerCase().trim()) {
            suggestions.add(item.toLowerCase().trim());
          }
        });
      } catch (err) {
        console.warn(`[SEO] Autocomplete failed for query "${q}":`, err.message);
      }
    });

    await Promise.all(promises);
    return Array.from(suggestions).slice(0, 15);
  })();

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.warn(`[SEO] Autocomplete queries timed out after 3.5s for topic: "${topic}"`);
      resolve([]);
    }, 3500);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

async function analyzeKeywordsWithGemini(topic, category, suggestions) {
  const primaryKey = process.env.GEMINI_API_KEY;
  const fallbackKey = process.env.GEMINI_API_KEY_2;
  const groqKey = process.env.GROQ_API_KEY;

  if (!primaryKey && !fallbackKey && !groqKey) {
    throw new Error('No AI keys available in env');
  }

  const prompt = `You are a professional SEO Keyword Research Specialist.
Analyze these real Google search suggestions for the topic "${topic}" (category: "${category || 'General'}"):
${suggestions.map((s, idx) => `${idx + 1}. "${s}"`).join('\n')}

For each keyword in the list:
1. Predict monthly search volume in India (an accurate estimate, e.g. 500 to 50000).
2. Calculate SEO Keyword Difficulty (KD% from 0 to 100). Easy is 0-30%, moderate is 31-60%, hard is >60%. Be realistic!
3. Classify Search Intent ('informational', 'commercial', 'transactional', or 'navigational').
4. Determine Keyword Type ('short-tail', 'mid-tail', 'long-tail', 'lsi', or 'question-based').
5. Recommend a placement in a blog post (e.g. 'Title & H1', 'H2 Heading', 'Body paragraph', 'FAQ section').

Return ONLY a valid JSON array of objects, where each object has these exact keys:
"keyword" (string), "type" (string), "searchVolume" (number), "kd" (number), "intent" (string), "placement" (string)

Do not include any thinking, markdown, backticks, or other text outside the JSON array. Output MUST start with [ and end with ].`;

  let text = '';

  // 1. Try Gemini Primary Key
  if (primaryKey) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${primaryKey}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      }, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' }
      });
      text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      console.warn('[SEO] Primary Gemini key failed:', err.message);
    }
  }

  // 2. Try Gemini Fallback Key
  if (!text && fallbackKey && fallbackKey !== primaryKey) {
    try {
      console.log('[SEO] Trying fallback Gemini key...');
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${fallbackKey}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      }, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' }
      });
      text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      console.warn('[SEO] Fallback Gemini key failed:', err.message);
    }
  }

  // 3. Try Groq Llama 3.3 70B
  if (!text && groqKey) {
    try {
      console.log('[SEO] Trying Groq Llama 3.3 70B...');
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a professional SEO Specialist. Return only raw JSON array.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      }, {
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        timeout: 8000
      });
      text = response.data?.choices?.[0]?.message?.content || '';
    } catch (err) {
      console.warn('[SEO] Groq fallback failed:', err.message);
    }
  }

  if (!text) {
    throw new Error('All AI providers failed to analyze keywords');
  }

  const cleanJsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const list = JSON.parse(cleanJsonText);
  if (!Array.isArray(list)) {
    throw new Error('AI response is not a valid array');
  }
  return list;
}

function sortKeywordsByOpportunity(keywords, topic) {
  if (!keywords || keywords.length === 0) return [];
  const lowerTopic = String(topic || '').toLowerCase().trim();
  
  const calculateScore = (k) => {
    const vol = Number(k.searchVolume) || 0;
    const kd = Number(k.kd) || 0;
    return (vol * (100 - kd)) / 100;
  };

  return [...keywords].sort((a, b) => {
    const aIsFocus = String(a.keyword || '').toLowerCase().trim() === lowerTopic;
    const bIsFocus = String(b.keyword || '').toLowerCase().trim() === lowerTopic;
    if (aIsFocus && !bIsFocus) return -1;
    if (!aIsFocus && bIsFocus) return 1;
    return calculateScore(b) - calculateScore(a);
  });
}

async function aggregateKeywordData(topic, category = '') {
  if (!topic || topic.trim().length < 2) return null;

  // 1. Try real-time Autocomplete suggestions + Gemini AI SEO scoring
  try {
    console.log(`[SEO] Fetching real autocomplete suggestions from Google for "${topic}"...`);
    const suggestions = await fetchGoogleSuggestions(topic);
    
    if (suggestions.length > 0) {
      console.log(`[SEO] Analyzing ${suggestions.length} suggestions with Gemini AI...`);
      const scoredKeywords = await analyzeKeywordsWithGemini(topic, category, suggestions);
      
      if (scoredKeywords && scoredKeywords.length > 0) {
        const keywords = scoredKeywords.map(k => ({
          keyword: k.keyword,
          type: k.type || 'long-tail',
          searchVolume: Number(k.searchVolume) || 1000,
          kd: Number(k.kd) || 20,
          intent: k.intent || 'informational',
          trend: 'insufficient_data',
          trendScore: 0,
          placement: k.placement || 'Body paragraph'
        }));

        // Backfill if we have less than 15 keywords
        const backfilledKeywords = [...keywords];
        if (backfilledKeywords.length < 15) {
          const localVars = generateKeywordVariations(topic);
          const existingSet = new Set(backfilledKeywords.map(k => k.keyword.toLowerCase().trim()));
          for (const item of localVars) {
            const cleanKw = item.keyword.toLowerCase().trim();
            if (!existingSet.has(cleanKw)) {
              existingSet.add(cleanKw);
              const { searchVolume, kd } = estimateMetrics(item.keyword, item.type);
              backfilledKeywords.push({
                keyword: item.keyword,
                type: item.type,
                searchVolume,
                kd,
                intent: classifyIntent(item.keyword),
                trend: 'insufficient_data',
                trendScore: 0,
                placement: item.placement || 'Body paragraph'
              });
            }
            if (backfilledKeywords.length >= 20) break;
          }
        }

        const sortedKeywords = sortKeywordsByOpportunity(backfilledKeywords, topic);
        const filtered = sortedKeywords.filter(k => k.kd <= 35 || k.keyword.toLowerCase().trim() === topic.toLowerCase().trim());
        const doc = {
          topic: topic.toLowerCase().trim(),
          category,
          keywords: sortedKeywords,
          filteredKeywords: filtered.map(k => k.keyword)
        };

        await KeywordResearch.findOneAndUpdate(
          { topic: doc.topic },
          doc,
          { upsert: true, new: true }
        );

        console.log(`[SEO] Successfully generated ${sortedKeywords.length} accurate keywords.`);
        return {
          all: sortedKeywords,
          filtered,
          filteredKeywords: doc.filteredKeywords
        };
      }
    }
  } catch (err) {
    console.warn('[SEO] Accurate keyword research failed, falling back to local simulation:', err.message);
  }

  // 2. Fallback to local rule-based simulation + parallel googleTrends timeout
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
  const sortedKeywords = sortKeywordsByOpportunity(withTrends, topic);
  const filtered = sortedKeywords.filter(i => i.trend !== 'declining' && (i.kd <= 35 || i.keyword.toLowerCase().trim() === topic.toLowerCase().trim()));

  const doc = {
    topic: topic.toLowerCase().trim(),
    category,
    keywords: sortedKeywords,
    filteredKeywords: filtered.map(i => i.keyword),
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
    all: sortedKeywords,
    filtered,
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
