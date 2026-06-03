const axios = require('axios');
const { processAIOutput } = require('./aiPostProcessor');
const { aggregateKeywordData } = require('./keywordResearchService');
const { newsRssUrl, extractRssTitles } = require('./topicDiscoveryService');

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const VALID_CATEGORIES = ['Sarkari Jobs & Exams', 'Health & Wellness', 'Tech & Tutorials', 'AI & Web Tools', 'News & Trends', 'Finance & Business'];
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const CATEGORY_FRAMEWORKS = {
  'Sarkari Jobs & Exams': {
    heading: 'जर्नलिज्म / रिपोर्टिंग फ्रेमवर्क',
    prompt: `**JOURNALISM/REPORTING FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure the post like a Sarkari result announcement or exam notification article. Natural Hinglish headings ONLY from this list — DO NOT use any other heading patterns:
• परिणाम और महत्वपूर्ण आंकड़े (Results & Key Statistics)
• स्टेप-बाय-स्टेप प्रोसेस (Step-by-Step Process)
• योग्यता और पात्रता (Eligibility Criteria)
• आवेदन कैसे करें (How to Apply — with official portal links)
• चयन प्रक्रिया (Selection Process — exam/interview/merit)
• महत्वपूर्ण तिथियाँ (Important Dates — apply start/end, exam date, result date)
• पिछले वर्ष के आंकड़े (Previous Year Trends — cutoff, vacancies)
• अक्सर पूछे जाने वाले सवाल (Frequently Asked Questions)
- Focus on: official notifications, eligibility, deadlines, exam patterns, vacancy analysis.
- Include exact numbers: vacancy count, application fees, salary range, age limit.
- STRICTLY BANNED from this category: "How it works", "Key Benefits", "What is", "Step-by-Step Guide" (English), "Overview".`
  },
  'Health & Wellness': {
    heading: 'हेल्थ एडवाइजरी फ्रेमवर्क',
    prompt: `**HEALTH ADVISORY FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure like a medical awareness article. Natural Hinglish headings ONLY from this list:
• लक्षण और कारण (Symptoms & Causes)
• इलाज के तरीके (Treatment Options — home remedies + medical)
• बचाव के उपाय (Prevention Tips)
• डॉक्टर से कब मिलें (When to See a Doctor)
• सही समय पर देखभाल (Timely Care Guide)
• आम मिथक और सच्चाई (Common Myths & Facts)
- Use authoritative tone (reference medical sources).
- STRICTLY BANNED: "What is [Topic]?", "Benefits of [Topic]", "How it works".`
  },
  'Tech & Tutorials': {
    heading: 'टेक ट्यूटोरियल फ्रेमवर्क',
    prompt: `**TECH TUTORIAL FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure like a how-to tech guide. Natural Hinglish headings from this list:
• How It Works (technical explanation)
• Key Features (specs, capabilities)
• Step-by-Step Guide (numbered steps with code/screenshots in mind)
• Tips & Tricks (productivity hacks)
• Common Mistakes to Avoid
• Best Tools & Alternatives
- Use beginner-friendly Hinglish. Explain jargon.
- NO banned patterns (standard tech structure allowed).`
  },
  'AI & Web Tools': {
    heading: 'डिजिटल टूल्स फ्रेमवर्क',
    prompt: `**DIGITAL TOOLS FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure like a tool review / earnings guide. Natural Hinglish headings from this list:
• Key Features (what does it do?)
• How to Use (step-by-step setup)
• Benefits & Limitations (honest pros/cons)
• Pricing & Plans (free vs paid tiers)
• Best Alternatives (competitor comparison)
• Real User Experience (tips from actual usage)
- Include earning potential numbers where relevant.
- NO banned patterns (standard tool review structure allowed).`
  },
  'News & Trends': {
    heading: 'जर्नलिज्म फ्रेमवर्क',
    prompt: `**JOURNALISM FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure like a breaking news report. Natural Hinglish headings ONLY from this list:
• क्या है पूरा मामला? (What's the Full Story?)
• महत्वपूर्ण अपडेट (Key Updates / Timeline)
• प्रभाव और आगे की राह (Impact & Road Ahead)
• विशेषज्ञ की राय (Expert Opinion / Official Statement)
• आंकड़ों में समझें (Understanding Through Data — table/chart)
• सोशल मीडिया रिएक्शन (Social Media Buzz)
- STRICTLY BANNED from this category: "How it works", "Key Benefits", "What is [Topic]?", "Overview", "Conclusion".
- Write in live-news style: concise, factual, timestamp-aware.`
  },
  'Finance & Business': {
    heading: 'फाइनेंशियल एडवाइजरी फ्रेमवर्क',
    prompt: `**FINANCIAL ADVISORY FRAMEWORK — MANDATORY FOR THIS CATEGORY:**
Structure like a personal finance guide. Natural Hinglish headings from this list:
• निवेश के फायदे (Investment Benefits)
• जोखिम और सावधानियां (Risks & Precautions)
• कैसे शुरू करें (How to Get Started)
• टैक्स और नियम (Tax & Regulatory Aspects)
• पिछला प्रदर्शन (Past Performance — historical returns/data)
• एक्सपर्ट टिप्स (Expert Tips for Beginners)
- Include real numbers: interest rates, returns %, fees, tax brackets.
- STRICTLY BANNED: "What is [Topic]?", "Benefits of [Topic]".`
  }
};

