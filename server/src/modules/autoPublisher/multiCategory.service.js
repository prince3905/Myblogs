const axios = require('axios');
const mongoose = require('mongoose');
const { generateBlogContentCore } = require('../ai/ai.controller');
const { logAutomation } = require('../../shared/utils/automationLogger');

// Fallback high-intent seed topics if RSS feed is unreachable
const CATEGORY_SEEDS = {
  'Tech & Tutorials': [
    'How to Speed Up Windows 11 PC Performance in 2026: Top Settings and Tweaks',
    'Best Free Coding Platforms to Learn Python and JavaScript in 2026',
    'How to Secure Your Android Smartphone from Malware and Data Leaks',
    'Cloud Storage Comparison 2026: Google Drive vs OneDrive vs Mega',
    'Top Productivity Chrome Extensions Every Professional Needs in 2026'
  ],
  'AI & Web Tools': [
    'Top 10 Free AI Tools for Students and Content Creators in 2026',
    'How to Use ChatGPT and Gemini for Fast Research and Study Notes',
    'Best Free AI Image and Graphic Design Generators in 2026',
    'Prompt Engineering Essentials: How to Get 10x Better Results from AI',
    'Top Web Utilities for PDF Editing, Image Compression and File Conversion'
  ],
  'Finance & Business': [
    'How to Start SIP and Mutual Fund Investment in 2026: Complete Beginner Guide',
    'Income Tax Saving Options Under New and Old Tax Regime 2026',
    'Top High Return Post Office Savings Schemes for Indian Families',
    'How to Check and Improve Your CIBIL Credit Score Fast in 2026',
    'Smart Budgeting Rules: 50-30-20 Formula for Financial Freedom'
  ],
  'Health & Wellness': [
    'Best Daily Morning Routine for High Energy, Mental Focus and Wellness',
    'How to Maintain Healthy Eyes and Prevent Digital Eye Strain in 2026',
    'Balanced Indian Diet Chart for Weight Management and Immunity',
    'Simple Daily Yoga Asanas for Relieving Back Pain and Stress',
    'Healthy Sleep Habits: How to Fix Your Sleep Cycle Naturally'
  ],
  'News & Trends': [
    'Digital India 2026: Key Government Tech Initiatives and Citizen Benefits',
    'Renewable Energy & Electric Vehicles in India: Major Trends and Growth',
    'Online Cyber Safety Guidelines: How to Protect Yourself from Digital Frauds',
    'New Education Policy (NEP) Key Highlights and Skill Development Programs',
    'Space Technology & ISRO Upcoming Missions 2026: Key Highlights'
  ]
};

// High-resolution Unsplash curated banners per category
const CATEGORY_FEATURED_IMAGES = {
  'Tech & Tutorials': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  ],
  'AI & Web Tools': [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80'
  ],
  'Finance & Business': [
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
  ],
  'Health & Wellness': [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'
  ],
  'News & Trends': [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80'
  ]
};

// Google News RSS Feeds per category
const RSS_FEED_MAP = {
  'Tech & Tutorials': 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en',
  'AI & Web Tools': 'https://news.google.com/rss/search?q=Artificial+Intelligence+AI+Tools+Web+Tools+India&hl=en-IN&gl=IN&ceid=IN:en',
  'Finance & Business': 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en',
  'Health & Wellness': 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en',
  'News & Trends': 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en'
};

/**
 * Extract fresh topic candidates from Google News RSS feed
 */
