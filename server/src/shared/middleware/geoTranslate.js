const axios = require('axios');
const mongoose = require('mongoose');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-flash-latest';

function needsTranslation(ip, headers = {}) {
  // Skip translation for visitors from India (e.g. via Cloudflare or other country headers)
  const country = (headers['cf-ipcountry'] || headers['x-country-code'] || '').toUpperCase();
  if (country === 'IN') {
    return false;
  }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'localhost') {
    return false;
  }
  return true;
}

// Hinglish common words (Roman script Hindi words)
const HINGLISH_WORDS = new Set([
  'hai','hain','ka','ke','ki','ko','mein','me','se','par','aur','nahi','bahut',
  'acha','accha','kya','yeh','ye','woh','wo','jo','tab','jab','ho','hoga','the',
  'tha','thi','thee','kar','kare','karte','karna','liye','saath','baat','aap',
  'tum','mera','tere','uska','unki','inhe','unhe','aane','jaane','raha','rah',
  'wala','wale','wali','lo','do','de','lekar','rakh','abhi','wahin','jaha',
  'waha','kuch','sab','bhi','hi','toh','to','thoda','zyada','kam','jada',
  'sahi','galat','ho','hai','hain','ho','hoga','hooge','honge','thi','the',
  'tha','aapka','aapki','tumhara','tumhari','iska','iski','uska','uski'
]);

function isEnglish(text) {
  if (!text || !text.trim()) return true;
  
  // Check for Devanagari characters (Hindi script)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) return false; // It's Hindi, needs translation

  // Tokenize and check for Hinglish markers
  const words = text.toLowerCase().replace(/<[^>]+>/g, '').split(/[\s,.;:!?()]+/).filter(Boolean);
  if (words.length === 0) return true;

  let hinglishCount = 0;
  for (const word of words) {
    if (HINGLISH_WORDS.has(word)) {
      hinglishCount++;
    }
  }

  // If >3% words are Hinglish markers, it's Hinglish → needs translation
  const ratio = hinglishCount / words.length;
  return ratio < 0.03;
}

async function translateContent(text) {
  try {
    if (!text || !text.trim()) return text;
    if (!GEMINI_API_KEY) return text;
    if (isEnglish(text)) return text; // Already English, skip

    const prompt = `Translate this Hinglish blog content into professional English. Keep ALL formatting exactly the same: headings (##, ###), bullet points (-, *), bold (**text**), HTML tags, paragraphs, and structure. Do NOT add or remove any sections. Just translate the language.

Content:
${text}`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192, topP: 0.9 }
      },
      { timeout: 30000 }
    );

    const out = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return out || text;
  } catch { return text; }
}

async function translateMeta(title, description) {
  try {
    if (!GEMINI_API_KEY) return { title, description };
    if (!title && !description) return { title, description };
    if (isEnglish(title) && isEnglish(description)) return { title, description };

    const prompt = `Translate this Hinglish SEO title and description into professional English. Keep under same character limits.
Title: "${title}"
Description: "${description}"

Return ONLY valid JSON like: {"title": "...", "description": "..."}`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      },
      { timeout: 15000 }
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || title,
        description: parsed.description || description
      };
    }
  } catch {}
  return { title, description };
}

// Express middleware
function geoTranslateMiddleware(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || req.ip
    || '127.0.0.1';

  req.needsTranslation = needsTranslation(ip, req.headers);
  next();
}

// In-memory queue to track posts currently being translated
const activeTranslations = new Set();

async function performBackgroundTranslation(post) {
  const postIdStr = post._id.toString();
  if (activeTranslations.has(postIdStr)) return;

  activeTranslations.add(postIdStr);
  try {
    const needsTranslateContent = post.content && !isEnglish(post.content);
    const needsTranslateExcerpt = post.excerpt && !isEnglish(post.excerpt);
    const needsMetaTranslate = (post.seoTitle || post.title) && !isEnglish(post.seoTitle || post.title);

    if (!needsTranslateContent && !needsTranslateExcerpt && !needsMetaTranslate) {
      const BlogPost = mongoose.model('BlogPost');
      await BlogPost.findByIdAndUpdate(post._id, {
        $set: { 'translations.en.content': post.content || '' }
      });
      return;
    }

    // Call Gemini API in background
    const [newContent, newExcerpt, meta] = await Promise.all([
      needsTranslateContent ? translateContent(post.content) : Promise.resolve(post.content),
      needsTranslateExcerpt ? translateContent(post.excerpt) : Promise.resolve(post.excerpt),
      needsMetaTranslate ? translateMeta(post.seoTitle || post.title, post.seoDescription || post.excerpt) : Promise.resolve({ title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt })
    ]);

    const BlogPost = mongoose.model('BlogPost');
    await BlogPost.findByIdAndUpdate(post._id, {
      $set: {
        'translations.en.title': meta.title || post.title,
        'translations.en.content': newContent,
        'translations.en.excerpt': newExcerpt || post.excerpt,
        'translations.en.seoTitle': meta.title || post.seoTitle,
        'translations.en.seoDescription': meta.description || post.seoDescription
      }
    });
    console.log(`[GeoTranslate] Background translation successfully cached for post: ${post.title}`);
  } catch (err) {
    console.error(`[GeoTranslate] Background translation failed for post ID ${postIdStr}:`, err.message);
  } finally {
    activeTranslations.delete(postIdStr);
  }
}

// Translate a single post, storing result in DB for zero-delay next time
async function translatePost(post, req) {
  try {
    if (!req.needsTranslation || !post) return post;

    // If English translation already exists in DB, use it instantly
    if (post.translations?.en?.content) {
      return {
        ...post,
        title: post.translations.en.title || post.title,
        content: post.translations.en.content,
        excerpt: post.translations.en.excerpt || post.excerpt,
        seoTitle: post.translations.en.seoTitle || post.seoTitle,
        seoDescription: post.translations.en.seoDescription || post.seoDescription
      };
    }

    // Trigger translation asynchronously in background
    if (post._id) {
      performBackgroundTranslation(post).catch(() => {});
    }

    // Return the original post immediately to prevent any blocking delay
    return post;
  } catch {
    return post; // Fail gracefully, return original
  }
}

module.exports = { geoTranslateMiddleware, translatePost };
