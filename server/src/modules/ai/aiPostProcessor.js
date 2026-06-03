const axios = require('axios');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateTags(title, content, keywords, category) {
  const tags = new Set();

  // Title as primary tag
  if (title) tags.add(title.toLowerCase());

  if (Array.isArray(keywords)) {
    keywords.slice(0, 5).forEach(k => tags.add(k));
  } else if (typeof keywords === 'string') {
    keywords.split(',').slice(0, 5).forEach(k => tags.add(k.trim()));
  }

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

  const contentWords = (content || '').toLowerCase().replace(/<[^>]*>/g, '').match(/\b[a-z]{3,}\b/g) || [];
  const stopwords = new Set(['the', 'and', 'for', 'are', 'not', 'but', 'has', 'was', 'all', 'can', 'you', 'its', 'our', 'per', 'with', 'this', 'that', 'from', 'they', 'will', 'have', 'been', 'were', 'their', 'what', 'about', 'which', 'there', 'into', 'would', 'could', 'should', 'after', 'other', 'being', 'than', 'then', 'your', 'time', 'also', 'more', 'some', 'them', 'when', 'each', 'over', 'such', 'only', 'just', 'very', 'most', 'much']);
  // Score bigrams from content
  const bigrams = {};
  for (let i = 0; i < contentWords.length - 1; i++) {
    if (!stopwords.has(contentWords[i]) && !stopwords.has(contentWords[i + 1])) {
      const phrase = contentWords[i] + ' ' + contentWords[i + 1];
      bigrams[phrase] = (bigrams[phrase] || 0) + 1;
    }
  }
  Object.entries(bigrams).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([p]) => tags.add(p));

  return Array.from(tags).filter(Boolean).slice(0, 10);
}

function stripScripts(content) {
  if (!content) return content;
  let c = content;

  c = c.replace(/<script[\s\S]*?<\/script>/gi, '');
  c = c.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  c = c.replace(/<object[\s\S]*?<\/object>/gi, '');
  c = c.replace(/<embed[\s\S]*?<\/embed>/gi, '');
  c = c.replace(/\son\w+="[^"]*"/gi, '');
  c = c.replace(/\son\w+='[^']*'/gi, '');
  c = c.replace(/\bjavascript\s*:/gi, '');

  return c;
}

function validateHeadingHierarchy(content) {
  if (!content) return content;

  const headingRegex = /<h([234])[^>]*>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ level: parseInt(match[1]), index: match.index });
  }

  if (headings.length === 0) return content;

  let c = content;
  let lastLevel = 2;
  const corrections = [];

  for (const h of headings) {
    if (h.level < lastLevel) {
      lastLevel = h.level;
    } else if (h.level > lastLevel + 1) {
      corrections.push({ index: h.index, from: h.level, to: lastLevel + 1 });
      lastLevel = lastLevel + 1;
    } else {
      lastLevel = h.level;
    }
  }

  corrections.reverse();
  for (const corr of corrections) {
    const before = c.slice(0, corr.index);
    const after = c.slice(corr.index);
    const fromTag = `<h${corr.from}`;
    const toTag = `<h${corr.to}`;
    if (after.startsWith(fromTag)) {
      c = before + toTag + after.slice(fromTag.length);
    }
  }

  return c;
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

    const catUrl = (linkPost1.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const targetWord1 = linkPost1.title.split(' ').slice(0, 2).join(' ');
    const linkHtml1 = '<a href="/blog/' + catUrl + '/' + linkPost1.slug + '">' + targetWord1 + '</a>';

    const firstThird = c.indexOf('</p>', c.length / 3);
    if (firstThird > 0) {
      const insertPos = firstThird + 4;
      c = c.slice(0, insertPos) + '\n<p>If you found this helpful, also check out our guide on ' + linkHtml1 + ' for more details.</p>\n' + c.slice(insertPos);
    }

    const catUrl2 = (linkPost2.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const targetWord2 = linkPost2.title.split(' ').slice(0, 2).join(' ');
    const linkHtml2 = '<a href="/blog/' + catUrl2 + '/' + linkPost2.slug + '">' + targetWord2 + '</a>';
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

  processedContent = stripScripts(processedContent);
  processedContent = validateHeadingHierarchy(processedContent);
  processedContent = cleanContent(processedContent);
  processedContent = await addInternalLinks(processedContent, category);
  processedContent = ensureKeywordFrequency(processedContent, title);
  const tags = generateTags(title, processedContent, keywords, category);

  // Generate SEO-friendly fallbacks for all fields
  const cat = category || 'Technology';
  const firstWords = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
  const topTag = tags.length > 0 ? tags[0].toLowerCase().replace(/\s+/g, '-') : (firstWords[0] || 'blog');

  const fallbackImageTag = cat.toLowerCase() === 'career' || cat.toLowerCase() === 'education'
    ? 'exam-preparation'
    : cat.toLowerCase() === 'technology'
    ? 'tech-gadgets'
    : cat.toLowerCase() === 'finance'
    ? 'investment-money'
    : cat.toLowerCase() === 'health'
    ? 'fitness-health'
    : firstWords.slice(0, 2).join('-') || 'blog-post';

  const fallbackImageKeywords = tags.slice(0, 5).join(', ') || (title + ', ' + cat);
  const fallbackSummary = stripHtml(processedContent).split(/[.!?\n]/).slice(0, 2).join('. ') + '.';

  return {
    ...data,
    content: processedContent,
    tags,
    imageTag: data.imageTag || fallbackImageTag,
    imageKeywords: data.imageKeywords || fallbackImageKeywords,
    summary: data.summary || fallbackSummary.slice(0, 300),
    seoTitle: data.seoTitle || (title.length > 70 ? title.slice(0, 67) + '...' : title),
    seoDescription: data.seoDescription || fallbackSummary.slice(0, 155),
  };
}

module.exports = { processAIOutput, generateTags, cleanContent, addInternalLinks, ensureKeywordFrequency };
