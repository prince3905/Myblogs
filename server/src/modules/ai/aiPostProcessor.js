const axios = require('axios');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function generateTags(title, content, keywords, category) {
  const tags = new Set();

  if (Array.isArray(keywords)) {
    keywords.slice(0, 5).forEach(k => tags.add(k));
  } else if (typeof keywords === 'string') {
    keywords.split(',').slice(0, 5).forEach(k => tags.add(k.trim()));
  }

  const focusWords = title.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  focusWords.slice(0, 3).forEach(w => tags.add(w));

  if (category) tags.add(category);

  const lsiTags = {
    'Career': ['job alert', 'govt jobs', 'exam preparation', 'result 2026', 'apply online', 'syllabus', 'eligibility', 'qualification', 'admit card', 'exam date', 'vacancy', 'recruitment', 'notification', 'latest job', 'career guidance'],
    'Education': ['online classes', 'admission 2026', 'scholarship', 'study material', 'university', 'college', 'entrance exam', 'result', 'board exam', 'competition'],
    'Technology': ['tech news', 'smartphone', 'laptop', 'AI tools', 'software', 'gadgets', 'latest tech', 'digital india', 'app review', 'online tools'],
    'Finance': ['investment', 'saving tips', 'mutual funds', 'tax saving', 'insurance', 'budget 2026', 'stock market', 'crypto', 'gold price', 'loan'],
    'Health': ['fitness', 'yoga', 'diet plan', 'health tips', 'mental health', 'workout', 'nutrition', 'disease', 'hospital', 'medicine'],
    'Tutorial': ['step by step', 'how to', 'guide', 'tips and tricks', 'beginners', 'tutorial 2026', 'learn online', 'DIY', 'easy method'],
    'News': ['breaking news', 'today news', 'india news', 'latest update', 'current affairs', 'news 2026', 'trending', 'viral'],
  };
  if (lsiTags[category]) {
    lsiTags[category].slice(0, 4).forEach(t => tags.add(t));
  }

  const contentWords = (content || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  contentWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  sorted.slice(0, 3).forEach(w => tags.add(w));

  return Array.from(tags).filter(Boolean).slice(0, 10);
}

function cleanContent(content) {
  if (!content) return content;
  let c = content;

  c = c.replace(/<strong>\s*<\/strong>/g, '');
  c = c.replace(/<hr\s*\/?>/gi, '');
  c = c.replace(/---+/g, '');
  c = c.replace(/___+/g, '');

  const KEY_KEEPERS = ['key takeaways', 'faq', 'conclusion', 'summary'];
  const sections = c.split(/(<h[234]>.*?<\/h[234]>)/i);
  const processed = sections.map((section, idx) => {
    const isKeeper = KEY_KEEPERS.some(k => section.toLowerCase().includes(k));
    const prevSection = idx > 0 ? sections[idx - 1] : '';
    const isAfterKeeper = KEY_KEEPERS.some(k => prevSection.toLowerCase().includes(k));

    if (isKeeper || isAfterKeeper) {
      return section;
    }

    let s = section;
    s = s.replace(/<ul>\s*/gi, '');
    s = s.replace(/\s*<\/ul>/gi, '');
    s = s.replace(/<li>(.*?)<\/li>/gi, '<p>$1</p>');
    return s;
  });
  c = processed.join('');

  c = c.replace(/<\/p>\s*<p>/g, '</p>\n<p>');
  c = c.replace(/<p>\s*<\/p>/g, '');
  c = c.replace(/\n{3,}/g, '\n\n');

  return c;
}

async function addInternalLinks(content, category) {
  if (!content) return content;
  try {
    const BlogPost = require('../posts/post.model');
    const relatedPosts = await BlogPost.find({
      category,
      status: 'published',
    }).sort({ publishedAt: -1 }).limit(3);

    if (relatedPosts.length < 2) return content;

    let c = content;
    const linkPost1 = relatedPosts[0];
    const linkPost2 = relatedPosts[1] || relatedPosts[0];

    const targetWord1 = linkPost1.title.split(' ').slice(0, 2).join(' ');
    const linkHtml1 = '<a href="/blog/' + linkPost1.slug + '">' + targetWord1 + '</a>';

    const firstThird = c.indexOf('</p>', c.length / 3);
    if (firstThird > 0) {
      const insertPos = firstThird + 4;
      c = c.slice(0, insertPos) + '\n<p>If you found this helpful, also check out our guide on ' + linkHtml1 + ' for more details.</p>\n' + c.slice(insertPos);
    }

    const targetWord2 = linkPost2.title.split(' ').slice(0, 2).join(' ');
    const linkHtml2 = '<a href="/blog/' + linkPost2.slug + '">' + targetWord2 + '</a>';
    const twoThirds = c.indexOf('</p>', (c.length * 2) / 3);
    if (twoThirds > 0) {
      const insertPos2 = twoThirds + 4;
      c = c.slice(0, insertPos2) + '\n<p>For more information, read our article on ' + linkHtml2 + '.</p>\n' + c.slice(insertPos2);
    }

    return c;
  } catch (e) {
    console.warn('Internal linking failed:', e.message);
    return content;
  }
}

function addInfoTable(content, category, title) {
  if (!content) return content;

  const lowerTitle = (title || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();
  const isGovtJob = /(up police|ssc|upsc|rrb|bank|railway|patwari|lekhpal|ctet|utet|government|sarkari|result|exam|recruitment|vacancy|form)/i.test(lowerTitle + ' ' + lowerCat);

  let tableHtml = '';

  if (isGovtJob) {
    tableHtml = '<h2>Job Overview / नौकरी का विवरण</h2>\n<table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Organization / संगठन</strong></td><td style="border:1px solid #ddd;padding:8px;">[Organization Name]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Post Name / पद का नाम</strong></td><td style="border:1px solid #ddd;padding:8px;">[Post Name]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Total Vacancies / कुल रिक्तियां</strong></td><td style="border:1px solid #ddd;padding:8px;">[Number]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Application Mode / आवेदन का तरीका</strong></td><td style="border:1px solid #ddd;padding:8px;">Online</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Eligibility / पात्रता</strong></td><td style="border:1px solid #ddd;padding:8px;">[Eligibility Criteria]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Application Fee / आवेदन शुल्क</strong></td><td style="border:1px solid #ddd;padding:8px;">[Fee Details]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Last Date / अंतिम तिथि</strong></td><td style="border:1px solid #ddd;padding:8px;">[Last Date]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Official Website / आधिकारिक वेबसाइट</strong></td><td style="border:1px solid #ddd;padding:8px;">[Website URL]</td></tr>\n</table>';
  }

  if (lowerCat === 'technology' || /(smartphone|laptop|phone|mobile|gadget|tablet|watch)/i.test(lowerTitle)) {
    tableHtml = '<h2>Specifications Overview</h2>\n<table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Brand / Model</strong></td><td style="border:1px solid #ddd;padding:8px;">[Brand Name]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Price in India</strong></td><td style="border:1px solid #ddd;padding:8px;">[Price]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Processor</strong></td><td style="border:1px solid #ddd;padding:8px;">[Processor]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>RAM / Storage</strong></td><td style="border:1px solid #ddd;padding:8px;">[RAM / Storage]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Display</strong></td><td style="border:1px solid #ddd;padding:8px;">[Display Size & Type]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Battery</strong></td><td style="border:1px solid #ddd;padding:8px;">[Battery Capacity]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Camera</strong></td><td style="border:1px solid #ddd;padding:8px;">[Camera Details]</td></tr>\n  <tr><td style="border:1px solid #ddd;padding:8px;"><strong>Warranty</strong></td><td style="border:1px solid #ddd;padding:8px;">[Warranty Period]</td></tr>\n</table>';
  }

  if (!tableHtml) return content;

  const insertAfter = content.indexOf('</h2>');
  if (insertAfter > 0) {
    const pos = content.indexOf('</p>', insertAfter);
    if (pos > 0) {
      const insertPos = pos + 4;
      return content.slice(0, insertPos) + '\n' + tableHtml + '\n' + content.slice(insertPos);
    }
  }

  return content;
}

function ensureKeywordFrequency(content, title) {
  if (!content || !title) return content;

  // Use the full title as the keyword phrase
  const phrase = title.toLowerCase().trim();
  // Skip very short/numeric titles (not meaningful as keywords)
  if (phrase.length < 8) return content;

  // Count occurrences with word boundaries
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const count = (plainText.match(new RegExp('\\b' + escaped + '\\b', 'gi')) || []).length;

  // AI prompt already requests 8-10 occurrences; trust the AI
  // Only inject if count is very low (0-1) — AI probably forgot
  if (count >= 2) return content; // AI already handled it

  // Gently insert once or twice in natural places
  let c = content;
  const insertText = '\n<p>' + title + ' is a topic that many people search for online. If you are also looking for information on ' + phrase + ', you have come to the right place.</p>\n';

  // Insert after first </p> (after introduction paragraph)
  const firstP = c.indexOf('</p>');
  if (firstP > 0) {
    c = c.slice(0, firstP + 4) + insertText + c.slice(firstP + 4);
  }

  return c;
}

async function processAIOutput(data) {
  const { title, content, keywords, category } = data;

  if (!content) return data;

  let processedContent = content;

  processedContent = cleanContent(processedContent);
  processedContent = addInfoTable(processedContent, category, title);
  processedContent = await addInternalLinks(processedContent, category);
  processedContent = ensureKeywordFrequency(processedContent, title);
  const tags = generateTags(title, processedContent, keywords, category);

  return {
    ...data,
    content: processedContent,
    tags,
  };
}

module.exports = { processAIOutput, generateTags, cleanContent, addInfoTable, addInternalLinks, ensureKeywordFrequency };
