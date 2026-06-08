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
    const alerts = await LiveAlert.find(filter).sort({ createdAt: -1 }).limit(100);
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

    if (alert.status === 'drafted') {
      return res.status(400).json({ success: false, message: 'This alert is already drafted' });
    }

    console.log(`[LiveAlert Sourcing] Drafting blog post from alert: "${alert.title}"`);

    // Dynamic professional title for the blog post
    const cleanTitle = alert.title.replace(/\b\w/g, c => c.toUpperCase());
    const generatedTitle = `${alert.boardName} Recruitment Notification Update`;

    // Construct the context/command parameters for Gemini Flash to generate a 1200+ word optimized post
    const aiParams = {
      title: cleanTitle,
      model: 'gemini-flash-latest',
      length: 'medium', // Target 1,200 - 1,500 words
      tone: 'professional',
      language: 'hinglish',
      category: 'Sarkari Jobs & Exams',
      command: `Write a comprehensive, professional Sarkari Result exam notification article about: "${alert.title}".
      - Official Board: "${alert.boardName}"
      - Last Date to Apply: "${alert.lastDate}"
      - Exact Official Apply Link: "${alert.sourceUrl}"
      - Ensure you follow the Sarkari Jobs & Exams category framework headings and rules.
      - Add details of eligibility, vacancies, step-by-step process, selection process, and dates.
      - Make sure the post strictly complies with GOOGLE SEO, GEO, and AEO rules.
      - Embed the official link "${alert.sourceUrl}" inside the body naturally as the official portal url.`
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