const ADSENSE_CONSTRAINTS = `**ADSENSE COMPLIANCE — NEGATIVE CONSTRAINTS (STRICT — FOLLOW FOR EVERY POST):**
1. NEVER use these exact phrases as headings or section starters:
   - "What is [Topic]?" (or any variation like "What is...")
   - "Benefits of [Topic]"
   - "Introduction", "Overview", "Conclusion" (boring generic labels — use creative alternatives)
2. NEVER start a paragraph with robotic transitions:
   - "In conclusion", "To summarize", "It is important to note that", "Furthermore", "Moreover"
   - Instead use natural Hinglish connectors: "तो", "अब बात करते हैं", "चलिए जानते हैं", "वैसे ही", "इसके अलावा"
3. AVOID generic AI layout markers:
   - Don't label sections as "Section 1", "Part A"
   - Don't use "Here are some", "There are many"
   - Don't use "Frequ01", "interru01", "Q1"/"Q2" codes
4. FLUID TRANSITIONS between sections — every section must connect naturally to the next. Never突兀 (abruptly) jump topics.
   - End each section with a hook/setup for the next section.
5. EVERY paragraph must be substantive — no filler sentences like "This is a great topic to explore" or "Let's dive deeper".
   - If a paragraph doesn't add unique value, remove it.
6. THIN CONTENT ZERO TOLERANCE — No generic advice without specific numbers, examples, or data. Every claim needs backing.`;

async function fetchNewsContext(topic) {
  if (!topic || topic.length < 3) return '';
  try {
    const res = await axios.get(newsRssUrl(topic), {
      timeout: 8000,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
    });
    const items = extractRssTitles(res.data);
    if (!items || items.length === 0) return '';
    const headlines = items.slice(0, 5).map((i, idx) =>
      `[${idx + 1}] ${i.sourceName ? i.sourceName + ' — ' : ''}"${i.title}"`
    ).join('\n');
    return `\n\n**REAL NEWS CONTEXT — Use as factual reference (incorporate relevant data/numbers naturally, DO NOT copy verbatim):**\n${headlines}`;
  } catch {
    return '';
  }
}

