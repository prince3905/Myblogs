/**
 * Enhanced Date Extractor for Job Alerts
 * Prevents future-date anomalies and ensures proper chronological order.
 */

const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

function extractDateFromSlugOrText(href = '', text = '', bodyText = '', category = '') {
  const now = new Date();
  const lowerContext = `${text} ${href} ${category}`.toLowerCase();
  const isNoticeUpdate = /\b(result|admit card|score card|hall ticket|merit list|exam date|answer key|key|syllabus|admission|counseling|counselling|city)\b/i.test(lowerContext);

  // 1. Try extracting from detail page text
  if (bodyText) {
    // 1a. Category-specific event dates from table (e.g. "Answer key Available : 22/09/2026", "Result Available : 24/09/2026")
    if (/answer\s*key|key/i.test(lowerContext)) {
      const m = bodyText.match(/Answer\s*Key\s*(?:Available|Release|Notice)?\s*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i) ||
                bodyText.match(/Answer\s*Key\s*(?:Available|Release|Notice)?\s*:?\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
      if (m) {
        const parsed = parseFlexibleDate(m[1].trim());
        if (parsed) {
          return { postDate: m[1].trim(), parsedDate: parsed > now ? now : parsed };
        }
      }
    }

    if (/result|score\s*card|merit/i.test(lowerContext)) {
      const m = bodyText.match(/(?:Result|Score\s*Card|Merit\s*List)\s*(?:Available|Declared|Notice)?\s*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i) ||
                bodyText.match(/(?:Result|Score\s*Card|Merit\s*List)\s*(?:Available|Declared|Notice)?\s*:?\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
      if (m) {
        const parsed = parseFlexibleDate(m[1].trim());
        if (parsed) {
          return { postDate: m[1].trim(), parsedDate: parsed > now ? now : parsed };
        }
      }
    }

    if (/admit\s*card|hall\s*ticket|call\s*letter|exam\s*city/i.test(lowerContext)) {
      const m = bodyText.match(/(?:Admit\s*Card|Exam\s*City|Hall\s*Ticket)\s*(?:Available|Download|Notice)?\s*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i) ||
                bodyText.match(/(?:Admit\s*Card|Exam\s*City|Hall\s*Ticket)\s*(?:Available|Download|Notice)?\s*:?\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
      if (m) {
        const parsed = parseFlexibleDate(m[1].trim());
        if (parsed) {
          return { postDate: m[1].trim(), parsedDate: parsed > now ? now : parsed };
        }
      }
    }

    // 1b. Post Date / Update regex (e.g. "Post Date / Update : 22 September 2026 | 04:56 PM")
    const postDateMatch = bodyText.match(/Post Date\s*\/?\s*Update\s*:?\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*\/?\s*Update\s*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*:?\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i) ||
                          bodyText.match(/Post Date\s*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/i);
    if (postDateMatch) {
      const rawDateStr = postDateMatch[1].trim();
      const parsed = parseFlexibleDate(rawDateStr);
      if (parsed) {
        const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
        // If an active update notice (Answer Key, Result, Admit Card) has an old base post date (> 14 days old),
        // it means the page template is from months ago but was updated recently. Assign current date so it stays fresh!
        if (isNoticeUpdate && diffDays > 14) {
          return { postDate: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), parsedDate: now };
        }
        return { postDate: rawDateStr, parsedDate: parsed > now ? now : parsed };
      }
    }
  }

  // 2. Try extracting from URL slug (e.g. "/2026/up-suda-mis-assistant-sept26/")
  if (href) {
    const slugMatch = href.match(/(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[-_]?(\d{2,4})/i);
    if (slugMatch) {
      const monthStr = slugMatch[1].toLowerCase();
      let yearNum = parseInt(slugMatch[2], 10);
      if (yearNum < 100) yearNum += 2000; // e.g. 26 -> 2026
      const monthIndex = MONTH_MAP[monthStr];
      if (monthIndex !== undefined) {
        let d;
        // If current month & year or if it is an active notice announcement, use current date
        if (isNoticeUpdate || (yearNum === now.getFullYear() && monthIndex === now.getMonth())) {
          d = new Date();
        } else {
          d = new Date(yearNum, monthIndex, 1);
        }
        if (d > now) d = now;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { postDate: `${monthNames[monthIndex]} ${yearNum}`, parsedDate: d };
      }
    }
  }

  // 3. Try extracting year from title (e.g. "HPPSC HPAS 2026")
  const yearMatch = text.match(/\b(2025|2026|2027)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    let d = new Date(year, 0, 1);
    if (d > now) d = now;
    return { postDate: `${year}`, parsedDate: d };
  }

  return { postDate: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), parsedDate: now };
}

function parseFlexibleDate(str) {
  if (!str) return null;
  const now = new Date();
  // Match "08 June 2026" or "8 Aug 2026"
  const wordMatch = str.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    const monthStr = wordMatch[2].toLowerCase();
    const year = parseInt(wordMatch[3], 10);
    const monthIndex = MONTH_MAP[monthStr];
    if (monthIndex !== undefined) {
      const d = new Date(year, monthIndex, day);
      return d > now ? now : d;
    }
  }
  // Match "28/08/2026" or "28-08-2026"
  const numMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const month = parseInt(numMatch[2], 10) - 1;
    const year = parseInt(numMatch[3], 10);
    const d = new Date(year, month, day);
    return d > now ? now : d;
  }
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback > now ? now : fallback;
  return null;
}

module.exports = {
  extractDateFromSlugOrText,
  parseFlexibleDate
};
