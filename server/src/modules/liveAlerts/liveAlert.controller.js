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

// Helper to extract links from scraped text
function extractLinksFromText(text) {
  const parsedLinks = [];
  if (!text) return parsedLinks;
  const lines = text.split('\n');
  const linkRegex = /\((?:Link|link):\s*([^)]+)\)/i;
  
  for (const line of lines) {
    const match = linkRegex.exec(line);
    if (match) {
      const url = match[1].trim();
      let label = line.split(/\((?:Link|link):/i)[0].replace(/^[-*\s]+/, '').trim();
      if (label.endsWith(':')) {
        label = label.slice(0, -1).trim();
      }
      if (url && label) {
        parsedLinks.push({ name: label, url });
      }
    }
  }
  return parsedLinks;
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

    // Extract all links programmatically from scraped factsheet details
    const detailsLinks = extractLinksFromText(detailsTextContext);

    // Build unique URL map
    const allLinksMap = new Map();

    // Prioritize explicitly stored URL fields
    if (resolvedApply) allLinksMap.set('apply online', resolvedApply);
    if (resolvedPdf) allLinksMap.set('download notification', resolvedPdf);
    if (resolvedUrl) allLinksMap.set('official website', resolvedUrl);

    // Merge in any other parsed links from the text details
    detailsLinks.forEach(link => {
      const nameLower = link.name.toLowerCase();
      if (nameLower.includes('apply')) {
        allLinksMap.set('apply online', link.url);
      } else if (nameLower.includes('notification') || nameLower.includes('pdf') || nameLower.includes('advertisement') || nameLower.includes('notice')) {
        // Skip utility tools links so they don't overwrite download notification link
        if (link.url !== '/tools' && !nameLower.includes('utility tools') && !nameLower.includes('resizer')) {
          allLinksMap.set('download notification', link.url);
        } else {
          allLinksMap.set('student utility tools', '/tools');
        }
      } else if (nameLower.includes('website') || nameLower.includes('homepage') || nameLower.includes('official site')) {
        allLinksMap.set('official website', link.url);
      } else {
        // Any other unique link (e.g. Syllabus, Answer Key, Result, Exam City, etc.)
        allLinksMap.set(link.name, link.url);
      }
    });

    // Create the final beautiful HTML buttons block
    const buttonHtmls = [];
    allLinksMap.forEach((url, name) => {
      let btnClass = 'btn-apply';
      let label = name;
      const lower = name.toLowerCase();

      if (lower.includes('apply')) {
        btnClass = 'btn-apply';
        label = `Apply Online (यहाँ क्लिक करें)`;
      } else if (lower.includes('notification') || lower.includes('pdf') || lower.includes('advertisement') || lower.includes('notice')) {
        btnClass = 'btn-notification';
        label = `Download Official Notification (देखें अभी)`;
      } else if (lower.includes('website') || lower.includes('homepage') || lower.includes('official site')) {
        btnClass = 'btn-website';
        label = `Official Website (विजिट करें)`;
      } else if (lower.includes('syllabus')) {
        btnClass = 'btn-notification';
        label = `Download Syllabus (पाठ्यक्रम डाउनलोड करें)`;
      } else if (lower.includes('tools')) {
        btnClass = 'btn-website';
        label = `Photo & Sign Resizer Tools (यहाँ क्लिक करें)`;
      } else {
        btnClass = 'btn-website';
        label = `${name} (यहाँ देखें)`;
      }
      buttonHtmls.push(`<a href="${url}" class="btn-link-action ${btnClass}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    });

    // Enforce default fallback search buttons if the main 3 fields were not in details
    if (!allLinksMap.has('apply online')) {
      const fallbackUrl = 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' apply online');
      buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-apply" target="_blank" rel="noopener noreferrer">Apply Online (यहाँ क्लिक करें)</a>`);
    }
    if (!allLinksMap.has('download notification')) {
      const fallbackUrl = 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' recruitment notification pdf');
      buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-notification" target="_blank" rel="noopener noreferrer">Download Official Notification (देखें अभी)</a>`);
    }
    if (!allLinksMap.has('official website')) {
      const fallbackUrl = 'https://www.google.com/search?q=' + encodeURIComponent(alert.boardName + ' official website');
      buttonHtmls.push(`<a href="${fallbackUrl}" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer">Official Website (विजिट करें)</a>`);
    }

    const buttonHtmlBlock = buttonHtmls.join('\n');

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
- In the "महत्वपूर्ण लिंक्स" (Important Links) H2 section, you MUST output the following EXACT HTML block containing the Call-to-Action buttons. Do NOT modify, translate, rewrite, or omit any part of this HTML block. Output it exactly same-to-same on separate lines:
${buttonHtmlBlock}
- You MUST naturally link to other pages of our portal inside the post content body paragraphs (e.g. using anchor text like "Digital Home Blog", "Sarkari Result", "latest government jobs" pointing to root URL "/").
- The FAQ section heading MUST be exactly "## अक्सर पूछे जाने वाले सवाल (FAQ)" so it is detected correctly.
- Under the FAQ section, provide exactly 3 questions formatted as H3. Each question must be in Hinglish using Latin query words like "Kaise", "Kab", "Kya", "How", or "What" (e.g., "### Question: UPTGT 2026 Apply Kaise Karein?"). Each answer must be immediately below it and strictly under 45 words.`
    };

    // Trigger backend AI post generator
    const generatedData = await generateBlogContentCore(aiParams);

    let finalContent = generatedData.content || '';

    // Standardize & inject important links section programmatically
    const linksHeaderRegex = /<h[23]>(?:महत्वपूर्ण लिंक्स|Important Links)<\/h[23]>/i;
    const hasLinksSection = linksHeaderRegex.test(finalContent);
    const standardLinksBlock = `\n<h2>महत्वपूर्ण लिंक्स</h2>\n${buttonHtmlBlock}\n`;

    if (hasLinksSection) {
      // Replace the existing links section to ensure standard verified buttons are used
      const match = finalContent.match(linksHeaderRegex);
      const startIndex = match.index;
      
      const nextHeadingRegex = /<h[23]>/gi;
      nextHeadingRegex.lastIndex = startIndex + match[0].length;
      const nextHeadingMatch = nextHeadingRegex.exec(finalContent);
      
      if (nextHeadingMatch) {
        finalContent = finalContent.slice(0, startIndex) + standardLinksBlock + finalContent.slice(nextHeadingMatch.index);
      } else {
        finalContent = finalContent.slice(0, startIndex) + standardLinksBlock;
      }
    } else {
      // Inject before FAQ section
      const faqHeaderRegex = /<h[23]>(?:अक्सर पूछे जाने वाले सवाल \(FAQ\)|Frequently Asked Questions)<\/h[23]>/i;
      const faqMatch = finalContent.match(faqHeaderRegex);
      
      if (faqMatch) {
        finalContent = finalContent.slice(0, faqMatch.index) + standardLinksBlock + '\n' + finalContent.slice(faqMatch.index);
      } else {
        // Inject before Key Takeaways
        const takeawaysRegex = /<h[23]>(?:Key Takeaways|महत्वपूर्ण निष्कर्ष)<\/h[23]>/i;
        const takeawaysMatch = finalContent.match(takeawaysRegex);
        if (takeawaysMatch) {
          finalContent = finalContent.slice(0, takeawaysMatch.index) + standardLinksBlock + '\n' + finalContent.slice(takeawaysMatch.index);
        } else {
          // Inject before brand block
          const brandIndex = finalContent.indexOf("<div class='brand-authority-block'");
          if (brandIndex !== -1) {
            finalContent = finalContent.slice(0, brandIndex) + standardLinksBlock + '\n' + finalContent.slice(brandIndex);
          } else {
            finalContent += '\n' + standardLinksBlock;
          }
        }
      }
    }

    // Create and save Mongoose BlogPost document
    const newPost = new BlogPost({
      title: generatedData.title,
      slug: generatedData.slug,
      excerpt: generatedData.summary.slice(0, 320),
      content: finalContent,
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
