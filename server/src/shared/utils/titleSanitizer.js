/**
 * SEO & High-CTR Title Sanitization and Deduplication Engine
 * digitalhomeblog.in
 *
 * Removes duplicate words and phrases (e.g., "DGMA DGMA", "UCO Bank UCO Bank",
 * "Recruitment 2026 Recruitment 2026"), cleans competitor mentions, normalizes hyphens,
 * unglues concatenated text (e.g., "PostsAmrita"), and caps length for optimal SERP visibility.
 */

function sanitizeAndDeduplicateTitle(rawTitle = '', options = {}) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';

  let title = rawTitle.trim();

  // 1. Remove unwanted repetitive prefixes (e.g., "Sarkari Job: ", "Sarkari Result 2026:")
  title = title.replace(/^(?:sarkari\s+(?:job|result)\s*(?:202[4-9]|2030)?\s*:\s*)+/gi, '');

  // 2. Unglue concatenated words caused by DOM scraping without spaces (e.g. "PostsAmrita", "VacancyKKHSOU")
  title = title.replace(/\b(Posts?|Vacanc(?:y|ies)|Forms?|Dates?|Direct\s+Link)([A-Z])/g, '$1 $2');
  title = title.replace(/([a-z0-9])([A-Z][a-z]{2,})/g, '$1 $2');

  // 3. Remove duplicate whitespace, competitor mentions, links, brackets, and scrap artifacts
  title = title.replace(/\s+/g, ' ');
  title = title.replace(/[-–—]\s*(?:sarkariresult|freejobalert|sarkariexam)\S*/gi, '');
  title = title.replace(/\s*\(Link:\s*[^\)]*\)/gi, '');
  title = title.replace(/\s*#\|\|:\|\|\s*/g, ' ');

  // 4. Normalize hyphens and dashes (e.g. "--" or multiple dashes to en-dash "–")
  title = title.replace(/--+/g, '–').replace(/\s*–\s*–+\s*/g, ' – ');

  // 5. Detect and remove massive duplicated clauses (e.g., "Board Vacancy 2026 - Posts Board Vacancy 2026")
  if (title.includes(' - ')) {
    const parts = title.split(' - ').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const seg1 = parts[0];
      let seg2 = parts[1];
      const board = seg1.split(/\b(?:Vacancy|Recruitment|Bharti|Posts?)\b/i)[0].trim();
      if (board.length >= 3) {
        const escapedBoard = board.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        seg2 = seg2.replace(new RegExp(`\\s*(?:Posts?|Vacanc(?:y|ies))?\\s*${escapedBoard}\\b.*$`, 'i'), '').trim();
      }
      title = seg2 ? `${seg1} - ${seg2}` : seg1;
    }
  }

  // 6. Iteratively deduplicate consecutive words or multi-word phrases (from 6 words down to 1) case-insensitively
  let prev;
  let iterations = 0;
  do {
    prev = title;
    for (let len = 6; len >= 1; len--) {
      const pattern = new RegExp(`\\b(${Array(len).fill('[\\w&]+').join('\\s+')})\\s+\\1\\b`, 'gi');
      title = title.replace(pattern, '$1');
    }
    iterations++;
  } while (prev !== title && iterations < 5);

  // 7. Specifically deduplicate repeated recruitment/action phrases separated by space or punctuation
  title = title.replace(/\b(posts?)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Recruitment\s+(?:202[4-9]|2030))\s+\1\b/gi, '$1');
  title = title.replace(/\b(Online\s+Form)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Apply\s+Online)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Admit\s+Card)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Result)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Vacancy|Vacancies)\s+(?:202[4-9]|2030)\s+(?:Vacancy|Vacancies)\b/gi, 'Vacancy');

  // 8. Clean up duplicate dashes or trailing/leading punctuation
  title = title.replace(/\s*–\s*–+\s*/g, ' – ');
  title = title.replace(/^[\s–—\-:|]+|[\s–—\-:|]+$/g, '').trim();

  // 9. Optional safe recruitment suffix logic (prevent duplicate recruitment/year at end)
  if (options.appendRecruitment) {
    const year = options.year || '2026';
    const hasAction = /\b(Recruitment|Bharti|Apprentice|Vacancy|Vacancies|Exam|Admit Card|Result|Admission|Answer Key|Syllabus)\b/i.test(title);
    const hasYear = new RegExp(`\\b(?:202[4-9]|2030)\\b`).test(title);
    if (!hasAction && !hasYear) {
      title = `${title} Recruitment ${year}`;
    } else if (!hasYear) {
      title = `${title} ${year}`;
    }
  }

  // 10. Max length constraint: Keep titles clean and optimal for Google SERP display
  if (options.maxLen && title.length > options.maxLen) {
    const words = title.split(/\s+/);
    let fitted = '';
    for (const w of words) {
      if ((fitted + ' ' + w).length > options.maxLen) break;
      fitted = fitted ? `${fitted} ${w}` : w;
    }
    title = fitted || title.slice(0, options.maxLen);
    // Clean unclosed parenthesis and trailing dangling hyphens/words
    title = title.replace(/\s*\([^\)]*$/g, '');
    title = title.replace(/\s+(?:Posts?|Vacanc(?:y|ies))\s+[A-Za-z0-9]+$/i, '');
    title = title.replace(/^[\s–—\-:|]+|[\s–—\-:|]+$/g, '').trim();
  }

  return title.replace(/\s+/g, ' ').trim();
}

/**
 * Backward-compatible alias for existing callers
 */
function sanitizeTitleForSeo(rawTitle = '') {
  return sanitizeAndDeduplicateTitle(rawTitle);
}

module.exports = {
  sanitizeAndDeduplicateTitle,
  sanitizeTitleForSeo
};
