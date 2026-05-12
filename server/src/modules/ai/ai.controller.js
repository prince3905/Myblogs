const axios = require('axios');

const OLLAMA_CHAT_URL = 'http://127.0.0.1:11434/api/chat';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const VALID_CATEGORIES = ['Technology', 'Career', 'Tutorial', 'News'];

function matchCategory(text) {
  if (!text) return 'Technology';
  const lower = text.toLowerCase();
  const match = VALID_CATEGORIES.find(c => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower));
  return match || 'Technology';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractKeywords(text, count = 6) {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const stopwords = new Set(['with', 'this', 'that', 'from', 'they', 'will', 'have', 'been', 'were', 'their', 'what', 'about', 'which', 'there', 'into', 'would', 'could', 'should', 'after', 'other', 'being', 'than', 'then', 'your', 'time', 'also', 'more', 'some', 'them', 'when', 'each', 'over', 'such', 'only', 'just', 'very', 'most', 'much']);
  return Object.entries(freq)
    .filter(([w]) => !stopwords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(e => e[0]);
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
    const { title, model, length, tone, command } = req.body;
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

    const systemPrompt = `You are a blog writing AI for Inkspire Content Studio — a premium media house like TechCrunch/The Verge. Current year: 2026.

Return ONLY valid JSON. content field MUST be a single STRING (not an object) using ## for headings and - for lists.
- No markdown, no backticks, no extra text.
- STRICTLY NO codes like "Frequ01", "interru01", "Q1", or any alphanumeric codes inside content.
- content: The FULL blog post using ## for section headings, - for bullet items, blank lines between sections.
- slug: lowercase hyphenated keywords
- keywords: array of 5-8 tag strings
- summary: exactly 2 sentences
- imageTag: single hyphenated keyword for stock photo (e.g. "workspace-setup")
- imageKeywords: comma-separated search-optimized words for stock photo (e.g. "bitcoin,investment,india", never generic)

CONTENT STRUCTURE (Mandatory):
- Title ke baad seedha content mat start karo. Pehle 1 hook line (attention-grabbing), then ## Table of Contents (bullet list of headings), then ## Introduction.
- Headings: ## for main, ### for sub/FAQ
- Heading ke baad hamesha blank line. Heading aur paragraph kabhi merge mat karo.
- ## Table of Contents — bullet list of all major h2 headings only (short 2-4 word labels)
- NO putting sentences in double quotes unless it's an actual citation.
- Content natural aur human-like hona chahiye. Robot jaisa mat likho.

PARAGRAPH RULES (Critical for mobile):
- Ek paragraph 3-4 lines se zyada bada nahi hona chahiye.
- Har 200 words ke baad visual break — bullet points, <blockquote>, bold text, ya subheading.
- Beech-beech mein **bold keywords** aur blockquote (>) use karo.
- Har section mein 2-3 paragraphs ka explanation dalo. Ek line likh ke mat chhoro.
- Real examples, use-cases, ya scenarios add karo jo reader ko value de.

FAQ RULES:
- ### Question: [Question text] — direct heading, NO "Frequ01" labels.
- Answer in normal paragraph below.
- Har FAQ ke beech blank line.

END OF CONTENT:
- End with ## Key Takeaways — 4-5 bullet points summarizing the article.

GENERIC PHRASES TO AVOID:
- "Introduction to React", "In this article", "Let's dive in", "In conclusion", "Let's explore"`;


    const toneInstr = toneMap[tone] || toneMap.informative;
    const sectionInstr = sectionMap[length] || sectionMap.medium;
    const customInstr = command ? `\n\nAuthor's extra instruction: ${command}` : '';

    const tokenBudget = length === 'short' ? 2048 : length === 'long' ? 4096 : 3072;

    const userPrompt = `Write a ${toneInstr.toLowerCase()} blog post for 2026 about: "${title}"

Structure: ${sectionInstr}. Include FAQ with 2-3 questions. End with Key Takeaways.${customInstr}

Return ONLY JSON. The "content" value must be a STRING (not an object or array).`;

    const aiModel = model || 'llama3.2:1b';
    const isOpenAI = aiModel.startsWith('gpt-');
    const isGemini = aiModel.startsWith('gemini-');
    const modelTimeout = isGemini ? 60000 : (isOpenAI ? 30000 : (aiModel.includes('llama') ? 60000 : aiModel.includes('qwen') ? 120000 : 180000));

    let text = '';

    if (isGemini) {
      if (!GEMINI_API_KEY) {
        return res.status(400).json({ success: false, message: 'GEMINI_API_KEY not set in .env' });
      }
      const geminiResponse = await axios.post(`${GEMINI_BASE_URL}/${aiModel}:generateContent?key=${GEMINI_API_KEY}`, {
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
      const response = await axios.post(OLLAMA_CHAT_URL, {
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          repeat_penalty: 1.15,
          top_k: 40,
          top_p: 0.9,
          num_predict: tokenBudget
        }
      }, {
        timeout: modelTimeout
      });
      text = response.data?.message?.content || '';
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
      // Validate fields — discard parsed data if corrupt (phi3:mini artifact)
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
      // Handle case where content is an object (phi3:mini artifact)
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
      content = cleanHtml(text);
    }

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

    res.json({
      success: true,
      content,
      slug,
      summary: summary.slice(0, 300),
      seoTitle: title.length > 70 ? title.slice(0, 67) + '...' : title,
      seoDescription: summary.slice(0, 155),
      keywords,
      category: matchCategory(title + ' ' + plainText),
      imageTag,
      imageKeywords
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

    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        message: 'Ollama is not running. Please start Ollama and try again.',
        ollamaOffline: true
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
