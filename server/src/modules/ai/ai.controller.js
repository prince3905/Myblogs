const axios = require('axios');
const path = require('path');
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
• महत्वपूर्ण तिथियाँ (Important Dates — apply start/end, exam date, result date)
• आवेदन शुल्क (Application Fee)
• आयु सीमा (Age Limit)
• रिक्तियों का विवरण (Vacancy Details)
• योग्यता और पात्रता (Eligibility Criteria)
• चयन प्रक्रिया (Selection Process — exam/interview/merit)
• आवेदन कैसे करें (How to Apply — with official portal links)
• महत्वपूर्ण लिंक्स (Important Links / Useful Links)
• परिणाम और महत्वपूर्ण आंकड़े (Results & Key Statistics)
• स्टेप-बाय-स्टेप प्रोसेस (Step-by-Step Process)
• पिछले वर्ष के आंकड़े (Previous Year Trends — cutoff, vacancies)
• अक्सर पूछे जाने वाले सवाल (FAQ)
- Focus on: official notifications, eligibility, deadlines, exam patterns, vacancy analysis.
- Include exact numbers: vacancy count, application fees, salary range, age limit.
- STRICTLY BANNED from this category: "How it works", "Key Benefits", "What is", "Step-by-Step Guide" (English), "Overview".
- NO THIRD-PARTY TOOLS LINKS: Do not link to any third-party photo resizers, signature croppers, age calculators, or pdf tools (e.g. from sarkariresult or elsewhere). Promote our site's own Student Utility Tools by linking to "/tools" (relative URL) instead.`
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

const ADSENSE_CONSTRAINTS = `**ADSENSE COMPLIANCE & HUMANIZATION DIRECTIVES (STRICT — FOLLOW FOR EVERY POST):**
1. ZERO TOLERANCE FOR ROBOTIC AI TRANSITIONS & WORDS:
   - NEVER use: "In conclusion", "To summarize", "It is important to note that", "Furthermore", "Moreover", "Lastly", "Additionally", "Delve", "Testament", "Embark", "Paving the way", "Game changer", "In the rapidly evolving world", "Look no further".
   - Instead, use conversational, friendly transitions: "तो", "अब बात करते हैं", "चलिए जानते हैं", "वैसे ही", "इसके अलावा", "सच कहें तो", "मजेदार बात यह है", "देखिए", "अब सवाल यह आता है".
2. BANNED SECTION HEADERS:
   - NEVER use: "Introduction", "Overview", "Conclusion", "What is [Topic]?", "Benefits of [Topic]", "Key Features of [Topic]", "How it works" as plain boring headings. Use creative, human-written alternative phrases.
3. VARY SENTENCE LENGTHS (BURSTINESS):
   - Mix extremely short punchy sentences (e.g. "Simple hai.", "Sach hai.", "Aap hi sochiye.", "Yeh bilkul sach hai.") with medium and longer sentences. Avoid having all sentences of uniform length. This pattern makes the content pass AI checkers and feel 100% human-written.
4. ZERO FORMULAIC BULLET LISTS:
   - Do NOT use typical AI bullet lists with bold terms (e.g. "- **Feature Name:** Description"). This is a dead machine signature. Write explanations in natural, flowing paragraphs of 1-3 sentences.
   - Use bullet points ONLY in the "Key Takeaways" section at the very end.
5. FLUID TRANSITIONS:
   - Every paragraph must flow naturally into the next. End each section with a connector or hook that sets up the next section.
6. NO FILLER CONTENT:
   - Every sentence must provide real value, specific numbers, details, or steps. No generic AI fluff like "Let's explore this amazing topic further".`;

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

function fallbackRephraseTitle(titleStr, category) {
  if (!titleStr) return '';
  let t = titleStr.trim();
  
  // Remove question mark at the end
  t = t.replace(/\?$/, '');

  // Patterns to strip (English & Hinglish/Hindi question prefixes)
  const prefixPatterns = [
    /^(?:do\s+you\s+know\s+)(?:what\s+is|how\s+to|what|how)\s+/i,
    /^(?:what\s+is|what\s+are|how\s+to|why\s+do|why\s+is|why\s+are|do\s+you\s+know)\s+/i,
    /^(?:guide\s+to|complete\s+guide\s+on\s+how\s+to|step\s+by\s+step\s+guide\s+on\s+how\s+to)\s+/i,
    /^(?:know\s+everything\s+about|all\s+you\s+need\s+to\s+know\s+about)\s+/i,
    /^(?:kya\s+aap\s+jaante\s+hain\s+|kya\s+aap\s+jante\s+hai\s+|kya\s+aap\s+jante\s+hain\s+)/i,
    /^(?:kya\s+hai\s+|kaise\s+kare\s+|kaise\s+karen\s+|kaise\s+karein\s+)/i,
    /^(?:क्या\s+आप\s+जानते\s+हैं\s+|क्या\s+है\s+|कैसे\s+करें\s+)/
  ];

  // Patterns to strip from the end (e.g., "... kya hai", "... kya hota hai")
  const suffixPatterns = [
    /\s+(?:kya\s+hai|kya\s+hota\s+hai|kaise\s+kare|kaise\s+karein|kaise\s+karen)$/i,
    /\s+(?:क्या\s+है|क्या\s+होता\s+है|कैसे\s+करें)$/
  ];

  let matched = false;
  let cleaned = t;

  // 1. Clean prefixes
  for (const pattern of prefixPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      matched = true;
    }
  }

  // 2. Clean suffixes
  for (const pattern of suffixPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      matched = true;
    }
  }

  if (matched && cleaned.length > 2) {
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    // Choose professional suffix based on category
    const cat = category || 'Tech & Tutorials';
    let suffix = ' May Change Your Life'; // default
    if (cat === 'Sarkari Jobs & Exams') {
      suffix = ': Important Updates & Details';
    } else if (cat === 'Health & Wellness') {
      suffix = ': The Complete Health Guide';
    } else if (cat === 'Tech & Tutorials') {
      suffix = ': A Developer\'s Complete Guide';
    } else if (cat === 'AI & Web Tools') {
      suffix = ' May Change Your Life';
    } else if (cat === 'News & Trends') {
      suffix = ': Latest Updates & Analysis';
    } else if (cat === 'Finance & Business') {
      suffix = ': Ultimate Financial Guide';
    }
    
    return cleaned + suffix;
  }

  return t;
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

