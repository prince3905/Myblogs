const LiveAlert = require('./liveAlert.model');
const BlogPost = require('../posts/post.model');
const { scrapeFeeds } = require('../ai/topicDiscoveryService'); // Fallback if cron scraping is loaded elsewhere, but we'll import from cron.js
const cronScraper = require('./liveAlert.cron');
const { generateBlogContentCore } = require('../ai/ai.controller');



// Fetch alerts sorted by date descending (without detailsText payload)
async function getAlerts(req, res) {
  try {
    const { status, limit } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const queryLimit = limit ? parseInt(limit, 10) : 500;
    const alerts = await LiveAlert.find(filter)
      .select('-detailsText')
      .sort({ parsedPostDate: -1, createdAt: -1 })
      .limit(queryLimit);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Fetch a single alert by ID (with detailsText payload)
async function getAlertById(req, res) {
  try {
    const { id } = req.params;
    const alert = await LiveAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
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
    const cleanTitle = alert.title
      .replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2') // e.g. "Answer2026" -> "Answer 2026"
      .replace(/\b\w/g, c => c.toUpperCase());
    const generatedTitle = `${alert.boardName} Recruitment Notification Update`;

    // Construct the context/command parameters for Gemini Flash to generate a 1200+ word optimized post
    const resolvedUrl = alert.officialUrl || '';
    const resolvedPdf = alert.officialPdfUrl || '';
    const resolvedApply = alert.officialApplyUrl || '';
    const detailsTextContext = alert.detailsText || '';

    const aiParams = {
      title: cleanTitle,
      model: 'gemini-flash-latest',
      length: 'long', // Target 1800 - 2500 words
      tone: 'informative',
      language: 'hinglish',
      category: 'Sarkari Jobs & Exams',
      command: `Below is the official notification details block containing the EXACT facts, vacancy details, fees, dates, age limits, and eligibility criteria for this job post. You MUST use these exact details to build the post. Do NOT hallucinate, change, or omit seat numbers, districts, fees, age limits, or eligibility criteria. All lists and values from the details block below must be printed exactly same-to-same.

OFFICIAL NOTIFICATION DETAILS:
"""
${detailsTextContext}
"""

FACTUAL METADATA:
- Conducting Board: "${alert.boardName}"
- Last Date to Apply: "${alert.lastDate}"
- Official Website URL: "${resolvedUrl || ''}"
- Official Notification PDF URL: "${resolvedPdf || ''}"
- Official Apply Portal URL: "${resolvedApply || ''}"

CRITICAL DIRECTIVES:
- You must use the mandatory 'Sarkari Jobs & Exams' category framework headings in Hinglish/Hindi, but at least one of these H2 headings MUST contain the exact Focus Keyword/Title phrase "${cleanTitle}" (e.g., "## ${cleanTitle} की महत्वपूर्ण तिथियाँ" or "## ${cleanTitle} योग्यता और पात्रता" or prepend the title to any H2 heading). Do NOT use plain English headings.
- Under EACH H2 heading, you MUST write at least 2 detailed body paragraphs (each 5-6 sentences long) to explain the details in depth and guarantee a long-form article of at least 1,800+ words to pass SEO length checks.
- To present details in a premium, highly readable format for students:
  * Under the "## महत्वपूर्ण तिथियाँ" section, you MUST construct a neat Markdown table containing key dates (e.g., Event Name like Start Date / Last Date vs Date value).
  * Under the "## आवेदन शुल्क" section, you MUST construct a neat Markdown table summarizing category-wise fee details (e.g., Category like Gen/OBC vs Fee amount).
  * Under the "## रिक्तियों का विवरण" or "## योग्यता और पात्रता" section, you MUST construct a neat Markdown table showing: Post Name, Vacancies Count, Age Limit, and Eligibility Criteria.
- The generated 'seoDescription' and 'summary' JSON fields MUST start with the focus keyword/title and be strictly between 110 and 150 characters long.
- You MUST embed at least two journalistic citations (e.g., using "According to the official board details..." or "As stated by the recruitment guidelines...") in the body paragraphs to satisfy trust checks.
- You MUST define the main topic or focus keyword in the first paragraph using a clear defining phrase like "refers to" or "is defined as" or "ka matlab" (e.g., "This recruitment refers to..." or "${cleanTitle} refers to...").
- In the "महत्वपूर्ण लिंक्स" (Important Links) H2 section, you MUST generate direct HTML call-to-action buttons (anchor tags) formatted EXACTLY as follows on separate lines:
  <a href="${resolvedApply || 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' apply online')}" class="btn-link-action btn-apply" target="_blank" rel="noopener noreferrer">Apply Online (यहाँ क्लिक करें)</a>
  <a href="${resolvedPdf || 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' recruitment notification pdf')}" class="btn-link-action btn-notification" target="_blank" rel="noopener noreferrer">Download Official Notification (देखें अभी)</a>
  <a href="${resolvedUrl || 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' official website')}" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer">Official Website (विजिट करें)</a>
  Do NOT use standard markdown bullet format (* or -) for these buttons; output the raw HTML anchor tags directly on new lines so they display as premium, gorgeous buttons!
- The FAQ section heading MUST be exactly "## अक्सर पूछे जाने वाले सवाल (FAQ)" so it is detected correctly.
- Under the FAQ section, provide exactly 3 questions formatted as H3. Each question must be in Hinglish using Latin query words like "Kaise", "Kab", "Kya", "How", or "What" (e.g., "### Question: UPTGT 2026 Apply Kaise Karein?"). Each answer must be immediately below it and strictly under 45 words.`
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

    // Remove any existing draft with the same slug to prevent unique slug index violations
    await BlogPost.deleteMany({ slug: generatedData.slug });

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

module.exports = { getAlerts, getAlertById, triggerScrape, draftPostFromAlert };