function matchCategory(text) {
  if (!text) return 'Tech & Tutorials';
  const lower = text.toLowerCase();
  const catKeywords = {
    'Sarkari Jobs & Exams': ['sarkari', 'job', 'exam', 'recruitment', 'vacancy', 'apply online', 'online form', 'result', 'syllabus', 'admit card', 'government', 'upsc', 'ssc', 'bank', 'railway', 'defence', 'police', 'answer key', 'cutoff', 'merit list', 'eligibility', 'registration'],
    'Health & Wellness': ['health', 'wellness', 'fitness', 'diet', 'yoga', 'workout', 'disease', 'medical', 'hospital', 'medicine', 'doctor', 'treatment', 'body chart', 'human body', 'weight loss', 'nutrition', 'exercise', 'mental health', 'illness', 'symptom'],
    'Tech & Tutorials': ['tutorial', 'coding', 'programming', 'next.js', 'react', 'javascript', 'python', 'developer', 'web development', 'software', 'app', 'tech', 'technology', 'guide', 'how to', 'step by step', 'learn', 'beginner', 'energy', 'battery', 'electric'],
    'AI & Web Tools': ['ai', 'artificial intelligence', 'chatgpt', 'prompt', 'earning', 'online earning', 'digital tool', 'calculator', 'tool', 'website', 'seo tool', 'keyword', 'content generator', 'image generator', 'automation', 'make money online', 'gpt', 'gemini'],
    'News & Trends': ['news', 'trending', 'viral', 'ipl', 'cricket', 'sports', 'today', 'latest', 'update', 'current affairs', 'breaking', 'score', 'match', 'points table', 'league', 'tournament', 'football', 'olympic'],
    'Finance & Business': ['finance', 'money', 'investment', 'saving', 'earning', 'business', 'loan', 'insurance', 'tax', 'budget', 'income', 'mutual fund', 'stock market', 'crypto', 'credit card', 'payment', 'profit', 'startup'],
  };
  let bestCat = 'Tech & Tutorials';
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(catKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (regex.test(lower)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }
  return bestCat;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSlug(str) {
  let slug = str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug || slug.length < 2) slug = 'post-' + Date.now().toString(36);
  return slug;
}

function extractKeywords(text, count = 6) {
  const lower = text.toLowerCase().replace(/<[^>]*>/g, '');
  const words = lower.match(/\b[a-z]{3,}\b/g) || [];
  const stopwords = new Set(['the', 'and', 'for', 'are', 'not', 'but', 'has', 'was', 'all', 'can', 'you', 'its', 'our', 'per', 'with', 'this', 'that', 'from', 'they', 'will', 'have', 'been', 'were', 'their', 'what', 'about', 'which', 'there', 'into', 'would', 'could', 'should', 'after', 'other', 'being', 'than', 'then', 'your', 'time', 'also', 'more', 'some', 'them', 'when', 'each', 'over', 'such', 'only', 'just', 'very', 'most', 'much']);

  // Score bigrams (two-word phrases)
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
      const phrase = words[i] + ' ' + words[i + 1];
      bigrams[phrase] = (bigrams[phrase] || 0) + 1;
    }
  }

  // Score single words
  const freq = {};
  words.forEach(w => {
    if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  // Prefer bigrams, fallback to single words
  const sortedBigrams = Object.entries(bigrams).sort((a, b) => b[1] - a[1]).slice(0, count).map(e => e[0]);
  if (sortedBigrams.length >= count) return sortedBigrams;

  const sortedWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .filter(([w]) => w.length > 3)
    .slice(0, count)
    .map(e => e[0]);

  // Mix: prefer bigrams, fill rest with words
  const result = [...sortedBigrams];
  for (const w of sortedWords) {
    if (result.length >= count) break;
    if (!result.some(r => r.includes(w))) result.push(w);
  }
  return result;
}

function extractFirstSentence(text) {
  const match = text.match(/[^.!?\n]+[.!?\n]/);
  return match ? match[0].trim() : text.slice(0, 200);
}

// Convert markdown-like blog content to HTML
function markdownToHtml(text) {
  if (!text) return '';
  // If it already looks like HTML, skip markdown conversion
  if (/^\s*</.test(text)) return cleanHtml(text);
  
  let h = text;
  // Strip leading + prefix only (AI artifact for headings)
  h = h.replace(/^\+[ \t]*/gm, '');
  // Convert markdown headings to HTML headings
  h = h.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
  // Blockquotes
  h = h.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Strip any remaining stray backticks
  h = h.replace(/`{1,3}/g, '');
  // Strip JSON fragments
  h = h.replace(/\{["\'].*?\}\s*$/s, '');
  h = h.replace(/devops_blog\s*\{.*/s, '');
  // Bold
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  h = h.replace(/`(.+?)`/g, '<code>$1</code>');
  // Strip random brackets with numbers like [1], [2], [3]
  h = h.replace(/\[\d+\]/g, '');
  // Strip stray standalone brackets
  h = h.replace(/[[\]]/g, '');
  // List items
  h = h.replace(/^[-*]\s*(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  h = h.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>\n$1</ul>\n');
  // Wrap remaining unwrapped lines in <p>
  const lines = h.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul') || trimmed.startsWith('<p') || trimmed.startsWith('<blockquote') || trimmed.startsWith('</blockquote') || trimmed.startsWith('<hr')) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }
  return result.join('\n');
}

// Clean up AI HTML artifacts (fallback when model outputs HTML directly)
function cleanHtml(html) {
  if (!html) return '';
  let h = html;
  h = h.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  h = h.replace(/\[begin\{code\}.*?\[\/code\]/gs, '');
  h = h.replace(/Frequ\d+\s*[:.]?\s*/gi, '');
  h = h.replace(/\bQ\d+[:.]?\s*/gi, '');
  h = h.replace(/\[\d+\]/g, '');
  h = h.replace(/[[\]]/g, '');
  h = h.replace(/<li>\s*<\/li>/g, '');
  h = h.replace(/\n{3,}/g, '\n\n');
  h = h.replace(/<!--.*?-->/gs, '');
  h = h.replace(/<\/html>/gi, '');
  h = h.replace(/^<\/p>\s*/i, '');
  h = h.replace(/<h3>/g, '<h2>').replace(/<\/h3>/g, '</h2>');
  // Convert # Heading → <h2> (markdown-style in HTML content)
  h = h.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^###\s+(.+)$/gm, '<h2>$1</h2>');
  // Strip #### or more (invalid heading levels)
  h = h.replace(/^#+\s+(.+)$/gm, '<p><strong>$1</strong></p>');
  h = h.replace(/<\/p>\s*<\/p>/g, '</p>');
  h = h.replace(/<\/h([23456])up>/gi, '</h$1>');
  h = h.replace(/<\/p>\s*<\/li>/g, '</li>');
  h = h.replace(/<li>\s*<p>/g, '<li>');
  // Wrap orphan <li> in <ul>
  const parts = h.split(/(<ul>[\s\S]*?<\/ul>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('<ul>')) continue;
    parts[i] = parts[i].replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>\n$1\n</ul>');
  }
  h = parts.join('');
  h = h.replace(/<\/ul>[\s\n]*<\/ul>/g, '</ul>');
  h = h.replace(/<\/ul>[\s\n]*<ul>/g, '');
  h = h.replace(/<ul[^>]*>\s*<\/li>/g, '<ul>');
  h = h.replace(/<li###/g, '<li>###');
  h = h.replace(/<h2[^>]*>##/g, '<h2>');
  h = h.replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '');
  h = h.replace(/<\/?([a-z]+)>\s*<\/([a-z]+)>/g, (m, o, c) => o === c ? '' : m);
  return h.trim();
}

// Strip instruction/preface text that Gemini sometimes returns before the actual content
function stripInstructions(raw) {
  if (!raw) return '';
  // Find first markdown or HTML heading
  const headingMatch = raw.match(/^(?:#{1,3}\s+|<h[234]>)/m);
  if (headingMatch && headingMatch.index > 0) {
    // Check if text before heading looks like instruction/preface
    const before = raw.slice(0, headingMatch.index).trim();
    if (before.length < 200 && /(?:here|okay|sure|certainly|absolutely|write|article|blog|post|content|below|following|this|i('ve| have| would| will)|you requested)/i.test(before)) {
      return raw.slice(headingMatch.index);
    }
  }
  // Remove instruction lines at the very start
  const lines = raw.split('\n');
  const keep = [];
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^```/.test(t)) continue;
    if (/^(#{1,3}\s+|<h[234]>)/.test(t)) started = true;
    if (!started && /(?:^(?:here|okay|sure|certainly|absolutely|yes|act as|you are|write a|strict instructions|do not|structure the|i will|i have|i've|the following|this is a))/i.test(t)) continue;
    if (t) started = true;
    keep.push(line);
  }
  return keep.join('\n').trim() || raw;
}

// Safety net: remove any instruction/preface/meta-labels from the final content
function cleanExtractedContent(raw) {
  if (!raw) return raw;
  const lines = raw.split('\n');
  let startIdx = 0;
  // Scan for lines that are metadata labels (slug:, keywords:, summary:, imageTag:, seoTitle:, etc.)
  // or instruction patterns — skip them, start from first heading
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const t = lines[i].trim().replace(/<\/?[^>]+>/g, '');
    if (!t) continue;
    const lower = t.toLowerCase();
    // Heading found = content starts here
    if (/^(#{1,3}\s+|<h[234]>)/i.test(t)) {
      startIdx = i;
      break;
    }
    // Metadata label line (e.g. "slug: value  keywords: value  summary: value")
    if (/^(slug|keywords?|summary|image[- ]?tag|image[- ]?keywords?|seo[- ]?title|seo[- ]?description)\s*[:：]/i.test(lower) ||
        /\b(slug|keywords?|summary|image[- ]?tag|image[- ]?keywords?|seo[- ]?title|seo[- ]?description)\s*[:：]/i.test(lower)) {
      continue; // skip this line
    }
    // Instruction patterns
    if (/(?:^(?:<p>)?\s*(act as|you are|write a|strict instructions?|do not|structure the|here (?:is|are)|sure|certainly|absolutely|okay|i will|i have|i've|the following|this is a))/i.test(t)) {
      continue; // skip this line
    }
    // Non-empty line that doesn't match above — keep everything from here
    startIdx = i;
    break;
  }
  const result = lines.slice(startIdx).join('\n').trim();
  if (result && startIdx > 0) return cleanHtml(result);
  return raw;
}

function robustJsonParse(text) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {}

  function fixNewlines(block) {
    let fixed = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < block.length; i++) {
      const ch = block[i];
      if (escape) { fixed += ch; escape = false; continue; }
      if (ch === '\\' && inString) { fixed += ch; escape = true; continue; }
      if (ch === '"') { inString = !inString; fixed += ch; continue; }
      if (inString && (ch === '\n' || ch === '\r')) { fixed += '\\n'; continue; }
      if (inString && ch === '\t') { fixed += '\\t'; continue; }
      fixed += ch;
    }
    return fixed;
  }

  function extractObjects(str) {
    const objects = [];
    let depth = 0;
    let start = -1;
    let inStr = false;
    let esc = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const obj = str.slice(start, i + 1);
          const fixed = fixNewlines(obj);
          try {
            const parsed = JSON.parse(fixed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              objects.push(parsed);
            }
          } catch {}
          start = -1;
        }
      }
    }
    return objects;
  }

  const objects = extractObjects(text);
  if (objects.length === 0) return null;
  if (objects.length === 1) return objects[0];

  const merged = {};
  for (const obj of objects) {
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'content') {
        merged.content = (merged.content || '') + val;
      } else if (key === 'keywords') {
        const existing = Array.isArray(merged.keywords) ? merged.keywords : [];
        const incoming = Array.isArray(val) ? val : [];
        merged.keywords = [...new Set([...existing, ...incoming])];
      } else if (!(key in merged)) {
        merged[key] = val;
      }
    }
  }
  return merged;
}

