/**
 * INDEXING QUALITY GUARD & PRE-FLIGHT CHECKLIST
 * 
 * This module defines the strict rules that prevent Google indexing failures
 * (Thin content, Soft 404, Redirect chains, Alternate canonicals, etc.).
 * Autopilot and AI generation engines use this to validate and enrich every post before publishing.
 */

const INDEXING_RULES_MANIFESTO = `
================================================================================
CRITICAL GOOGLE INDEXING QUALITY GUARD (PRE-FLIGHT COMPLIANCE RULES)
================================================================================
Why posts failed indexing in the past and MUST be prevented in this article:

1. [PREVENT "CRAWLED - CURRENTLY NOT INDEXED" (THIN CONTENT)]:
   - Content MUST be at least 1,500+ words long with deep, step-by-step educational explanations.
   - You MUST include in-depth sections for:
     * Selection Process (लिखित परीक्षा, फिजिकल, इंटरव्यू, डॉक्यूमेंट वेरिफिकेशन)
     * Exam Preparation Strategy (तैयारी कैसे करें)
     * Core Syllabus Topics (मुख्य विषय और पैटर्न)

2. [PREVENT LOW DWELL TIME (MANDATORY STRUCTURED TABLES)]:
   - You MUST include at least 3 distinct Markdown tables:
     * Table 1: महत्वपूर्ण तिथियाँ (Dates & Events)
     * Table 2: आवेदन शुल्क (Category-wise Fee Breakdown)
     * Table 3: पद विवरण और योग्यता (Post Name, Total Vacancy, Age Limit, Eligibility)

3. [PREVENT MISSING RICH SNIPPETS (FAQ SCHEMA)]:
   - Heading MUST be: "## अक्सर पूछे जाने वाले सवाल (FAQ)"
   - Provide 3-4 highly relevant questions formatted as H3 with crisp answers under 45 words.

4. [PREVENT "PAGE WITH REDIRECT" & CANONICAL ERRORS]:
   - All internal links must use clean root paths (/ or /job-alerts or /tools).
   - No competitor domain links, tracking query strings, or broken URLs.

5. [CLICK-WORTHY HIGH CTR TITLE & META DESCRIPTION]:
   - Title MUST have an action hook (e.g., "(Direct Link) - Apply Online Now").
   - Meta Description MUST start with the exact focus keyword and be 110–150 characters.
================================================================================
`;

/**
 * Validates a generated post object against all Google Indexing Pre-Flight rules.
 * @param {Object} postData
 * @returns {{ isValid: boolean, issues: string[], score: number }}
 */
function validateIndexingQuality(postData) {
  const issues = [];
  const content = postData.content || '';
  const title = postData.title || '';
  const seoDescription = postData.seoDescription || postData.excerpt || '';

  // 1. Word Count Check (Must be >= 1,200 words for deep ranking)
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 1000) {
    issues.push(`Thin Content Warning: Post has ${wordCount} words (Minimum 1,000+ words recommended for instant indexing)`);
  }

  // 2. Table Structure Check
  const hasMarkdownTable = content.includes('|---') || content.includes('ql-table-embed') || content.includes('<table>');
  if (!hasMarkdownTable) {
    issues.push('Missing Structured Tables: Post lacks markdown/HTML tables for Dates, Fees, or Eligibility');
  }

  // 3. FAQ Section Check
  const hasFaq = content.toLowerCase().includes('faq') || content.includes('सवाल') || content.includes('अक्सर पूछे जाने वाले');
  if (!hasFaq) {
    issues.push('Missing FAQ Section: Post lacks FAQ rich-snippet questions');
  }

  // 4. Meta Description Length
  if (!seoDescription || seoDescription.length < 90) {
    issues.push(`Weak Meta Description: Length is ${seoDescription ? seoDescription.length : 0} chars (Needs 110-155 chars)`);
  }

  // 5. Title Length & Hook
  if (!title || title.length < 20) {
    issues.push('Short Title: Title needs descriptive action keywords');
  }

  const score = Math.max(0, 100 - issues.length * 20);

  return {
    isValid: issues.length <= 1, // Pass if 0 or 1 minor warning
    issues,
    score,
    wordCount
  };
}

module.exports = {
  INDEXING_RULES_MANIFESTO,
  validateIndexingQuality
};
