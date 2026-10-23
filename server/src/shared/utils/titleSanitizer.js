/**
 * SEO & High-CTR Title Sanitization and Deduplication Engine
 * digitalhomeblog.in
 *
 * Removes duplicate words and phrases (e.g., "DGMA DGMA", "UCO Bank UCO Bank",
 * "Recruitment 2026 Recruitment 2026"), cleans competitor mentions, normalizes hyphens,
 * and prevents double-appending recruitment years.
 */

function sanitizeAndDeduplicateTitle(rawTitle = '', options = {}) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';

  let title = rawTitle.trim();

  // 1. Remove duplicate whitespace, competitor mentions, links, brackets, and scrap artifacts
  title = title.replace(/\s+/g, ' ');
  title = title.replace(/[-–—]\s*(?:sarkariresult|freejobalert|sarkariexam)\S*/gi, '');
  title = title.replace(/\s*\(Link:\s*[^\)]*\)/gi, '');
  title = title.replace(/\s*#\|\|:\|\|\s*/g, ' ');

  // 2. Normalize hyphens and dashes (e.g. "--" or multiple dashes to en-dash "–")
  title = title.replace(/--+/g, '–').replace(/\s*–\s*–+\s*/g, ' – ');

  // 3. Iteratively deduplicate consecutive words or multi-word phrases (from 6 words down to 1) case-insensitively
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

  // 4. Specifically deduplicate repeated recruitment/action phrases separated by space
  title = title.replace(/\b(Recruitment\s+(?:202[4-9]|2030))\s+\1\b/gi, '$1');
  title = title.replace(/\b(Online\s+Form)\s+\1\b/gi, '$1');
  title = title.replace(/\b(Apply\s+Online)\s+\1\b/gi, '$1');

  // 5. Clean up duplicate dashes or trailing/leading punctuation
  title = title.replace(/\s*–\s*–+\s*/g, ' – ');
  title = title.replace(/^[\s–—\-:|]+|[\s–—\-:|]+$/g, '').trim();

  // 6. Optional safe recruitment suffix logic (prevent duplicate recruitment/year at end)
  if (options.appendRecruitment) {
    const year = options.year || '2026';
    const hasRecruitment = /\b(Recruitment|Bharti|Apprentice|Vacancy|Vacancies|Exam|Admit Card|Result)\b/i.test(title);
    const hasYear = new RegExp(`\\b(?:202[4-9]|2030)\\b`).test(title);
    if (!hasRecruitment && !hasYear) {
      title = `${title} Recruitment ${year}`;
    } else if (!hasYear) {
      title = `${title} ${year}`;
    }
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
