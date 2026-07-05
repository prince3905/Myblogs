const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../../config/env');
const BlogPost = require('../../modules/posts/post.model');
const { processAIOutput } = require('../../modules/ai/aiPostProcessor');
const { calculateReadingTime } = require('./post.helpers');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

const aiModel = 'gemini-2.5-pro';

// API key active flags (dynamic deactivation)
let isGeminiKey1Active = !!GEMINI_API_KEY;
let isGeminiKey2Active = !!GEMINI_API_KEY_2;
let isGroqActive = !!GROQ_API_KEY;
let isOpenaiActive = !!OPENAI_API_KEY;

// Request retry helper to handle rate limits (429 / 503)
async function requestWithRetry(fn, maxRetries = 2, delayMs = 10000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error?.message || err.message;
      const isRateLimit = status === 429 || status === 503 || message.includes('quota') || message.includes('rate limit');
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`    [Rate Limit/Busy] Waiting ${delayMs / 1000}s and retrying (attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

// Robust JSON parser copied from ai.controller.js
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
  h = h.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^###\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^#+\s+(.+)$/gm, '<p><strong>$1</strong></p>');
  h = h.replace(/<\/p>\s*<\/p>/g, '</p>');
  h = h.replace(/<\/h([23456])up>/gi, '</h$1>');
  h = h.replace(/<\/p>\s*<\/li>/g, '</li>');
  h = h.replace(/<li>\s*<p>/g, '<li>');
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

function markdownToHtml(text) {
  if (!text) return '';
  if (/^\s*</.test(text)) return cleanHtml(text);
  
  let h = text;
  h = h.replace(/^\+[ \t]*/gm, '');
  h = h.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/`{1,3}/g, '');
  h = h.replace(/\{["\'].*?\}\s*$/s, '');
  h = h.replace(/devops_blog\s*\{.*/s, '');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/`(.+?)`/g, '<code>$1</code>');
  // Convert Markdown links [Text](URL) to HTML <a> tags
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Convert raw URLs to HTML <a> tags, avoiding existing href values or URLs already wrapped in <a>
  h = h.replace(/(?<!href=["']|">)(https?:\/\/[^\s<"'`()]+)(?![^<]*<\/a>)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  h = h.replace(/\[\d+\]/g, '');
  h = h.replace(/[[\]]/g, '');
  h = h.replace(/^[-*]\s*(.+)$/gm, '<li>$1</li>');
  h = h.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>\n$1</ul>\n');
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

function stripInstructions(raw) {
  if (!raw) return '';
  const headingMatch = raw.match(/^(?:#{1,3}\s+|<h[234]>)/m);
  if (headingMatch && headingMatch.index > 0) {
    const before = raw.slice(0, headingMatch.index).trim();
    if (before.length < 200 && /(?:here|okay|sure|certainly|absolutely|write|article|blog|post|content|below|following|this|i('ve| have| would| will)|you requested)/i.test(before)) {
      return raw.slice(headingMatch.index);
    }
  }
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

function cleanExtractedContent(raw) {
  if (!raw) return raw;
  const lines = raw.split('\n');
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const t = lines[i].trim().replace(/<\/?[^>]+>/g, '');
    if (!t) continue;
    const lower = t.toLowerCase();
    if (/^(#{1,3}\s+|<h[234]>)/i.test(t)) {
      startIdx = i;
      break;
    }
    if (/^(slug|keywords?|summary|image[- ]?tag|image[- ]?keywords?|seo[- ]?title|seo[- ]?description)\s*[:：]/i.test(lower) ||
        /\b(slug|keywords?|summary|image[- ]?tag|image[- ]?keywords?|seo[- ]?title|seo[- ]?description)\s*[:：]/i.test(lower)) {
      continue;
    }
    if (/(?:^(?:<p>)?\s*(act as|you are|write a|strict instructions?|do not|structure the|here (?:is|are)|sure|certainly|absolutely|okay|i will|i have|i've|the following|this is a))/i.test(t)) {
      continue;
    }
    startIdx = i;
    break;
  }
  const result = lines.slice(startIdx).join('\n').trim();
  if (result && startIdx > 0) return cleanHtml(result);
  return raw;
}

// Generate expanded version using Gemini API with fallback to Gemini 2, Groq, and OpenAI
async function generateExpandedContent(title, currentContent, category) {
  const systemPrompt = `You are a Permanent Advanced SEO Content Specialist for Digital Home, an Indian multi-niche platform. Current year: 2026.
You write comprehensive, rich, and high-value long-form guides.
ZERO TOLERANCE FOR ROBOTIC AI TRANSITIONS & WORDS:
NEVER use: "In conclusion", "To summarize", "It is important to note that", "Furthermore", "Moreover", "Lastly", "Additionally", "Delve", "Testament", "Embark", "Paving the way", "Game changer", "In the rapidly evolving world", "Look no further".
Instead, use conversational, friendly transitions: "तो", "अब बात करते हैं", "चलिए जानते हैं", "वैसे ही", "इसके अलावा", "सच कहें तो", "मजेदार बात यह है", "देखिए", "अब सवाल यह आता है".
Avoid typical AI bullet lists with bold headers in body paragraphs. Expand explanations in natural, flowing paragraphs.`;

  const userPrompt = `You are a professional SEO writer. Expand this short blog post titled "${title}" (in category "${category}") into a detailed, comprehensive, high-value guide of at least 1,200 to 1,500 words.

Original content:
${currentContent}

Instructions:
1. Detect whether the original post language is Hinglish (Hindi in English letters), Hindi, or English. Write the expanded content in the EXACT same language/style.
2. The final content MUST be at least 1,200 to 1,500 words long. Detail every concept, process, feature, or tip. If it's a technical tutorial, include step-by-step instructions. If news/trends, write in live-news journalism style.
3. Include at least 1 detailed, relevant comparison table, checklist table, or data summary table in the body.
4. Include an FAQ section with 3 highly searched questions at the end. Format as "### Question: [text]?" then the answer on the next line.
5. Include a "## Key Takeaways" section at the end with 4-5 bullet points.
6. Return ONLY valid JSON with fields: content (string with ## headings on separate lines), summary (140-160 chars meta description with CTA), seoTitle, seoDescription, keywords (array of 5-8 strings).`;

  let text = '';
  let providerUsed = '';

  // 1. Try Gemini API Key 1
  if (isGeminiKey1Active) {
    try {
      console.log("  → Attempting Gemini Key 1...");
      const response = await requestWithRetry(() => axios.post(`${GEMINI_BASE_URL}/${aiModel}:generateContent?key=${GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, topP: 0.9, responseMimeType: "application/json" }
      }, { timeout: 90000, headers: { 'Content-Type': 'application/json' } }), 2, 10000);

      text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      providerUsed = 'Gemini Key 1';
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        console.warn(`  × Gemini Key 1 hit rate limit (status ${status}). Deactivating for this run.`);
        isGeminiKey1Active = false;
      } else {
        console.warn(`  × Gemini Key 1 failed (status ${status || err.code}).`);
      }
    }
  }

  // 2. Try Gemini API Key 2
  if (!text && isGeminiKey2Active) {
    try {
      console.log("  → Attempting Gemini Key 2...");
      const response = await requestWithRetry(() => axios.post(`${GEMINI_BASE_URL}/${aiModel}:generateContent?key=${GEMINI_API_KEY_2}`, {
        contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, topP: 0.9, responseMimeType: "application/json" }
      }, { timeout: 90000, headers: { 'Content-Type': 'application/json' } }), 2, 10000);

      text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      providerUsed = 'Gemini Key 2';
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        console.warn(`  × Gemini Key 2 hit rate limit (status ${status}). Deactivating for this run.`);
        isGeminiKey2Active = false;
      } else {
        console.warn(`  × Gemini Key 2 failed (status ${status || err.code}).`);
      }
    }
  }

  // 3. Try Groq (Llama-3.3-70b-versatile)
  if (!text && isGroqActive) {
    try {
      console.log("  → Attempting Groq (llama-3.3-70b-versatile)...");
      const response = await requestWithRetry(() => axios.post(GROQ_CHAT_URL, {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 6144,
        top_p: 0.9,
        response_format: { type: "json_object" }
      }, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 90000
      }), 2, 10000);

      text = response.data?.choices?.[0]?.message?.content || '';
      providerUsed = 'Groq Llama 70B';
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        console.warn(`  × Groq hit rate limit (status ${status}). Deactivating for this run.`);
        isGroqActive = false;
      } else {
        console.warn(`  × Groq failed (status ${status || err.code}).`);
      }
    }
  }

  // 4. Try OpenAI (gpt-4o-mini)
  if (!text && isOpenaiActive) {
    try {
      console.log("  → Attempting OpenAI (gpt-4o-mini)...");
      const response = await requestWithRetry(() => axios.post(OPENAI_CHAT_URL, {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.9,
        response_format: { type: "json_object" }
      }, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 90000
      }), 2, 10000);

      text = response.data?.choices?.[0]?.message?.content || '';
      providerUsed = 'OpenAI GPT-4o-mini';
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        console.warn(`  × OpenAI hit rate limit (status ${status}). Deactivating for this run.`);
        isOpenaiActive = false;
      } else {
        console.error(`  × OpenAI failed (status ${status || err.code}).`);
      }
    }
  }

  if (!text) {
    throw new Error('All model providers failed to generate content.');
  }

  console.log(`  ✓ Content generated successfully via ${providerUsed}`);

  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed = robustJsonParse(text);
  if (!parsed) {
    throw new Error('Failed to parse model output as JSON');
  }

  let content = '';
  if (parsed.content) {
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

  if (!content) {
    const extracted = extractContentField(text);
    if (extracted.trim()) {
      content = (/^\s*</.test(extracted)) ? cleanHtml(extracted) : markdownToHtml(extracted);
    }
  }

  if (!content) {
    content = cleanHtml(stripInstructions(text));
  }

  content = cleanExtractedContent(content);

  return {
    content,
    summary: parsed.summary || '',
    seoTitle: parsed.seoTitle || title,
    seoDescription: parsed.seoDescription || parsed.summary || '',
    keywords: parsed.keywords || []
  };
}

async function main() {
  console.log("=== Post Expander CLI Utility ===");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB successfully.");

  const posts = await BlogPost.find({ status: 'published' });
  console.log(`Found total ${posts.length} published posts in database.`);

  const thinPosts = posts.filter(post => {
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;
    return wordCount < 600;
  });

  console.log(`Found ${thinPosts.length} thin posts (< 600 words) that require expansion.`);
  if (thinPosts.length === 0) {
    console.log("No thin posts found! DB is already high value.");
    mongoose.connection.close();
    process.exit(0);
  }

  for (let i = 0; i < thinPosts.length; i++) {
    const post = thinPosts[i];
    const initialWordCount = post.content ? post.content.split(/\s+/).length : 0;
    console.log(`\n[${i + 1}/${thinPosts.length}] Processing: "${post.title}" (${initialWordCount} words)`);

    try {
      // Step 1: Call model fallback sequence to expand the post
      const expanded = await generateExpandedContent(post.title, post.content, post.category);

      // Step 2: Apply SEO cleaning and internal linking post-processor
      const processed = await processAIOutput({
        title: post.title,
        content: expanded.content,
        keywords: expanded.keywords,
        category: post.category,
        imageTag: post.imageTag,
        imageKeywords: post.imageKeywords,
        summary: expanded.summary,
        seoTitle: expanded.seoTitle,
        seoDescription: expanded.seoDescription
      });

      // Step 3: Save back to the database
      post.content = processed.content;
      post.excerpt = processed.summary;
      post.seoTitle = processed.seoTitle;
      post.seoDescription = processed.seoDescription;
      post.tags = processed.tags;
      post.seoKeywords = processed.tags;
      post.readingTime = calculateReadingTime(processed.content);
      
      await post.save();
      const finalWordCount = processed.content.split(/\s+/).length;
      console.log(`  ✓ Saved! Words: ${initialWordCount} -> ${finalWordCount}. Reading time: ${post.readingTime} min.`);

    } catch (error) {
      console.error(`  × Error expanding "${post.title}":`, error.message);
    }

    if (i < thinPosts.length - 1) {
      console.log("Waiting 6 seconds before next request...");
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }

  console.log("\nAll thin posts processing attempt completed!");
  mongoose.connection.close();
  console.log("Disconnected from MongoDB. Done.");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