async function generateAIContent(req, res) {
  try {
    const { title, model, length, tone, language, command } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const toneMap = {
      informative: 'Informative and educational. Explain concepts with examples.',
      funny:       'Fun, light-hearted, and humorous. Keep it entertaining.',
      professional:'Formal and professional. Authoritative tone.',
      beginner:    'Beginner-friendly. Simple language, no jargon.',
      critical:    'Opinionated with a strong stance and reasoning.'
    };

    const sectionMap = {
      short:  '2 sections with 1-2 paragraphs each, plus a bullet list. Total ~300-400 words.',
      medium: '3-4 sections with 2-3 paragraphs each, plus a bullet list. Total ~500-700 words.',
      long:   '5-6 sections with 2-3 paragraphs each, plus a bullet list and FAQ with 2-3 Q&A. Total ~800-1200 words.'
    };

    const langMap = {
      hinglish: 'Write in Hinglish (Hindi in Latin script, conversational, like friends chat). Use simple Hinglish throughout. Key terms in English are fine.',
      hindi: 'Write in Hindi (Devanagari script). Pure Hindi with simple wording.',
      english: 'Write in English. Professional but conversational tone.',
    };

    const langInstr = langMap[language] || langMap.hinglish;

    const detectedCategory = req.body.category || matchCategory(title);
    const framework = CATEGORY_FRAMEWORKS[detectedCategory] || CATEGORY_FRAMEWORKS['Tech & Tutorials'];
    const categoryFrameworkInstr = framework.prompt;

    const systemPrompt = `You are a Permanent Advanced SEO Content Specialist for Digital Home, an Indian multi-niche platform. Current year: 2026.

**PERMANENT RULES — FOLLOW FOR EVERY POST, ALL MODELS.**

**LANGUAGE: ${langInstr}**

**CATEGORY: ${detectedCategory}**

**CATEGORY-SPECIFIC FRAMEWORK:**
${categoryFrameworkInstr}

**KEYWORD RESEARCH RULES (MANDATORY FOR EVERY POST):**
- Before writing, simulate a full India-focused keyword research table with these columns:
  | Serial No | Keyword Type (Short-Tail / Mid-Tail / Long-Tail / LSI / Question-Based) | Keyword | Est. Search Volume (India) | SEO Difficulty KD% (Target ≤35%) | Purpose/Placement in Post |
- Always include minimum 5 keywords covering all 5 types across the table.
- Short-Tail: 1 high-volume broad keyword (title + URL)
- Mid-Tail: 1-2 moderate competition keywords (H2 headings)
- Long-Tail: 1-2 low-difficulty specific phrases (body paragraphs)
- LSI: 1 semantically related keyword (natural throughout)
- Question-Based: 1 "how/what/why" keyword (FAQ section)
- KD% for every keyword must be 35% or below. If KD is high, pick an alternative.
- Est. Search Volume must be realistic for India (500-50000 range depending on keyword type).
- Keyword research table is for YOUR internal use only to guide content writing. Do NOT include it in the content field. Readers should NOT see the keyword table.

${ADSENSE_CONSTRAINTS}

**PAGE SPEED 100/100 RULES (MANDATORY):**
- IMAGES: NEVER include raw JPEG/PNG in content. All images must use <picture> element with WebP format.
  - First/hero image at top: fetchpriority="high" — NO loading="lazy"
  - All other images: loading="lazy" + width="800" height="450" + style="width:100%; height:auto; object-fit:cover;
  - Required format: <picture><source srcset="[CLOUDINARY-WEBP-URL]" type="image/webp" /><img src="[CLOUDINARY-JPG-FALLBACK-URL]" alt="[SEO-Alt]" width="800" height="450" loading="lazy" style="width:100%; height:auto; object-fit:cover;" fetchpriority="high" /></picture>
  - Reminder in first line of output: "Bhai, is post ki image ko compress karke .webp format mein hi upload karna!"
- ZERO BACKGROUND SCRIPTS: content MUST NOT contain any script tags, iframes, crypto widgets, OKX API calls, useEffect hooks, fetch calls to external APIs, or any JavaScript execution code. Page must be 100% clean static content only.
- Keep the output clean HTML with no embedded scripts, no external resource calls.

**JSON-LD SCHEMA MARKUP (MANDATORY):**
- The blog post content MUST include a complete JSON-LD Article Schema at the very bottom, wrapped in <script type="application/ld+json"> tags.
- Schema fields:
  - @context: "https://schema.org"
  - @type: "Article"
  - headline: [seoTitle or title]
  - description: [seoDescription or summary]
  - articleSection: [CATEGORY - use exact category name from the 6 listed]
  - author: { @type: "Person", name: "Harry Prince" }
  - publisher: { @type: "Organization", name: "Digital Home", url: "https://www.digitalhomeblog.in" }
  - datePublished: "2026-05-31"  (use today's date)
  - dateModified: "2026-05-31"
  - mainEntityOfPage: { @type: "WebPage", "@id": "https://www.digitalhomeblog.in/blog/{category-url-slug}/{slug}" }
- articleSection must ALWAYS be one of: Sarkari Jobs & Exams, Health & Wellness, Tech & Tutorials, AI & Web Tools, News & Trends, Finance & Business
- Place this schema as the last element in the content output, before Key Takeaways section.

**SEO METADATA:**
- slug: SHORT slug — max 2-4 core keywords, hyphenated, NO stop words. ULTRA-SHORT preferred. E.g. "react-guide", "ipl-2026-points-table", NOT "how-to-learn-react-js-in-2026-step-by-step"
- summary: Professional 140-160 character meta description in natural Hinglish with a call-to-action (जानिए, Check karein, पढ़ें)
- seoTitle: Click-worthy title under 60 characters for Google India
- seoDescription: 1-2 sentence meta description under 155 chars
- keywords: array of 5-8 SEO tags/strings
- imageTag: single hyphenated keyword for stock photo search
- imagetag: same as imageTag (lowercase)

**CONTENT STRUCTURE:**
- Write in engaging, human-like, natural Hinglish (matching top Indian bloggers). Avoid robotic/generic sentences.
- content: Full blog post using ## for headings on separate lines. NEVER put headings inside bullet points, numbered lists, or tables.
- Dense 3-4 line paragraphs. One idea per paragraph. Minimize bullet points — use only in Key Takeaways.
- Always include 1 highly relevant data table (comparing specs, stats, overview, or reference chart).
- Start with a hook question or surprising stat.
- Include FOCUS KEYWORD 8-10 times naturally (Title, First Paragraph, at least one H2).
- Use SHORT-TAIL keywords in headings, LONG-TAIL in body paragraphs, LSI naturally throughout.
- Use specific numbers, stats, data, real examples.
- Avoid: "Frequ01", "interru01", "Q1" codes, horizontal lines (---, ___).
- Use bold sparingly (max 3-4 per article). No over-quoting, no generic phrases.
- ## FAQ section at end with 3 highly searched questions. Format each as: ### Question: question text? then answer in next line.
- ## Key Takeaways with 4-5 bullets at end.
- HEADINGS must follow strict descending order: H2 → H3. NEVER skip levels. NEVER wrap entire paragraphs or bullet lists inside heading tags.`;



    const toneInstr = toneMap[tone] || toneMap.informative;
    const sectionInstr = sectionMap[length] || sectionMap.medium;
    const customInstr = command ? `\n\nAuthor's extra instruction: ${command}` : '';

    const tokenBudget = length === 'short' ? 4096 : length === 'long' ? 8192 : 6144;

    let keywordInject = '';
    let kwResearchId = null;
    try {
      const kwData = await aggregateKeywordData(title);
      if (kwData && kwData.filtered.length > 0) {
        const allKws = kwData.filtered;
        // Find focus keyword (short-tail with highest volume)
        const focus = allKws.find(k => k.type === 'short-tail') || allKws[0];
        const shortTail = allKws.filter(k => k.type === 'short-tail' || k.type === 'mid-tail').slice(0, 2);
        const longTail = allKws.filter(k => k.type === 'long-tail' || k.type === 'question-based').slice(0, 2);
        const lsiWords = allKws.filter(k => k.type === 'lsi').slice(0, 3);

        keywordInject = `
**KEYWORD STRATEGY — FOLLOW EXACTLY:**
- FOCUS KEYWORD: "${focus.keyword}" → MUST use in: Title, H1, first paragraph, at least one H2, URL slug
- SHORT-TAIL (broad): ${shortTail.map(k => `"${k.keyword}"`).join(', ')} → use in H2 headings and intro
- LONG-TAIL (specific): ${longTail.map(k => `"${k.keyword}"`).join(', ')} → use in body paragraphs naturally
- LSI (related): ${lsiWords.map(k => `"${k.keyword}"`).join(', ')} → sprinkle naturally throughout
- Include focus keyword 8-10 times total in content`;
        kwResearchId = allKws.map(k => k.keyword);
      }
    } catch (kwErr) {
      console.warn('Keyword research step failed (non-fatal):', kwErr.message);
    }

    const newsContext = await fetchNewsContext(title);

    const userPrompt = `Write a ${toneInstr.toLowerCase()} blog post for 2026 about: "${title}" for category: ${detectedCategory}

Follow the Permanent Rules exactly. Category framework for ${detectedCategory} is MANDATORY.

Structure: ${sectionInstr}. Include 1 data table in body, and FAQ with 3 questions. End with Key Takeaways.${customInstr}${keywordInject}${newsContext}

Return ONLY valid JSON with fields: category, permalink (digitalhomeblog.in/{category-url-slug}/{slug}), content (string with ## headings on separate lines, NEVER inside lists/tables), slug (no stop words), keywords (array), summary (140-160 chars Hinglish with CTA), imageTag, imagetag, seoTitle, seoDescription. content MUST be a STRING. Natural Hinglish. Dense 3-4 line paragraphs.`;

    const aiModel = model || 'gemini-flash-latest';
    const isOpenAI = aiModel.startsWith('gpt-');
    const isGemini = aiModel.startsWith('gemini-');
    const isGroq = GROQ_MODELS.includes(aiModel);
    const modelTimeout = isGroq ? 60000 : (isGemini ? 60000 : 30000);

    let text = '';

    if (isGemini) {
      const primaryKey = GEMINI_API_KEY;
      const fallbackKey = GEMINI_API_KEY_2;
      if (!primaryKey && !fallbackKey) {
        return res.status(400).json({ success: false, message: 'No Gemini API key set in .env' });
      }
      try {
        const geminiResponse = await axios.post(`${GEMINI_BASE_URL}/${aiModel}:generateContent?key=${primaryKey}`, {
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: tokenBudget,
            topP: 0.9
          }
        }, {
          timeout: modelTimeout,
          headers: { 'Content-Type': 'application/json' }
        });
        text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (geminiErr) {
        // If 429 (quota) or 503 (busy) and fallback key exists, retry with fallback key
        if ((geminiErr.response?.status === 429 || geminiErr.response?.status === 503) && fallbackKey && fallbackKey !== primaryKey) {
          try {
            const geminiFallback = await axios.post(`${GEMINI_BASE_URL}/${aiModel}:generateContent?key=${fallbackKey}`, {
              contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: tokenBudget,
                topP: 0.9
              }
            }, {
              timeout: modelTimeout,
              headers: { 'Content-Type': 'application/json' }
            });
            text = geminiFallback.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } catch (fallbackErr) {
            // Both Gemini keys failed (busy/quota) → auto-fallback to Groq
            if (GROQ_API_KEY && (fallbackErr.response?.status === 429 || fallbackErr.response?.status === 503)) {
              try {
                const groqFallback = await axios.post(GROQ_CHAT_URL, {
                  model: 'llama-3.3-70b-versatile',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                  ],
                  temperature: 0.7,
                  max_tokens: tokenBudget,
                  top_p: 0.9
                }, {
                  headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                  timeout: 60000
                });
                text = groqFallback.data?.choices?.[0]?.message?.content || '';
                if (text) console.log('Auto-fallback to Groq (Gemini busy)');
              } catch { throw fallbackErr; }
            } else {
              throw fallbackErr;
            }
          }
        } else {
          throw geminiErr;
        }
      }
    } else if (isGroq) {
      if (!GROQ_API_KEY) {
        return res.status(400).json({ success: false, message: 'GROQ_API_KEY not set in .env' });
      }
      try {
        const groqResponse = await axios.post(GROQ_CHAT_URL, {
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: tokenBudget,
          top_p: 0.9
        }, {
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: modelTimeout
        });
        text = groqResponse.data?.choices?.[0]?.message?.content || '';
      } catch (groqErr) {
        // Groq failed → auto-fallback to Gemini Flash
        if (GEMINI_API_KEY) {
          try {
            const geminiFallback = await axios.post(`${GEMINI_BASE_URL}/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
              contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: tokenBudget, topP: 0.9 }
            }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });
            text = geminiFallback.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) console.log('Auto-fallback to Gemini (Groq failed)');
          } catch { throw groqErr; }
        } else {
          throw groqErr;
        }
      }
    } else if (isOpenAI) {
      if (!OPENAI_API_KEY) {
        return res.status(400).json({ success: false, message: 'OPENAI_API_KEY not set in .env' });
      }
      const openaiResponse = await axios.post(OPENAI_CHAT_URL, {
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: tokenBudget,
        top_p: 0.9
      }, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: modelTimeout
      });
      text = openaiResponse.data?.choices?.[0]?.message?.content || '';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid model specified. Use GPT, Gemini, or Groq models.' });
    }

    // Strip code fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    if (!text) {
      return res.status(500).json({ success: false, message: 'AI returned empty response' });
    }

    // Parse JSON (with fallback)
    let parsed = robustJsonParse(text);

    // Normalize parsed keys to lowercase for case-insensitive matching
    if (parsed) {
      const norm = {};
      for (const [k, v] of Object.entries(parsed)) {
        norm[k.toLowerCase()] = v;
      }
      parsed = norm;
      // Validate fields — discard parsed data if corrupt
      const fieldKeys = Object.keys(parsed);
      const hasCorruptField = fieldKeys.some(k => {
        const v = parsed[k];
        if (typeof v === 'string' && v.length > 200) {
          // Check if value contains other field names (leakage)
          const otherFields = fieldKeys.filter(f => f !== k);
          return otherFields.some(f => v.includes(`"${f}"`) || v.includes(`${f}:`));
        }
        return false;
      });
      if (hasCorruptField) parsed = null;
    }

    let content = '';
    if (parsed?.content) {
      let raw = parsed.content;
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        raw = Object.values(raw).filter(v => typeof v === 'string').join('\n\n');
      } else if (typeof raw !== 'string') {
        raw = String(raw);
      }
      if (raw.trim()) {
        content = (/^\s*</.test(raw)) ? cleanHtml(raw) : markdownToHtml(raw);
      }
    }

    // Fallback: extract content field from raw JSON text
    if (!content) {
      // Use a multiline-aware regex to extract content field value
      const m = text.match(/"content"\s*:\s*"((?:[^"\\]|\\"|\\.|[\s\S])*?)"\s*(?:,|\n|\r|$)/);
      if (m && m[1].trim()) {
        const extracted = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
        content = (/^\s*</.test(extracted)) ? cleanHtml(extracted) : markdownToHtml(extracted);
      }
    }
    // Last resort: treat entire AI output as content
    if (!content) {
      content = cleanHtml(stripInstructions(text));
    }

    // Safety net: ensure content doesn't contain instruction/metadata text
    content = cleanExtractedContent(content);

    const plainText = stripHtml(content || '');
    const firstSentence = extractFirstSentence(plainText);

    const slug = (parsed?.slug && parsed.slug.length < 80 && !/\s/.test(parsed.slug)) 
      ? parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') 
      : makeSlug(title);

    let summary = '';
    if (parsed?.summary && parsed.summary !== 'null' && parsed.summary !== 'undefined') {
      summary = parsed.summary.slice(0, 300);
    } else {
      summary = firstSentence.slice(0, 300);
    }

    let keywords;
    if (Array.isArray(parsed?.keywords)) {
      keywords = parsed.keywords.filter(k => typeof k === 'string' && k.length < 60);
      if (keywords.length === 0) keywords = extractKeywords(plainText);
    } else if (typeof parsed?.keywords === 'string') {
      keywords = parsed.keywords.split(',').map(k => k.trim()).filter(Boolean);
    } else {
      keywords = extractKeywords(plainText);
    }

    let imageTag = '';
    if (parsed?.imagetag) {
      const cleanTag = stripHtml(String(parsed.imagetag)).trim();
      if (cleanTag) {
        imageTag = makeSlug(cleanTag).split('-').slice(0, 2).join('-');
      }
    }
    if (!imageTag) {
      imageTag = makeSlug(title).split('-').slice(0, 2).join('-') || 'blog-post';
    }

    // Extract imageKeywords for stock photo (comma-separated)
    let imageKeywords = '';
    if (parsed?.imagekeywords && typeof parsed.imagekeywords === 'string') {
      const kw = stripHtml(parsed.imagekeywords).trim().toLowerCase()
        .replace(/[^a-z0-9\s-,]/g, '').replace(/\s+/g, ',').replace(/,+/g, ',').replace(/^,|,$/g, '');
      if (kw && kw.split(',').length >= 2) {
        imageKeywords = kw;
      }
    }
    if (!imageKeywords) {
      imageKeywords = imageTag; // fallback to same as imageTag
    }

    if (!content) {
      return res.status(500).json({ success: false, message: 'AI returned empty content' });
    }

    // ─── Post-processing: Apply all SEO rules ─────────────────────
    const processed = await processAIOutput({
      title,
      content,
      keywords,
      category: detectedCategory,
      imageTag,
      imageKeywords,
      summary,
      seoTitle: title.length > 70 ? title.slice(0, 67) + '...' : title,
      seoDescription: summary.slice(0, 155),
    });

    const category = processed.category || detectedCategory;
    const permalink = 'digitalhomeblog.in/' + category.toLowerCase().replace(/\s+/g, '-') + '/' + slug;

    res.json({
      success: true,
      content: processed.content,
      slug,
      permalink,
      summary: processed.summary,
      seoTitle: processed.seoTitle,
      seoDescription: processed.seoDescription,
      keywords: processed.tags || keywords,
      category,
      imageTag: processed.imageTag,
      imageKeywords: processed.imageKeywords
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OpenAI API key. Check your OPENAI_API_KEY in .env'
      });
    }

    if (error.response?.status === 429 || error.response?.data?.error?.message?.includes('quota')) {
      return res.status(429).json({
        success: false,
        message: 'API quota exceeded. Check your billing or use a different model.'
      });
    }

    if (error.response?.status === 503 && error.response?.data?.error?.message?.includes('high demand')) {
      return res.status(503).json({
        success: false,
        message: 'Gemini model busy right now, try again or switch to another model'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return res.status(504).json({
        success: false,
        message: 'AI is taking too long. Try again or use a shorter title.',
        aiTimeout: true
      });
    }

    if (error.response) {
      console.error('AI error response:', error.response.status, error.response.data);
    } else {
      console.error('AI generation error:', error.message);
    }

    res.status(500).json({ success: false, message: 'Failed to generate content' });
  }
}

module.exports = { generateAIContent };