async function fetchTrendingTopicsForCategory(category) {
  const feedUrl = RSS_FEED_MAP[category];
  const candidates = [];

  if (feedUrl) {
    try {
      const res = await axios.get(feedUrl, {
        timeout: 7000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (res.data) {
        const itemMatches = res.data.match(/<title>([^<]+)<\/title>/gi);
        if (itemMatches && itemMatches.length > 1) {
          itemMatches.slice(1, 12).forEach(raw => {
            let t = raw.replace(/<\/?title>/gi, '').replace('<![CDATA[', '').replace(']]>', '').trim();
            // Remove news outlet suffix (e.g. - NDTV, - Times of India)
            t = t.split(' - ')[0].trim();
            if (t.length > 15 && !t.toLowerCase().includes('google news')) {
              candidates.push(t);
            }
          });
        }
      }
    } catch (err) {
      console.warn(`[MultiCategory Auto] RSS fetch failed for ${category}: ${err.message}`);
    }
  }

  // Fallback to high-intent seed topics
  const seeds = CATEGORY_SEEDS[category] || CATEGORY_SEEDS['Tech & Tutorials'];
  candidates.push(...seeds);

  // Return unique candidates
  return Array.from(new Set(candidates));
}

/**
 * Intelligent topic classifier (verifies & normalizes category assignment)
 */
function classifyCategory(topic = '', requestedCategory = '') {
  if (requestedCategory && RSS_FEED_MAP[requestedCategory]) {
    return requestedCategory;
  }

  const lower = topic.toLowerCase();
  
  // Health & Wellness
  if (/(health|diet|disease|symptom|doctor|yoga|fitness|ayurveda|mental|sleep|nutrition|workout|exercise|remedy|remedies|weight loss|hospital|pain|wellness|immunity|posture|stretching)/i.test(lower)) {
    return 'Health & Wellness';
  }
  
  // AI & Web Tools
  if (/(chatgpt|gemini|openai|\bai\b|artificial intelligence|midjourney|prompt|deepseek|claude|web tool|online tool|generator|compress|resizer|converter|editor|utility|automation tool|text to image|bot)/i.test(lower)) {
    return 'AI & Web Tools';
  }
  
  // Finance & Business
  if (/(\b(sip|rbi|gst|fd|rd)\b|mutual fund|stock|bank|tax|loan|finance|crypto|cibil|business|investment|rupee|interest|savings|scheme|post office|money|income|market|shares|economy|budget)/i.test(lower)) {
    return 'Finance & Business';
  }
  
  // Tech & Tutorials
  if (/(how to|tutorial|windows|android|python|coding|software|pc|laptop|guide|settings|speed up|ios|iphone|mac|browser|chrome|hardware|tricks|tips|developer|programming|install|transfer)/i.test(lower)) {
    return 'Tech & Tutorials';
  }
  
  return 'News & Trends';
}

/**
 * Check if topic was already published recently (deduplication)
 */
async function isTopicAlreadyPublished(topic, category) {
  const BlogPost = mongoose.model('BlogPost');
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  // Clean topic for regex search
  const cleanKeyword = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
  if (!cleanKeyword || cleanKeyword.length < 5) return false;

  const existing = await BlogPost.findOne({
    category,
    createdAt: { $gte: sixtyDaysAgo },
    $or: [
      { title: new RegExp(cleanKeyword, 'i') },
      { seoTitle: new RegExp(cleanKeyword, 'i') }
    ]
  }).select('_id title slug').lean();

  return Boolean(existing);
}

/**
 * Fetch a 100% topic-relevant high-resolution landscape banner image
 */
async function getCategoryBannerImage(category, topic = '') {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && topic) {
    try {
      // Extract clean search keywords from topic
      const searchKeywords = topic
        .replace(/^(how to|what is|top \d+|best|in \d{4}|guide|tutorial)\s+/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ');

      if (searchKeywords.length >= 3) {
        console.log(`[MultiCategory Image] Searching Pexels for topic keywords: "${searchKeywords}"...`);
        const res = await axios.get('https://api.pexels.com/v1/search', {
          params: { query: searchKeywords, per_page: 5, orientation: 'landscape' },
          headers: { Authorization: pexelsKey },
          timeout: 6000
        });

        const photos = res.data?.photos;
        if (photos && photos.length > 0) {
          const picked = photos[0].src.landscape || photos[0].src.large2x || photos[0].src.large;
          console.log(`[MultiCategory Image] Found topic-matched photo on Pexels: ${picked}`);
          return picked;
        }
      }
    } catch (err) {
      console.warn(`[MultiCategory Image] Pexels search notice for "${topic}": ${err.message}`);
    }
  }

  // Fallback to high-res curated Unsplash photos
  const images = CATEGORY_FEATURED_IMAGES[category] || CATEGORY_FEATURED_IMAGES['Tech & Tutorials'];
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

/**
 * Generate and Publish an Article for a given Category
 */
async function publishMultiCategoryPost(targetCategory, manualTopic = null) {
  const BlogPost = mongoose.model('BlogPost');
  const category = classifyCategory(manualTopic, targetCategory);

  console.log(`[MultiCategory Auto] Starting publication process for category: "${category}"...`);

  // 1. Pick a unique, fresh topic
  let selectedTopic = manualTopic;
  if (!selectedTopic) {
    const topicCandidates = await fetchTrendingTopicsForCategory(category);
    for (const candidate of topicCandidates) {
      const alreadyExists = await isTopicAlreadyPublished(candidate, category);
      if (!alreadyExists) {
        selectedTopic = candidate;
        break;
      }
    }
    // If all candidates already published, pick a randomized seed with 2026 angle
    if (!selectedTopic) {
      const seeds = CATEGORY_SEEDS[category] || CATEGORY_SEEDS['Tech & Tutorials'];
      const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
      selectedTopic = `${randomSeed} (Updated ${new Date().getFullYear()} Guide)`;
    }
  }

  console.log(`[MultiCategory Auto] Generating in-depth content for topic: "${selectedTopic}"...`);

  // 2. Generate 2,000+ words in-depth article using the AI Prompting Architecture
  const generatedData = await generateBlogContentCore({
    title: selectedTopic,
    category: category,
    model: 'gemini-2.5-flash',
    length: 'long',
    language: 'hinglish',
    tone: 'informative'
  });

  if (!generatedData || !generatedData.content || generatedData.content.length < 500) {
    throw new Error(`AI generation failed or returned thin content for topic: ${selectedTopic}`);
  }

  // 3. Ensure slug uniqueness
  let finalSlug = generatedData.slug || selectedTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slugCount = await BlogPost.countDocuments({ slug: finalSlug });
  if (slugCount > 0) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  // 4. Select featured banner image if none provided
  const featuredImage = generatedData.featuredImage || await getCategoryBannerImage(category, selectedTopic);

  // 5. Build and save the BlogPost (triggers Google Indexing + IndexNow automatically via post('save') hook)
  const newPost = new BlogPost({
    title: generatedData.title || selectedTopic,
    slug: finalSlug,
    category: category,
    content: generatedData.content,
    excerpt: generatedData.excerpt || generatedData.seoDescription || selectedTopic,
    seoTitle: generatedData.seoTitle || generatedData.title || selectedTopic,
    seoDescription: generatedData.seoDescription || generatedData.excerpt || selectedTopic,
    seoKeywords: Array.isArray(generatedData.seoKeywords) ? generatedData.seoKeywords : [category, selectedTopic],
    focusKeyword: generatedData.focusKeyword || selectedTopic.split(' ').slice(0, 4).join(' '),
    tags: Array.isArray(generatedData.tags) ? generatedData.tags : [category, 'Guide 2026', 'Tutorial'],
    featuredImage: featuredImage,
    status: 'published',
    publishedAt: new Date(),
    readingTime: generatedData.readingTime || Math.max(3, Math.ceil(generatedData.content.split(' ').length / 200)),
    author: 'Harry Prince'
  });

  await newPost.save();

  console.log(`[MultiCategory Auto] Successfully published post: "${newPost.title}" | URL: /blog/${category}/${newPost.slug}`);

  // 6. Log event to AutomationLog
  await logAutomation({
    service: 'MULTI_CATEGORY_AUTO',
    action: 'POST_PUBLISHED',
    level: 'INFO',
    message: `Auto-published article in "${category}": "${newPost.title}"`,
    metadata: {
      postId: newPost._id,
      title: newPost.title,
      category: newPost.category,
      slug: newPost.slug,
      wordCount: newPost.content.split(' ').length
    }
  });

  return newPost;
}

module.exports = {
  publishMultiCategoryPost,
  fetchTrendingTopicsForCategory,
  classifyCategory,
  isTopicAlreadyPublished,
  getCategoryBannerImage,
  CATEGORY_SEEDS
};
