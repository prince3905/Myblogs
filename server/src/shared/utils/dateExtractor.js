/**
 * Enhanced Date Extractor for Job Alerts
 */

const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

function extractDateFromSlugOrText(href = '', text = '', bodyText = '') {
  // 1. Try extracting from detail page text (e.g. "Post Date / Update : 08 June 2026 | 02:45 PM")
  if (bodyText) {
    const postDateMatch = bodyText.match(/Post Date\s*\/?\s*Update\s*:\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*\/?\s*Update\s*:\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*:\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*:\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i);
    if (postDateMatch) {
      const rawDateStr = postDateMatch[1].trim();
      const parsed = parseFlexibleDate(rawDateStr);
      if (parsed) {
        return { postDate: rawDateStr, parsedDate: parsed };
      }
    }
  }

  // 2. Try extracting from URL slug (e.g. "/2026/hppsc-hpas-june26/" or "/2026/rpsc-apo-aug26/")
  if (href) {
    const slugMatch = href.match(/(jan|feb|mar|apr|may|jun|june|jul|july|aug|sep|oct|nov|dec)(\d{2,4})/i);
    if (slugMatch) {
      const monthStr = slugMatch[1].toLowerCase();
      let yearNum = parseInt(slugMatch[2], 10);
      if (yearNum < 100) yearNum += 2000; // e.g. 26 -> 2026
      const monthIndex = MONTH_MAP[monthStr];
      if (monthIndex !== undefined) {
        const d = new Date(yearNum, monthIndex, 15);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { postDate: `${monthNames[monthIndex]} ${yearNum}`, parsedDate: d };
      }
    }
  }

  // 3. Try extracting year from title (e.g. "HPPSC HPAS 2026")
  const yearMatch = text.match(/\b(2025|2026|2027)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const d = new Date(year, 7, 1); // August of that year
    return { postDate: `${year}`, parsedDate: d };
  }

  return { postDate: 'Latest Update', parsedDate: new Date() };
}

function parseFlexibleDate(str) {
  if (!str) return null;
  // Match "08 June 2026" or "8 Aug 2026"
  const wordMatch = str.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    const monthStr = wordMatch[2].toLowerCase();
    const year = parseInt(wordMatch[3], 10);
    const monthIndex = MONTH_MAP[monthStr];
    if (monthIndex !== undefined) {
      return new Date(year, monthIndex, day);
    }
  }
  // Match "28/08/2026" or "28-08-2026"
  const numMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const month = parseInt(numMatch[2], 10) - 1;
    const year = parseInt(numMatch[3], 10);
    return new Date(year, month, day);
  }
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
}

module.exports = {
  extractDateFromSlugOrText,
  parseFlexibleDate
};
