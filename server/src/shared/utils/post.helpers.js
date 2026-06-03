const slugify = require('slugify');

// Known acronyms that should remain uppercase in titles
const ACRONYMS = new Set([
  'cbse', 'upsc', 'ssc', 'cgl', 'chsl', 'gd', 'nda', 'cds', 'ias', 'ips',
  'ai', 'ipl', 't20', 'odi', 'gst', 'ipo', 'sip', 'kYC', 'gpt', 'llm',
  'seo', 'html', 'css', 'js', 'api', 'url', 'ui', 'ux', 'php', 'sql',
  'pdf', 'jpg', 'png', 'webp', 'vpn', 'iot', 'b2b', 'b2c', 'diy',
]);

// Minimal Devanagari → Latin transliteration map
const HINDI_TRANSLIT = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ः': 'h', 'ृ': 'ri',
  'ॅ': 'e', 'ॉ': 'o',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function isDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

function transliterateHindi(text) {
  let result = '';
  for (const ch of text) {
    result += HINDI_TRANSLIT[ch] || ch;
  }
  return result;
}

function toTitleCase(text) {
  const lower = text.trim().toLowerCase();
  if (!lower) return text;

  // If Devanagari, just return as-is (slug will transliterate)
  if (isDevanagari(lower)) return text.trim();

  const smallWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'nor', 'for', 'of', 'in', 'on', 'at', 'by', 'to', 'with', 'via', 'vs']);

  return lower.split(/\s+/).map((word, i, arr) => {
    // Always uppercase first & last word
    if (i === 0 || i === arr.length - 1) {
      return ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1);
    }
    // Known acronym → uppercase
    if (ACRONYMS.has(word)) return word.toUpperCase();
    // Small word → lowercase
    if (smallWords.has(word)) return word;
    // Default: capitalize
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function makeSlug(title, fallback = 'post') {
  const raw = (title || fallback);
  // Transliterate Hindi before slugifying
  const transliterated = isDevanagari(raw) ? transliterateHindi(raw) : raw;
  return slugify(transliterated, { lower: true, strict: true, trim: true });
}

function normalizeCsvOrArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateReadingTime(content) {
  const words = `${content || ''}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

module.exports = {
  makeSlug,
  normalizeCsvOrArray,
  calculateReadingTime,
  toTitleCase,
  transliterateHindi,
  isDevanagari,
};
