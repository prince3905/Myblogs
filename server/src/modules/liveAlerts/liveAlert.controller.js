const LiveAlert = require('./liveAlert.model');
const BlogPost = require('../posts/post.model');
const { scrapeFeeds } = require('../ai/topicDiscoveryService'); // Fallback if cron scraping is loaded elsewhere, but we'll import from cron.js
const cronScraper = require('./liveAlert.cron');
const { generateBlogContentCore } = require('../ai/ai.controller');

// Fetch alerts sorted by date descending
async function getAlerts(req, res) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const alerts = await LiveAlert.find(filter).sort({ parsedPostDate: -1, createdAt: -1 }).limit(500);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Manually trigger the scraper
async function triggerScrape(req, res) {
  try {
    const totalSaved = await cronScraper.scrapeFeeds();
    res.json({ success: true, message: `Manual sync complete! Scraped and saved ${totalSaved} alerts.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Create a draft post from alert metadata
async function draftPostFromAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await LiveAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Note: We allow re-drafting the same alert if the user wants to regenerate or recreate it.

    console.log(`[LiveAlert Sourcing] Drafting blog post from alert: "${alert.title}"`);

    // Dynamic professional title for the blog post
    const cleanTitle = alert.title.replace(/\b\w/g, c => c.toUpperCase());
    const generatedTitle = `${alert.boardName} Recruitment Notification Update`;

    // Construct the context/command parameters for Gemini Flash to generate a 1200+ word optimized post
    const resolvedUrl = alert.officialUrl || '';
    const resolvedPdf = alert.officialPdfUrl || '';
    const resolvedApply = alert.officialApplyUrl || '';
    const detailsTextContext = alert.detailsText || '';

    const aiParams = {
      title: cleanTitle,
      model: 'gemini-pro-latest',
      length: 'medium', // Target 1,200 - 1,500 words
      tone: 'professional',
      language: 'hinglish',
      category: 'Sarkari Jobs & Exams',
      command: `Write a comprehensive, professional Sarkari Result exam notification article about: "${alert.title}".
      
      Here are the EXACT facts, vacancy details, fees, dates, age limits, and eligibility criteria for this job:
      """
      ${detailsTextContext}
      """

      Guidelines for the post:
      - Conducting Board: "${alert.boardName}"
      - Last Date to Apply: "${alert.lastDate}"
      - Official Website: "${resolvedUrl || 'To be dynamically resolved by you'}"
      - Official Notification PDF: "${resolvedPdf || ''}"
      - Official Apply Portal: "${resolvedApply || ''}"
      - CRITICAL DATA INTEGRITY REQUIREMENT (SAME-TO-SAME DATA):
        - You MUST write the blog post using these EXACT facts. Do NOT hallucinate, change, or omit seat numbers, districts, fees, age limits, or eligibility criteria. All lists and values from the details block above must be printed exactly same to same.
        - You MUST include the vacancy tables, district tables, important dates, and application fees as clear tables or bullet lists.
        - Render all tables using clean HTML tables (using <table>, <thead>, <tbody>, <tr>, <th>, <td> tags) or Markdown pipe-separated tables. Ensure no columns or rows are omitted.
        - Render eligibility rules and dates using clean HTML <ul> and <li> list tags.
      - Translate the information into a premium, engaging Hinglish blog post for students.
      - Ensure you follow the Sarkari Jobs & Exams category framework headings and rules.
      - Add sections for Eligibility, Vacancy details, Application Fee, Age limits, and Selection Process based on the details provided.
      - Make sure the post strictly complies with GOOGLE SEO, GEO, and AEO rules.
      - CRITICAL REQUIREMENT FOR LINKS (MUST BE 100% USEFUL FOR STUDENTS):
        - You must check the details block above for URLs formatted as '(Link: URL)' (such as for Apply Online, Download Notification, Official Website, Syllabus, etc.). You MUST use these exact URLs for links in your article.
        - For example, if you see 'Apply Online | Click Here (Link: https://...)', use that exact URL for the Apply portal link.
        - If 'Official Website', 'Official Notification PDF', or 'Official Apply Portal' are provided above or in the details block, you MUST use those exact URLs.
        - If they are not provided, dynamically resolve the correct official government domains for "${alert.boardName}" (e.g. upsc.gov.in for UPSC, ssc.gov.in for SSC, etc.).
        - Create a distinct, highlightable "Important Links" section or table at the end of the post, containing:
          1. "Official Notification PDF" pointing to the PDF link provided.
          2. "Direct Link to Apply Online" pointing to the apply link provided.
          3. "Official Board Website" pointing to the board homepage.
          4. Any other links found in the details block (like Download Syllabus, Answer Key, etc.) pointing to their respective links.
        - Ensure all links in the article point ONLY to direct government websites, official notifications, or application portals.
        - DO NOT use "freejobalert.com", "sarkariresult.info", or any other third-party blog or tool URL in the generated content.
        - STRICTLY BANNED: Do not include or link to third-party tools (such as photo resizers, image compressors, pdf converters/mergers, or age calculators) on other sites.
        - PROMOTION RULE: If students need to resize photos, crop signatures, calculate their age, or compress PDFs to fill the application form, explicitly recommend they use our own free Student Utility Tools page by referencing the path "/tools" directly (e.g., "Photo resizer aur signature crop karne ke liye aap hamare website par /tools link par jaa sakte hain").`
    };

    // Trigger backend AI post generator
    const generatedData = await generateBlogContentCore(aiParams);

    // Create and save Mongoose BlogPost document
    const newPost = new BlogPost({
      title: generatedData.title,
      slug: generatedData.slug,
      excerpt: generatedData.summary.slice(0, 320),
      content: generatedData.content,
      featuredImage: '', // Will fetch image or fallback in editor
      category: 'Sarkari Jobs & Exams',
      tags: generatedData.keywords || [],
      status: 'draft',
      seoTitle: generatedData.seoTitle,
      seoDescription: generatedData.seoDescription,
      seoKeywords: generatedData.keywords || [],
      canonicalUrl: generatedData.permalink,
      author: 'Harry Prince'
    });

    await newPost.save();

    // Mark the alert as drafted
    alert.status = 'drafted';
    await alert.save();

    res.json({
      success: true,
      message: 'Draft post successfully created in background!',
      postId: newPost._id
    });
  } catch (err) {
    console.error('[LiveAlert Sourcing] Drafting failed:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to auto-write post' });
  }
}

module.exports = { getAlerts, triggerScrape, draftPostFromAlert };
