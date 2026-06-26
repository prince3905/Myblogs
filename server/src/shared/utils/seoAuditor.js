/**
 * Real-time SEO Auditor & Google Rank Predictor Helper (Backend CommonJS Version)
 */

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function calculateSeoScore(post, keywordResearch = null) {
  const title = post.title || '';
  const content = post.content || '';
  const contentClean = stripHtml(content);
  const seoTitle = post.seoTitle || title;
  const seoDescription = post.seoDescription || post.excerpt || '';
  const slug = post.slug || '';

  // 1. Determine Focus Keyword
  let focusKeyword = '';
  let keywordKD = 35; // default moderate competition
  let keywordVolume = 1000;

  if (keywordResearch && Array.isArray(keywordResearch.filtered) && keywordResearch.filtered.length > 0) {
    const focusObj = keywordResearch.filtered.find(k => k.type === 'short-tail') || keywordResearch.filtered[0];
    focusKeyword = focusObj.keyword;
    keywordKD = focusObj.kd || 35;
    keywordVolume = focusObj.searchVolume || 1000;
  }

  if (!focusKeyword && post.tags) {
    const firstTag = typeof post.tags === 'string' ? post.tags.split(',')[0] : Array.isArray(post.tags) ? post.tags[0] : '';
    focusKeyword = firstTag ? firstTag.trim() : '';
  }

  if (!focusKeyword) {
    // Fallback: use first 3 words of title
    focusKeyword = title.split(/\s+/).slice(0, 3).join(' ');
  }

  focusKeyword = (focusKeyword || '').toLowerCase().trim();
  // Unhyphenate slug-like focus keywords to ensure matches succeed
  if (focusKeyword.includes('-') && !focusKeyword.includes(' ')) {
    focusKeyword = focusKeyword.replace(/-/g, ' ');
  }

  // Words calculation
  const words = contentClean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const cleanFocusAlphaNum = focusKeyword.replace(/[^a-z0-9]/g, '');
  const cleanTitleAlphaNum = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Initialize checks
  const checks = {
    keywordInTitle: false,
    keywordInSlug: false,
    keywordInIntro: false,
    keywordInH2: false,
    keywordDensityOk: false,
    wordCountOk: false,
    hasTable: false,
    metaOk: false
  };

  const suggestions = [];
  let score = 0;

  // Metric 1: Focus Keyword in Title (15 pts)
  if (focusKeyword && (title.toLowerCase().includes(focusKeyword) || cleanTitleAlphaNum.includes(cleanFocusAlphaNum))) {
    checks.keywordInTitle = true;
    score += 15;
  } else {
    suggestions.push(`Title me apna focus keyword ("${focusKeyword}") add karein.`);
  }

  // Metric 2: Focus Keyword in URL Slug (10 pts)
  const slugKeyword = focusKeyword.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cleanSlugAlphaNum = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (focusKeyword && (cleanSlug.includes(slugKeyword) || cleanSlugAlphaNum.includes(cleanFocusAlphaNum))) {
    checks.keywordInSlug = true;
    score += 10;
  } else {
    suggestions.push(`URL Slug me hyphenated focus keyword ("${slugKeyword}") include karein.`);
  }

  // Metric 3: Focus Keyword in Intro (15 pts)
  const introText = contentClean.slice(0, 400).toLowerCase();
  const cleanIntroAlpha = introText.replace(/[^a-z0-9]/g, '');
  if (focusKeyword && (introText.includes(focusKeyword) || cleanIntroAlpha.includes(cleanFocusAlphaNum))) {
    checks.keywordInIntro = true;
    score += 15;
  } else {
    suggestions.push("Article ki pehli 2-3 lines (Introduction) me focus keyword use karein.");
  }

  // Metric 4: Focus Keyword in H2 Heading (15 pts)
  const hasKeywordInH2 = (content.toLowerCase().match(/<h2[^>]*>[\s\S]*?<\/h2>/g) || [])
    .some(h => {
      const text = stripHtml(h).toLowerCase();
      return text.includes(focusKeyword) || text.replace(/[^a-z0-9]/g, '').includes(cleanFocusAlphaNum);
    }) 
    || 
    (content.toLowerCase().match(/^##\s+.+$/gm) || [])
    .some(h => {
      const text = h.toLowerCase();
      return text.includes(focusKeyword) || text.replace(/[^a-z0-9]/g, '').includes(cleanFocusAlphaNum);
    });

  if (hasKeywordInH2) {
    checks.keywordInH2 = true;
    score += 15;
  } else {
    suggestions.push("Apne content ki kisi ek H2 Subheading me focus keyword add karein.");
  }

  // Metric 5: Keyword Density (15 pts)
  let density = 0;
  if (focusKeyword && wordCount > 0) {
    const flexiblePattern = focusKeyword
      .split(/[\s\/-]+/)
      .filter(Boolean)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[\\s\\/-]+');
    const regex = new RegExp('\\b' + flexiblePattern + '\\b', 'gi');

    const matches = contentClean.match(regex);
    const count = matches ? matches.length : 0;
    density = parseFloat(((count / wordCount) * 100).toFixed(2));

    if (density >= 0.7 && density <= 2.2) {
      checks.keywordDensityOk = true;
      score += 15;
    } else if (density > 2.2) {
      suggestions.push(`Keyword density zyada hai (${density}%). Keyword stuffing se bachein aur count thoda kam karein.`);
      score += 8;
    } else if (density > 0 && density < 0.7) {
      suggestions.push(`Keyword density thodi kam hai (${density}%). Focus keyword ko pure body me 2-3 baar aur naturally insert karein.`);
      score += 8;
    } else {
      suggestions.push("Content ke body text me focus keyword ko naturally 3-5 baar use karein.");
    }
  } else {
    suggestions.push("Content body text me focus keyword insert karein.");
  }

  // Metric 6: Word Count Depth (15 pts)
  if (wordCount >= 1100) {
    checks.wordCountOk = true;
    score += 15;
  } else if (wordCount >= 700) {
    suggestions.push(`Word count (${wordCount} words) theek hai, par SEO depth aur AdSense approval ke liye ise 1,200+ words tak badhayein.`);
    score += 10;
  } else if (wordCount >= 400) {
    suggestions.push(`Thin content alert: word count sirf ${wordCount} words hai. AdSense isse rejected kar sakta hai, content ko extend karein.`);
    score += 5;
  } else {
    suggestions.push("Article bahut chhota hai (< 400 words). Detailed informative guide likhein.");
  }

  // Metric 7: Tables/Data Structure (10 pts)
  const hasMarkdownTable = /\|[^\n]+\|\r?\n\s*\|[-:| ]+\|\r?\n\s*\|[^\n]+\|/.test(content);
  if (content.toLowerCase().includes('<table') || content.toLowerCase().includes('class="comparison-table"') || content.toLowerCase().includes('class="data-table"') || hasMarkdownTable) {
    checks.hasTable = true;
    score += 10;
  } else {
    suggestions.push("Google Rich Snippets ke liye table (data table ya specs checklist) insert karein.");
  }

  // Metric 8: Meta title/description check (5 pts)
  const cleanMetaAlphaNum = seoDescription.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hasMetaKeyword = seoDescription.toLowerCase().includes(focusKeyword) || cleanMetaAlphaNum.includes(cleanFocusAlphaNum);
  const isMetaLenOk = seoDescription.length >= 100 && seoDescription.length <= 165;
  if (hasMetaKeyword && isMetaLenOk) {
    checks.metaOk = true;
    score += 5;
  } else {
    if (!hasMetaKeyword) {
      suggestions.push("SEO Meta Description me focus keyword add karein.");
    }
    if (!isMetaLenOk) {
      suggestions.push(`SEO Description ki length (${seoDescription.length} chars) badhein (110-155 characters recommended).`);
    }
  }

  // Calculate Rank Predictor
  let rankPrediction = {
    range: "N/A",
    potential: "Low",
    badgeColor: "#6b7280",
    description: "Audit generate karne ke liye titles ya keywords check karein."
  };

  if (focusKeyword) {
    if (keywordKD <= 18) {
      if (score >= 80) {
        rankPrediction = {
          range: "#1 - #3 (Top 3 Potential)",
          potential: "High",
          badgeColor: "#10b981",
          description: "Low Keyword difficulty aur strong SEO score! Google Page 1 ke top spots me rank karne ke chances bahut zyada hain."
        };
      } else {
        rankPrediction = {
          range: "#4 - #8 (Page 1 Spot)",
          potential: "Medium",
          badgeColor: "#f59e0b",
          description: "Keyword low competition hai, par SEO score thoda badhayein taaki rank top 3 me ja sake."
        };
      }
    } else if (keywordKD <= 35) {
      if (score >= 82) {
        rankPrediction = {
          range: "#3 - #7 (Page 1)",
          potential: "High",
          badgeColor: "#10b981",
          description: "Moderate competition! Apka customized structure Google Page 1 par rank dila sakta hai."
        };
      } else {
        rankPrediction = {
          range: "#8 - #15 (Page 1/2 Border)",
          potential: "Medium",
          badgeColor: "#f59e0b",
          description: "Competitors strong hain. Suggestions follow karke SEO score 80+ le jayein Page 1 rank karne ke liye."
        };
      }
    } else if (keywordKD <= 55) {
      if (score >= 88) {
        rankPrediction = {
          range: "#8 - #14 (Page 1 Border)",
          potential: "Medium",
          badgeColor: "#f59e0b",
          description: "High Competition keyword! Baki content rules perfect hain, Page 1 bottom ya Page 2 ke top rank ke chances hain."
        };
      } else {
        rankPrediction = {
          range: "#15 - #30 (Page 2/3)",
          potential: "Low",
          badgeColor: "#ef4444",
          description: "Competition high hai aur SEO score low hai. Article me suggestions fix karein aur internal links badhayein."
        };
      }
    } else {
      rankPrediction = {
        range: "Page 3+ (Very Hard)",
        potential: "Low",
        badgeColor: "#ef4444",
        description: "Hard keyword (KD > 55%). Is keyword par rank karne के लिए आपको high-quality backlinks और massive traffic चाहिए।"
      };
    }
  }

  // --- GEO Optimization Audit (max 100) ---
  const geoChecks = {
    hasCitations: false,
    hasStats: false,
    hasSummary: false,
    hasDefinitions: false
  };
  let geoScore = 0;

  // 1. Citations/Expert Quotes (25 pts)
  const citationRegex = /according\s+to|source\s*:|reference|cite|stated\s+by|“|”|blockquote|<cite>/i;
  if (citationRegex.test(content)) {
    geoChecks.hasCitations = true;
    geoScore += 25;
  } else {
    suggestions.push("GEO Optimization: Citing expert sources boosts trust. Add source citations or quotes (e.g., 'according to [source]').");
  }

  // 2. Numerical Evidence/Statistics (25 pts)
  const statsRegex = /\d+%\s*|\b\d{4}\b|\b(million|billion|lakh|crore|percent|fees|rs|usd|inr|₹|\$)\b/i;
  if (statsRegex.test(contentClean) && /\d+/.test(contentClean)) {
    geoChecks.hasStats = true;
    geoScore += 25;
  } else {
    suggestions.push("GEO Optimization: AI search engines favor statistics. Add numerical details, data tables, or percentages (%).");
  }

  // 3. Structured Takeaways/Lists (25 pts)
  const summaryRegex = /key\s+takeaways|takeaway|summary|take-away/i;
  const hasLists = content.includes('<li>') || /^\s*[-*]\s+/m.test(content);
  if ((summaryRegex.test(contentClean) && hasLists) || checks.hasTable) {
    geoChecks.hasSummary = true;
    geoScore += 25;
  } else {
    suggestions.push("GEO Optimization: Generative search prefers summaries. Add a 'Key Takeaways' list or bullet list at the end.");
  }

  // 4. Clear Concept Definitions (25 pts)
  const definitionsRegex = /is\s+defined\s+as|refers\s+to|means\s+that|is\s+the\s+process\s+of|is\s+a\s+type\s+of|defined\s+as|refers\s+as|ka\s+matlab\s+hai|ka\s+arth\s+hai|means\s+is|meaning\s+is/i;
  if (definitionsRegex.test(contentClean)) {
    geoChecks.hasDefinitions = true;
    geoScore += 25;
  } else {
    suggestions.push("GEO Optimization: Clarify concepts for AI. Use defining verbs (e.g., 'refers to', 'is defined as') for main terms.");
  }


  // --- AEO Voice/Answer Engine Optimization Audit (max 100) ---
  const aeoChecks = {
    hasFaq: false,
    hasDirectAnswers: false,
    hasConversationalWords: false,
    hasSchemaFields: false
  };
  let aeoScore = 0;

  // 1. FAQ / Q&A Section (30 pts)
  const faqRegex = /faq|frequently\s+asked|questions?\s*&\s*answers?|q\s*&\s*a/i;
  if (faqRegex.test(contentClean) || content.includes('<details>')) {
    aeoChecks.hasFaq = true;
    aeoScore += 30;
  } else {
    suggestions.push("AEO Voice/AI Search: Create an FAQ section with a heading containing 'FAQ' or 'Frequently Asked Questions'.");
  }

  // 2. Direct Concise Answers (30 pts)
  const questionCount = (contentClean.match(/\?/g) || []).length;
  if (questionCount >= 2) {
    aeoChecks.hasDirectAnswers = true;
    aeoScore += 30;
  } else {
    suggestions.push("AEO Voice/AI Search: Answer queries directly. Write a concise direct paragraph (40-60 words) under question headings.");
  }

  // 3. Conversational trigger question words (20 pts)
  const conversationalRegex = /\b(how\s+to|what\s+is|why\s+does|where\s+can|who\s+is|kab|kaise|kyun|kis|kya)\b|कैसे|कब|क्यों|किस|क्या/i;
  if (conversationalRegex.test(contentClean) || conversationalRegex.test(title)) {
    aeoChecks.hasConversationalWords = true;
    aeoScore += 20;
  } else {
    suggestions.push("AEO Voice/AI Search: Use conversational question words like 'what is', 'how to', or 'why' in headings.");
  }

  // 4. Schema Metadata Fields (20 pts)
  let schemaCount = 0;
  if (post.canonicalUrl) schemaCount++;
  if (seoDescription && seoDescription !== title) schemaCount++;
  if (post.tags && post.tags.length > 0) schemaCount++;
  if (post.excerpt && post.excerpt.length > 50) schemaCount++;
  
  aeoScore += schemaCount * 5; // max 20
  if (schemaCount >= 3) {
    aeoChecks.hasSchemaFields = true;
  } else {
    suggestions.push("AEO Voice/AI Search: Complete all metadata (canonical URL, tags, description) to supply robust Schema tags.");
  }

  const overallVisibilityIndex = Math.round((score + geoScore + aeoScore) / 3);

  return {
    score,
    seoScore: score,
    geoScore,
    aeoScore,
    overallVisibilityIndex,
    wordCount,
    density,
    focusKeyword,
    kd: keywordKD,
    volume: keywordVolume,
    checks,
    geoChecks,
    aeoChecks,
    suggestions,
    rankPrediction
  };
}

module.exports = { calculateSeoScore };
