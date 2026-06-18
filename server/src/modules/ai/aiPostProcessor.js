const axios = require('axios');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateTags(title, content, keywords, category) {
  const tags = new Set();

  // Add title as a tag only if it is short and simple (under 4 words, no colons)
  if (title && title.split(/\s+/).length < 4 && !title.includes(':')) {
    tags.add(title.toLowerCase().trim());
  }

  if (Array.isArray(keywords)) {
    keywords.slice(0, 5).forEach(k => tags.add(k.toLowerCase().trim()));
  } else if (typeof keywords === 'string') {
    keywords.split(',').slice(0, 5).forEach(k => tags.add(k.toLowerCase().trim()));
  }

  // Do not add broad category as a tag chip for Sarkari, it is redundant
  if (category && category !== 'Sarkari Jobs & Exams') {
    tags.add(category.toLowerCase().trim());
  }

  const lsiTags = {
    'Sarkari Jobs & Exams': ['govt jobs', 'latest job', 'admit card', 'sarkari result', 'exam date', 'recruitment', 'job alert'],
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

function cleanContent(content, category) {
  if (!content) return content;
  let c = content;

  c = c.replace(/<strong>\s*<\/strong>/g, '');
  c = c.replace(/<hr\s*\/?>/gi, '');
  c = c.replace(/---+/g, '');
  c = c.replace(/___+/g, '');

  // For Sarkari Jobs & Exams, we want to preserve lists (ul/li) and tables exactly as they are.
  if (category === 'Sarkari Jobs & Exams') {
    return c;
  }

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

function sanitizeThirdPartyLinks(content) {
  if (!content) return content;
  let c = content;

  // 1. Replace <a> tags pointing to third-party tools
  c = c.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, anchorText) => {
    const lowerHref = href.toLowerCase();
    const lowerAnchor = anchorText.toLowerCase();
    
    // If it's a link to a third-party site and has keywords of tools/resizers, change to /tools
    if (
      (lowerHref.includes('sarkariresult') || lowerHref.includes('freejobalert') || lowerHref.includes('ilovepdf') || lowerHref.includes('imageresizer') || lowerHref.includes('pdfresizer')) &&
      (lowerHref.includes('tool') || lowerHref.includes('resize') || lowerHref.includes('compress') || lowerHref.includes('crop') || lowerHref.includes('convert') || lowerHref.includes('age') ||
       lowerAnchor.includes('tool') || lowerAnchor.includes('resize') || lowerAnchor.includes('compress') || lowerAnchor.includes('crop') || lowerAnchor.includes('signature') || lowerAnchor.includes('age-calculator'))
    ) {
      return `<a href="/tools">Student Utility Tools</a>`;
    }
    return match;
  });

  // 2. Also replace raw URLs or any link inside parentheses like (Link: https://...) or similar text that might not be in an <a> tag
  c = c.replace(/(https?:\/\/[^\s<"'`()]+(?:sarkariresult\.com\/tools|sarkariresult\.com\/resizer|sarkariresult\.tools|freejobalert\.com\/tools|ilovepdf\.com|imageresizer\.com)[^\s<"'`()]*)/gi, '/tools');

  return c;
}

function injectStudentToolsPromo(content, category) {
  if (!content) return content;
  if (category !== 'Sarkari Jobs & Exams') return content;

  // Idempotency check to avoid duplicate injections
  if (content.includes('student-tools-promo')) {
    return content;
  }

  const promoCard = `
<div class="student-tools-promo" style="margin: 24px 0; padding: 20px; border-radius: 12px; border: 2px dashed #10b981; background: #f0fdf4; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: left;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <span style="font-size: 20px; line-height: 1;">🚀</span>
    <h3 style="margin: 0; color: #065f46; font-size: 1.2rem; font-weight: 700; border: none; padding: 0;">Digital Home Free Student Utility Tools</h3>
  </div>
  <p style="margin: 0 0 16px 0; color: #15803d; font-size: 0.95rem; line-height: 1.5;">
    Apne application form ke liye photo resize, signature crop aur documents compress karne ke liye humare <strong>100% Free & Fast Tools</strong> ka use karein. Kisi third-party site par jaane ki zaroorat nahi hai:
  </p>
  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📸 Photo Resizer</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">✍️ Signature Cropper</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📅 Age Calculator</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📄 PDF Compressor</a>
  </div>
</div>
`;

  // Find where to insert. We prefer to insert right before the "Important Links" section.
  const linksHeaderRegex = /(<h[23][^>]*>(?:महत्वपूर्ण लिंक्स|Important\s+Links|Useful\s+Links|Important\s+Useful\s+Links|Link|महत्वपूर्ण\s+लिंक)[^<]*<\/h[23]>)/i;
  
  if (linksHeaderRegex.test(content)) {
    return content.replace(linksHeaderRegex, `${promoCard}\n$1`);
  }

  // Fallback 1: Insert before FAQ section
  const faqHeaderRegex = /(<h[23][^>]*>(?:FAQ|Frequently\s+Asked\s+Questions|Frequently\s+Asked\s+Question|अक्सर\s+पूछे\s+जाने\s+वाले\s+सवाल)[^<]*<\/h[23]>)/i;
  if (faqHeaderRegex.test(content)) {
    return content.replace(faqHeaderRegex, `${promoCard}\n$1`);
  }

  // Fallback 2: Append before Key Takeaways/Conclusion
  const takeawaysRegex = /(<h[23][^>]*>(?:Key\s+Takeaways|Takeaways|निष्कर्ष|Conclusion)[^<]*<\/h[23]>)/i;
  if (takeawaysRegex.test(content)) {
    return content.replace(takeawaysRegex, `${promoCard}\n$1`);
  }

  // Fallback 3: Append at the end of content
  return content + `\n${promoCard}`;
}

async function processAIOutput(data) {
  const { title, content, keywords, category } = data;

  if (!content) return data;

  let processedContent = content;

  processedContent = stripScripts(processedContent);
  processedContent = validateHeadingHierarchy(processedContent);
  processedContent = cleanContent(processedContent, category);
  processedContent = await addInternalLinks(processedContent, category);
  processedContent = ensureKeywordFrequency(processedContent, title);
  
  // Sanitize bad external tools links and inject local promotional tools card
  processedContent = sanitizeThirdPartyLinks(processedContent);
  processedContent = injectStudentToolsPromo(processedContent, category);

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

module.exports = { processAIOutput, generateTags, cleanContent, addInternalLinks, ensureKeywordFrequency, sanitizeThirdPartyLinks, injectStudentToolsPromo };