function convertMarkdownTablesToHtml(text) {
  if (!text) return text;
  
  const lines = text.split('\n');
  let inTable = false;
  let tableRows = [];
  const output = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = line.startsWith('|') && line.endsWith('|') && line.includes('|');
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        const htmlTable = buildHtmlTable(tableRows);
        output.push(htmlTable);
        inTable = false;
        tableRows = [];
      }
      output.push(lines[i]);
    }
  }
  
  if (inTable && tableRows.length > 0) {
    const htmlTable = buildHtmlTable(tableRows);
    output.push(htmlTable);
  }
  
  return output.join('\n');
}

function buildHtmlTable(rows) {
  const cleanRows = rows.filter(row => !/^\|[\s:\-|]+\|$/.test(row.trim()));
  if (cleanRows.length === 0) return '';
  
  let html = '<table class="min-w-full divide-y divide-gray-200 border border-gray-300 my-4">\n';
  
  cleanRows.forEach((row, index) => {
    const cells = row.split('|')
      .map(c => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
    if (index === 0) {
      html += '  <thead>\n    <tr class="bg-gray-100">\n';
      cells.forEach(cell => {
        html += `      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border border-gray-300">${cell}</th>\n`;
      });
      html += '    </tr>\n  </thead>\n  <tbody>\n';
    } else {
      html += '    <tr>\n';
      cells.forEach(cell => {
        html += `      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">${cell}</td>\n`;
      });
      html += '    </tr>\n';
    }
  });
  
  html += '  </tbody>\n</table>';
  return html;
}

// Convert markdown-like blog content to HTML
function markdownToHtml(text) {
  if (!text) return '';
  
  let h = text;
  // Always convert markdown tables to HTML tables first, even if the rest of the text is HTML
  h = convertMarkdownTablesToHtml(h);
  
  // If it already looks like HTML, skip subsequent markdown conversions
  if (/^\s*</.test(text)) return cleanHtml(h);
  
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
  // Convert Markdown links [Text](URL) to HTML <a> tags
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Convert raw URLs to HTML <a> tags, avoiding existing href/src/srcset values or URLs already wrapped in <a>
  h = h.replace(/(?<!href=["']|src=["']|srcset=["']|">)(https?:\/\/[^\s<"'`()]+)(?![^<]*<\/a>)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
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
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<ul') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('</ul') || 
      trimmed.startsWith('<p') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('</blockquote') || 
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<tr') ||
      trimmed.startsWith('<td') ||
      trimmed.startsWith('<th') ||
      trimmed.startsWith('</table') ||
      trimmed.startsWith('</tr') ||
      trimmed.startsWith('</td') ||
      trimmed.startsWith('</th') ||
      trimmed.startsWith('<thead') ||
      trimmed.startsWith('</thead') ||
      trimmed.startsWith('<tbody') ||
      trimmed.startsWith('</tbody') ||
      trimmed.startsWith('<a') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('</div')
    ) {
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
    const line = lines[i];
    if (line.includes('<picture') || line.includes('<img') || line.includes('<source')) {
      startIdx = i;
      break;
    }
    const t = line.trim().replace(/<\/?[^>]+>/g, '');
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

function extractContentField(text) {
  if (!text) return '';
  const marker = '"content"';
  const idx = text.indexOf(marker);
  if (idx === -1) return '';

  const colonIdx = text.indexOf(':', idx + marker.length);
  if (colonIdx === -1) return '';

  const startQuoteIdx = text.indexOf('"', colonIdx + 1);
  if (startQuoteIdx === -1) return '';

  let contentValue = '';
  let escaped = false;
  for (let i = startQuoteIdx + 1; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      if (char === 'n') contentValue += '\n';
      else if (char === 't') contentValue += '\t';
      else if (char === '"') contentValue += '"';
      else if (char === '\\') contentValue += '\\';
      else contentValue += '\\' + char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      return contentValue;
    } else {
      contentValue += char;
    }
  }
  return contentValue;
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
  return Object.keys(merged).length > 0 ? merged : null;
}

async function generateBlogContentCore({ title, model, length, tone, language, command, category }) {
  const aiModel = model || 'gemini-2.5-pro';
  const isGroq = GROQ_MODELS.includes(aiModel);
  const toneMap = {
    informative: 'Informative and educational. Explain concepts with examples.',
    funny:       'Fun, light-hearted, and humorous. Keep it entertaining.',
    professional:'Formal and professional. Authoritative tone.',
    beginner:    'Beginner-friendly. Simple language, no jargon.',
    critical:    'Opinionated with a strong stance and reasoning.'
  };

  const sectionMap = {
    short:  'At least 4 comprehensive sections with 2-3 paragraphs each, plus a bullet list and data table. Total ~800-1000 words.',
    medium: 'At least 6 comprehensive sections with 3-4 paragraphs each, plus a detailed data table and a 3-question FAQ. Total ~1200-1500 words.',
    long:   'At least 8-10 comprehensive sections with 4-5 paragraphs each, plus a detailed comparison table, Key Takeaways, and a 4-5 question FAQ. Total ~1800-2500 words.'
  };

  const langMap = {
    hinglish: 'Write in Hinglish (Hindi in Latin script, conversational, like friends chat). Use simple Hinglish throughout. Key terms in English are fine.',
    hindi: 'Write in Hindi (Devanagari script). Pure Hindi with simple wording.',
    english: 'Write in English. Professional but conversational tone.',
  };

  const langInstr = langMap[language] || langMap.hinglish;

  const detectedCategory = category || matchCategory(title);
  const framework = CATEGORY_FRAMEWORKS[detectedCategory] || CATEGORY_FRAMEWORKS['Tech & Tutorials'];
  const categoryFrameworkInstr = framework.prompt;

  let systemPrompt = `You are a Lead Software Architect & Prompt Engineer designing high-ranking articles for Digital Home, an Indian multi-niche platform. Current year: 2026.

**PERMANENT RULES — FOLLOW FOR EVERY POST, ALL MODELS.**

**LANGUAGE: ${langInstr}**

**CATEGORY: ${detectedCategory}**

**CATEGORY-SPECIFIC FRAMEWORK:**
${categoryFrameworkInstr}

**1. GOOGLE SEO CORE RULES (STRICTLY MANDATORY):**
- FOCUS KEYWORD & SLUG INTEGRATION Rules:
  - CRITICAL ENTRY CONSTRAINTS: The AI engine must explicitly pull the provided 'Focus Keyword' (from the simulated keyword strategy below) from the client request.
  - FIRST PARAGRAPH LOCK: The article must start directly with a short, hook-driven introduction paragraph (3-4 lines) BEFORE any H2 headings. The exact focus keyword phrase must be integrated naturally within the first 60 words of this Introduction paragraph. No artificial padding allowed.
  - SUBHEADING INJECTION: The exact focus keyword phrase must be embedded seamlessly inside at least ONE H2 Subheading tag (e.g., "## Focus Keyword Eligibility Criteria" or similar framework headings containing the focus keyword).
  - URL SLUG VALIDATION: Ensure that the generated URL slug matches a strict hyphenated layout containing the core target focus keyword perfectly without special character symbols (e.g., "upsc-combined-geo-scientist-mains-exam-admit-card-2026").
- SUPPORTING/SECONDARY KEYWORDS INJECTION Rules:
  - LATENT SEMANTIC CLUSTERING (LSI): The AI generator must pick secondary/supporting keywords from the metadata context/simulated keywords and naturally sprinkle them across H3 subheadings and bullet points.
  - DENSITY CEILING: Maintain an absolute target density threshold between 1.0% to 1.5% max for both the Focus Keyword and Supporting phrases to completely avoid any Google Spam flag penalties.
- HUMAN-CENTRIC ANTI-FLUFF CONSTRAINTS (Pure Readability):
  - BANNED ROBOTIC PATTERNS: You are strictly forbidden from generating template filler texts anywhere in the post, such as "X is a topic that many people search for online..." or "In today's digital world...".
  - DIRECT VALUE DELIVERY: Lead every single heading section with an immediate, answer-first, authoritative Hinglish/English summary block.
- CREATIVE TITLE OPTIMIZATION (HIGH-IMPACT COPYWRITING):
  - Generate a professional, standard, and highly engaging article title (and store it in the "title" JSON field).
  - DO NOT use generic, plain AI query structures or question-based headings/titles (e.g. avoid words/phrases like "Do you know what is", "What is", "When to", "How to", "Why you need").
  - Rephrase the user's initial input topic/keyword into a powerful, click-worthy copywriting statement that keeps the exact original meaning but changes the wording and structure completely to ensure it does not look like a direct copy of search engine results or other websites.
  - For 'Sarkari Jobs & Exams' category, you MUST write a highly urgent, click-magnet Title inside the "title" JSON field (incorporating key phrases like "Vacancy 2026", "Apply Online Now", "Direct Link", or seat counts dynamically. Example format: "[Job/Board Name] Recruitment 2026: [Vacancy Count/Post Name] Apply Online Now | Direct Link").
  - *Example*: Convert a query like "Do you know what is prompt engineering?" to "Prompt Engineering May Change Your Life" or similar high-impact copywriting statements.
  - The title must look professional, human-crafted, premium, and authoritative.
- LOCAL HINDI TOUCH (MANDATORY FOR JOBS/EXAMS):
  - In the very first paragraph of the post (the introduction), and right above the main vacancy summary table, you MUST write 1-2 lines in pure, conversational Devanagari Hindi or natural Hinglish explaining the core update (e.g., "उत्तर प्रदेश डेयरी विकास विभाग में Data Entry Operator (DEO) की संविदा भर्ती 2026 का नोटिफिकेशन जारी हो गया है..." or similar context). This localized touch captures local search queries and ranks much higher in Google India.
- FOCUS KEYWORD PLACEMENT: The exact focus keyword provided must be injected naturally in the generated Title, the first 2-3 lines of the Introduction paragraph, inside at least one H2 subheading, and maintain a natural density of 1.0% to 1.5% throughout the text body.
- WORD COUNT BOUNDS: Force a deep, comprehensive contextual envelope stretching strictly as per the selected Structure instructions (up to 2500 words for long-form posts). Suppress thin content.
- RICH SNIPPETS DATA: Automatically structure a clean specification data table or comparison grid comparing the topic with current market competitors.
- METADATA EXTRACTION: Generate a strict 140-150 character meta description containing the focus keyword at the very beginning.
- KEYWORD RESEARCH RULES:
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

**2. GENERATIVE ENGINE OPTIMIZATION (GEO) RULES (STRICTLY MANDATORY):**
- AUTHORITATIVE CITATIONS: You MUST embed at least two clear journalistic attribution hooks naturally (e.g., "According to the official board notification criteria...", "As stated in the recruitment guidelines...", "According to industry standards..."). Citing real, credible sources or organizations is crucial for GEO citations and rankings.
- CLARIFY CONCEPTS & GEO CITATION HOOKS: You MUST include at least one clear concept definition using defining verbs (e.g., "refers to", "is defined as", "essentially means", "is officially established by") when introducing technical terminologies, board names, or exam types to help Google's Generative AI Engine understand the entities.
- DYNAMIC CATEGORY-BASED FOOTER BRANDING (MANDATORY):
  You must check the category of the post being generated and append a high-authority HTML Brand Signature Block at the absolute end of the 'content' field:
  * IF CATEGORY IS 'Sarkari Jobs & Exams' (or related to Jobs, Sarkari Result, Admit Card):
    Append this exact HTML block:
    <div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;'>
    <p>यह महत्वपूर्ण जानकारी <strong><a href="/">Digital Home Blog</a></strong> (डिजिटल होम ब्लॉग) द्वारा लाइव सिंक की गई है। हमारे पोर्टल पर आपको सबसे तेज <strong><a href="/">Government Job Vacancy & Result 2026</a></strong>, लेटेस्ट सरकारी नौकरियां, एडमिट कार्ड और रिजल्ट्स के डायरेक्ट लिंक्स मिलते हैं। इसके साथ ही देश-दुनिया, टेक्नोलॉजी और हेल्थ से जुड़े महत्वपूर्ण आर्टिकल्स पढ़ने के लिए हमारे <strong><a href="/">Home</a></strong> और <strong><a href="/blog">Blog</a></strong> सेक्शन को जरूर एक्सप्लोर करें।</p>
    </div>
  * IF CATEGORY IS ANY OTHER (such as Health & Wellness, Tech & Tutorials, AI & Web Tools, News & Trends, Finance & Business, or any Health/Tech/General topics):
    Append this exact HTML block:
    <div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;'>
    <p>यह लेख <strong><a href="/">Digital Home Blog</a></strong> के एक्सपर्ट्स द्वारा रिसर्च करके तैयार किया गया है। हम अपने पाठकों तक हेल्थ, एजुकेशन, लाइफस्टाइल और टेक की सटीक जानकारियां (All Insights Blog) पहुंचाते हैं। यदि आप छात्र हैं, तो हमारे पोर्टल पर लाइव <strong><a href="/">Government Job Vacancy & Result</a></strong> और न्यू वैकेंसी अलर्ट्स का लाभ उठाने के लिए सीधे हमारे <strong><a href="/category/sarkari-jobs-exams">Job Alerts</a></strong> कैटेगरी पर विजिट कर सकते हैं।</p>
    </div>
 
**3. ANSWER ENGINE & VOICE OPTIMIZATION (AEO) RULES (STRICTLY MANDATORY):**
- CONVERSATIONAL HEADERS & AEO SNIPPETS: Use voice-search friendly question words like 'What is', 'How to', or 'Why' across H2 and H3 structures. Utilize conversational query terms like 'what is', 'how to', or 'why' across subheading distributions.
- FAQ BLOCK TERMINATION: Every generated article must conclude with an explicit 'Frequently Asked Questions (FAQ)' section heading. You must include exactly 3 questions formatted as H3.
  - Format each FAQ item EXACTLY as: "### Question: [Hinglish question using Latin script question words like Kaise, Kab, Kya, How to, What is]?" followed by the answer in the next line. Keep individual answers strictly under 45 words for seamless Google Featured Snippet extraction.
- CTA LINK ANCHORING: All critical hyperlinks (Apply Online, Download Admit Card, Official Website) must be grouped cleanly under an explicit 'महत्वपूर्ण लिंक्स' H2 heading using clear bullet points and emoji indicators.

**PAGE SPEED 100/100 RULES (MANDATORY):**
- IMAGES: NEVER include raw JPEG/PNG in content. All images must use <picture> element with WebP format.
  - First/hero image at top: fetchpriority="high" — NO loading="lazy"
  - All other images: loading="lazy" + width="800" height="450" + style="width:100%; height:auto; object-fit:cover;
  - Required format (do NOT output external image URLs like Unsplash to avoid safety filters; strictly use local placeholders and replace [SEO-Alt] with a descriptive, search-oriented Alt tag using the main focus keyword combined with modifiers like 'Notification Image', 'Apply Online Portal', 'Syllabus Details', e.g. alt="UP Dairy Development Vacancy 2026 Notification Details Image"): <picture><source srcset="/assets/images/placeholder.webp" type="image/webp" /><img src="/assets/images/placeholder.jpg" alt="[SEO-Alt]" width="800" height="450" style="width:100%; height:auto; object-fit:cover;" fetchpriority="high" /></picture>
- ZERO BACKGROUND SCRIPTS: content MUST NOT contain any script tags, iframes, crypto widgets, OKX API calls, useEffect hooks, fetch calls to external APIs, or any JavaScript execution code. Page must be 100% clean static content only.
- Keep the output clean HTML with no embedded scripts, no external resource calls.


**SEO METADATA:**
- title: The creative, professional copywriting-optimized title rephrased as per rules.
- slug: The URL slug matching a strict hyphenated layout containing the core target focus keyword perfectly without special character symbols (e.g., "upsc-combined-geo-scientist-mains-exam-admit-card-2026").
- summary: Professional 140-150 character meta description in natural Hinglish containing the focus keyword at the very beginning.
- seoTitle: Click-worthy title under 60 characters for Google India
- seoDescription: 1-2 sentence meta description under 150 chars containing the focus keyword at the very beginning.
- keywords: array of 5-8 SEO tags/strings
- imageTag: single hyphenated keyword for stock photo search
- imagetag: same as imageTag (lowercase)

**CONTENT STRUCTURE:**
- Write in engaging, human-like, natural Hinglish (matching top Indian bloggers). Avoid robotic/generic sentences.
- content: Full blog post using ## for headings on separate lines. NEVER put headings inside bullet points, numbered lists, or tables.
- Dense 3-4 line paragraphs. One idea per paragraph. Mix sentence lengths (short, punchy sentences alongside descriptive ones) to simulate human burstiness and pass AI checkers.
- Do NOT use typical AI bullet lists with bold headers (e.g. "- **Feature:** text") in the body. Instead, write concepts in standard paragraphs. Bullet points are ONLY allowed in the Key Takeaways section.
- Always include 1 highly relevant data table (comparing specs, stats, overview, or reference chart).
- Start with a hook question or surprising stat.
- Include FOCUS KEYWORD 8-10 times naturally (Title, First Paragraph, at least one H2).
- Use SHORT-TAIL keywords in headings, LONG-TAIL in body paragraphs, LSI naturally throughout.
- Use specific numbers, stats, data, real examples.
- Avoid: "Frequ01", "interru01", "Q1" codes, horizontal lines (---, ___).
- Use bold sparingly (max 3-4 per article). No over-quoting, no generic phrases.
- ## Frequently Asked Questions (FAQ) section at end with 3 highly searched questions. Format each as: ### Question: question text? then answer in next line. Keep individual answer arrays strictly under 45 words.
- ## Key Takeaways with 4-5 bullets at end.
- HEADINGS must follow strict descending order: H2 → H3. NEVER skip levels. NEVER wrap entire paragraphs or bullet lists inside heading tags.`;

  const toneInstr = toneMap[tone] || toneMap.informative;
  const targetLength = length || 'long';
  const sectionInstr = sectionMap[targetLength];
  const customInstr = command ? `\n\nAuthor's extra instruction: ${command}` : '';

  let tokenBudget = targetLength === 'short' ? 4096 : targetLength === 'long' ? 8192 : 6144;
  if (isGroq) {
    tokenBudget = Math.min(tokenBudget, 2000);
  }

  let keywordInject = '';
  let kwResearchId = null;
  let resolvedFocusKeyword = '';
  try {
    if (process.env.SKIP_SEO_RESEARCH === 'true') {
      throw new Error('SEO Keyword Research bypassed via environment configuration');
    }
    const kwData = await aggregateKeywordData(title);
    if (kwData && kwData.filtered.length > 0) {
      const allKws = kwData.filtered;
      const focus = allKws.find(k => k.type === 'short-tail') || allKws[0];
      resolvedFocusKeyword = focus.keyword;
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

  if (isGroq) {
    systemPrompt = `You are an expert SEO copywriter and blogger writing high-ranking articles for Digital Home, an Indian MERN platform. Write in natural Hinglish.
MANDATORY RULES:
1. First paragraph must start directly with an intro (no H2 yet) and contain the title/focus keyword phrase.
2. Group all critical action links (Official Website, Apply Online) under a 'महत्वपूर्ण लिंक्स' H2 heading. Group buttons in <div class="ql-table-embed">.
3. Content must conclude with 'Frequently Asked Questions (FAQ)' H2 heading with exactly 3 questions formatted as H3 (e.g. "### Question: ...?").
4. Append this HTML Brand Block at the absolute end of the 'content' field if category is 'Sarkari Jobs & Exams':
   <div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;'>
   <p>यह महत्वपूर्ण जानकारी <strong><a href="/">Digital Home Blog</a></strong> (डिजिटल होम ब्लॉग) द्वारा लाइव सिंक की गई है। हमारे पोर्टल पर आपको सबसे तेज <strong><a href="/">Government Job Vacancy & Result 2026</a></strong>, लेटेस्ट सरकारी नौकरियां, एडमिट कार्ड और रिजल्ट्स के डायरेक्ट लिंक्स मिलते हैं। इसके साथ ही देश-दुनिया, टेक्नोलॉजी और हेल्थ से जुड़े महत्वपूर्ण आर्टिकल्स पढ़ने के लिए हमारे <strong><a href="/">Home</a></strong> और <strong><a href="/blog">Blog</a></strong> सेक्शन को जरूर एक्सप्लोर करें।</p>
   </div>
5. Include 1 HTML data table comparing spec details.
6. JSON schema output MUST contain: title, category, content, slug, keywords (array), summary, imageTag, imagetag, seoTitle, seoDescription. Keep JSON strictly valid.`;
  }

  const userPrompt = `Write a ${toneInstr.toLowerCase()} blog post for 2026 about: "${title}" for category: ${detectedCategory}

Follow the Permanent Rules exactly. Category framework for ${detectedCategory} is MANDATORY.

Structure: ${sectionInstr}. Include 1 data table in body, and FAQ with 3 questions. End with Key Takeaways.${customInstr}${keywordInject}${newsContext}

Return ONLY valid JSON with fields: title (the creative, professional copywriting-optimized title), category, permalink (digitalhomeblog.in/{category-url-slug}/{slug}), content (string with ## headings on separate lines, NEVER inside lists/tables), slug (no stop words), keywords (array), summary (140-160 chars Hinglish with CTA), imageTag, imagetag, seoTitle, seoDescription. content MUST be a STRING. Natural Hinglish. Dense 3-4 line paragraphs.`;

  const isOpenAI = aiModel.startsWith('gpt-');
  const isGemini = aiModel.startsWith('gemini-');
  const modelTimeout = isGroq ? 60000 : (isGemini ? 60000 : 30000);

  let text = '';

  const geminiResponseSchema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      category: { type: "STRING" },
      permalink: { type: "STRING" },
      slug: { type: "STRING" },
      content: { type: "STRING" },
      keywords: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      summary: { type: "STRING" },
      imageTag: { type: "STRING" },
      imagetag: { type: "STRING" },
      seoTitle: { type: "STRING" },
      seoDescription: { type: "STRING" }
    },
    required: ["title", "category", "permalink", "slug", "content", "keywords", "summary", "imageTag", "imagetag", "seoTitle", "seoDescription"]
  };

  if (isGemini) {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6,
      process.env.GEMINI_API_KEY_7
    ].filter(Boolean);

    if (keys.length === 0) {
      throw new Error('No Gemini API key set in .env');
    }

    let lastGeminiErr = null;
    for (const key of keys) {
      const modelsToTry = [aiModel];
      if (aiModel === 'gemini-2.5-pro') {
        modelsToTry.push('gemini-2.5-flash');
      }

      for (const currentModel of modelsToTry) {
        try {
          console.log(`[AI Controller] Trying Gemini model ${currentModel} with key...`);
          const geminiResponse = await axios.post(`${GEMINI_BASE_URL}/${currentModel}:generateContent?key=${key}`, {
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              topP: 0.9,
              responseMimeType: "application/json",
              responseSchema: geminiResponseSchema
            }
          }, {
            timeout: modelTimeout,
            headers: { 'Content-Type': 'application/json' }
          });
          text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            lastGeminiErr = null;
            break; // Success!
          }
        } catch (geminiErr) {
          const isRateLimit = geminiErr.response && geminiErr.response.status === 429;
          console.warn(`[AI Controller] Gemini model ${currentModel} failed (Error: ${geminiErr.message}).`);
          lastGeminiErr = geminiErr;
          if (isRateLimit && currentModel === 'gemini-2.5-pro') {
            console.log(`[AI Controller] Rate limit (429) hit on Pro. Retrying with Flash model...`);
            continue; // Retry with gemini-2.5-flash for same key!
          }
        }
      }

      if (text) {
        break; // Break the keys loop since we have the response!
      }
    }

    if (lastGeminiErr) {
      console.warn(`[AI Controller] All Gemini keys failed. Trying Groq...`);
      if (GROQ_API_KEY) {
        try {
          const groqFallback = await axios.post(GROQ_CHAT_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: tokenBudget,
            top_p: 0.9,
            response_format: { type: "json_object" }
          }, {
            headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 60000
          });
          text = groqFallback.data?.choices?.[0]?.message?.content || '';
        } catch (groqErr) {
          console.error('[AI Controller] Groq fallback failed:', groqErr.message);
          if (OPENAI_API_KEY) {
            try {
              console.log('[AI Controller] Trying OpenAI fallback...');
              const openaiResponse = await axios.post(OPENAI_CHAT_URL, {
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: tokenBudget,
                top_p: 0.9,
                response_format: { type: "json_object" }
              }, {
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 60000
              });
              text = openaiResponse.data?.choices?.[0]?.message?.content || '';
            } catch (openaiErr) {
              console.error('[AI Controller] OpenAI fallback failed:', openaiErr.message);
              throw lastGeminiErr;
            }
          } else {
            throw lastGeminiErr;
          }
        }
      } else if (OPENAI_API_KEY) {
        try {
          console.log('[AI Controller] Trying OpenAI fallback...');
          const openaiResponse = await axios.post(OPENAI_CHAT_URL, {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: tokenBudget,
            top_p: 0.9,
            response_format: { type: "json_object" }
          }, {
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 60000
          });
          text = openaiResponse.data?.choices?.[0]?.message?.content || '';
        } catch (openaiErr) {
          console.error('[AI Controller] OpenAI fallback failed:', openaiErr.message);
          throw lastGeminiErr;
        }
      } else {
        throw lastGeminiErr;
      }
    }
  } else if (isGroq) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not set in .env');
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
      console.error('[AI Controller] Groq call failed detailed error:', JSON.stringify(groqErr.response?.data || groqErr.message, null, 2));
      if (GEMINI_API_KEY) {
        try {
          const geminiFallback = await axios.post(`${GEMINI_BASE_URL}/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192, topP: 0.9, responseMimeType: "application/json", responseSchema: geminiResponseSchema }
          }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });
          text = geminiFallback.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch { throw groqErr; }
      } else {
        throw groqErr;
      }
    }
  } else if (isOpenAI) {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set in .env');
    }
    const openaiResponse = await axios.post(OPENAI_CHAT_URL, {
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: tokenBudget,
      top_p: 0.9,
      response_format: { type: "json_object" }
    }, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: modelTimeout
    });
    text = openaiResponse.data?.choices?.[0]?.message?.content || '';
  } else {
    throw new Error('Invalid model specified. Use GPT, Gemini, or Groq models.');
  }

  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    const fs = require('fs');
    fs.writeFileSync(path.resolve(__dirname, '../../raw_response.txt'), text);
  } catch (e) {
    console.error('Failed to write raw_response.txt:', e.message);
  }

  if (!text) {
    throw new Error('AI returned empty response');
  }

  let parsed = robustJsonParse(text);
  if (parsed) {
    const norm = {};
    for (const [k, v] of Object.entries(parsed)) {
      norm[k.toLowerCase()] = v;
    }
    parsed = norm;
    const fieldKeys = Object.keys(parsed);
    const hasCorruptField = fieldKeys.some(k => {
      const v = parsed[k];
      if (typeof v === 'string' && v.length > 200) {
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
      content = markdownToHtml(raw);
    }
  }

  if (!content) {
    const extracted = extractContentField(text);
    if (extracted.trim()) {
      content = markdownToHtml(extracted);
    }
  }
  if (!content) {
    content = cleanHtml(stripInstructions(text));
  }
  content = cleanExtractedContent(content);

  const plainText = stripHtml(content || '');
  const firstSentence = extractFirstSentence(plainText);

  let optimizedTitle = (parsed?.title && typeof parsed.title === 'string' && parsed.title.trim())
    ? parsed.title.trim()
    : title;
  optimizedTitle = fallbackRephraseTitle(optimizedTitle, detectedCategory);

  if (detectedCategory === 'Sarkari Jobs & Exams' && !optimizedTitle.toLowerCase().includes(title.toLowerCase())) {
    optimizedTitle = `${title}: Notification, Exam Dates & Latest Updates`;
  }

  const slug = (parsed?.slug && parsed.slug.length < 80 && !/\s/.test(parsed.slug)) 
    ? parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') 
    : makeSlug(optimizedTitle);

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

  let imageKeywords = '';
  if (parsed?.imagekeywords && typeof parsed.imagekeywords === 'string') {
    const kw = stripHtml(parsed.imagekeywords).trim().toLowerCase()
      .replace(/[^a-z0-9\s-,]/g, '').replace(/\s+/g, ',').replace(/,+/g, ',').replace(/^,|,$/g, '');
    if (kw && kw.split(',').length >= 2) {
      imageKeywords = kw;
    }
  }
  if (!imageKeywords) {
    imageKeywords = imageTag;
  }

  if (!content) {
    throw new Error('AI returned empty content');
  }

  const processed = await processAIOutput({
    title: optimizedTitle,
    content,
    keywords,
    category: detectedCategory,
    imageTag,
    imageKeywords,
    summary,
    length: targetLength,
    seoTitle: (parsed?.seotitle && typeof parsed.seotitle === 'string' && parsed.seotitle.trim())
      ? parsed.seotitle.trim()
      : (optimizedTitle.length > 70 ? optimizedTitle.slice(0, 67) + '...' : optimizedTitle),
    seoDescription: (parsed?.seodescription && typeof parsed.seodescription === 'string' && parsed.seodescription.trim())
      ? parsed.seodescription.trim()
      : summary.slice(0, 155),
  });

  const finalCategory = processed.category || detectedCategory;
  const permalink = 'digitalhomeblog.in/' + finalCategory.toLowerCase().replace(/\s+/g, '-') + '/' + slug;

  if (!resolvedFocusKeyword && title) {
    resolvedFocusKeyword = title.replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2');
  }

  let finalTags = processed.tags || keywords;
  if (resolvedFocusKeyword) {
    let cleanFocus = resolvedFocusKeyword.trim();
    if (cleanFocus.includes('-') && !cleanFocus.includes(' ')) {
      cleanFocus = cleanFocus.replace(/-/g, ' ');
    }
    finalTags = [
      cleanFocus,
      ...finalTags.filter(t => t.toLowerCase().trim() !== cleanFocus.toLowerCase())
    ];
  }

  return {
    title: optimizedTitle,
    content: processed.content,
    slug,
    permalink,
    summary: processed.summary,
    seoTitle: processed.seoTitle,
    seoDescription: processed.seoDescription,
    keywords: finalTags,
    category: finalCategory,
    imageTag: processed.imageTag,
    imageKeywords: processed.imageKeywords
  };
}

async function generateAIContent(req, res) {
  try {
    const { title, model, length, tone, language, command } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const data = await generateBlogContentCore({
      title,
      model,
      length,
      tone,
      language,
      command,
      category: req.body.category
    });

    res.json({
      success: true,
      ...data
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

    res.status(500).json({ success: false, message: error.message || 'Failed to generate content' });
  }
}

async function convertYoutubeToBlog(req, res) {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl || !videoUrl.trim()) {
      return res.status(400).json({ success: false, message: 'YouTube Video URL is required' });
    }

    // Extract Video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube Video URL format' });
    }

    console.log(`[YouTube to Blog] Fetching metadata for video ID: ${videoId}...`);
    let videoTitle = 'YouTube Video';
    try {
      const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const metaMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});\s*(?:var\s+meta|<\/script>)/i);
      if (metaMatch) {
        const playerResponse = JSON.parse(metaMatch[1]);
        videoTitle = playerResponse?.videoDetails?.title || 'YouTube Video';
      }
    } catch (metaErr) {
      console.warn('[YouTube to Blog] Failed to fetch video title details, falling back to default:', metaErr.message);
    }

    console.log(`[YouTube to Blog] Fetching transcript for: "${videoTitle}"...`);
    const { YoutubeTranscript } = require('youtube-transcript');
    const transcriptArr = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptArr || transcriptArr.length === 0) {
      return res.status(400).json({ success: false, message: 'No subtitles/captions found for this video' });
    }

    const transcriptText = transcriptArr.map(t => t.text).join(' ');
    console.log(`[YouTube to Blog] Transcript length: ${transcriptText.length} chars. Generating blog post...`);

    const command = `Below is the transcript of a YouTube video titled "${videoTitle}". You must use the details, facts, instructions, or tutorials presented in the transcript to write a complete, high-quality, long-form blog post in natural Hinglish. Ensure all key topics from the video are explained clearly.
    
    YOUTUBE TRANSCRIPT:
    """
    ${transcriptText}
    """`;

    const data = await generateBlogContentCore({
      title: videoTitle,
      model: 'gemini-2.5-pro',
      length: 'long',
      tone: 'informative',
      language: 'hinglish',
      category: 'Technology', // Default category
      command: command
    });

    res.json({
      success: true,
      ...data,
      featuredImage: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    });
  } catch (error) {
    console.error('[YouTube to Blog] Failed to convert:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert YouTube video to blog post'
    });
  }
}

async function generateImagePrompt(title) {
  const prompt = `Write a detailed, high-CTR AI image generator prompt for a blog post thumbnail based on the title: "${title}".
You must describe a premium, professional infographic-style post thumbnail layout that follows these strict design rules:
1. COLOR PALETTE: Deep dark blue (navy/indigo) and vibrant yellow contrast theme. High visual impact.
2. CENTRAL VISUAL: A clean, realistic, central visual photograph representing the topic:
   - Space/Science (ISRO): Indian space rocket or launchpad.
   - Transport/Conductor (UPSRTC): Indian local transit bus or station.
   - Navy/Defense (Navy SSC): Indian Navy warship or officers in uniform.
   - Teaching/ECCE (KGVB, Anganwadi): Indian classroom board or school desks.
   - Technology/Business/Money: modern gadgets, computers, or Indian Rupee notes.
   - Engineering/Technical (Junior Engineer): blueprints, building construction site, or drafting tools.
3. DUAL-LANGUAGE TEXT OVERLAY: Specify a bold, high-contrast text overlay containing a short English title (e.g. "UPRTOU YOGA 2026") and its Hindi translation in Devanagari script (e.g. "यूपीआरटू योग प्रवेश 2026") printed clearly on the thumbnail in clean modern typography.
4. KEY FEATURE BADGES: Include two professional gold and navy blue shield-shaped circular badges on the sides with clean icons and small text overlay: "Time-Saving" on one badge, and a relevant trust badge like "Official Alert" or "Authorized University" on the other.
5. MINIMAL CLUTTER: Clean composition, balanced layout, no messy design details.
6. Return ONLY the description prompt in plain English (maximum 55 words, no conversational filler, no introductory verbs like "Create a image").`;

  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error('API_KEY not set in env');
  }

  const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  let lastErr = null;
  for (const key of keys) {
    try {
      const response = await axios.post(`${GEMINI_BASE_URL}/gemini-2.5-pro:generateContent?key=${key}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }, {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json' }
      });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim().replace(/^"(.*)"$/, '$1'); // Strip quotes if any
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[AI Image Prompt] Gemini key failed: ${err.message}. Trying next...`);
    }
  }
  
  if (lastErr) {
    console.log('[AI Image Prompt] All Gemini keys failed. Trying Groq Llama 3.1 8B...');
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY) {
      try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150
        }, {
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 25000
        });
        const text = groqResponse.data?.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          console.log('[AI Image Prompt] Groq Llama successfully generated image prompt.');
          return text.trim().replace(/^"(.*)"$/, '$1');
        }
      } catch (groqErr) {
        console.error('[AI Image Prompt] Groq image prompt generation failed:', groqErr.message);
      }
    }
  }

  throw lastErr || new Error('All image prompt generators failed');
}

module.exports = { generateAIContent, generateBlogContentCore, generateImagePrompt, convertYoutubeToBlog, markdownToHtml };
