const axios = require('axios');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { generateBlogContentCore, generateImagePrompt } = require('../ai/ai.controller');
const { logAutomation } = require('../../shared/utils/automationLogger');

cloudinary.config({
  cloud_name: 'drkm1wo9o',
  api_key: '479412262566892',
  api_secret: '_J0pP4VbLy-TL5vAVoRpaFjJFxg',
});

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

// High-resolution curated 4K photography per subtopic & category
const CATEGORY_FEATURED_IMAGES = {
  'Tech & Tutorials': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=675&q=85', // Chip / Tech
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=675&q=85', // Code Matrix
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&h=675&q=85', // Modern Developer Desk
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&h=675&q=85', // Hardware / Retro Tech
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=675&q=85', // Laptop Coding
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&h=675&q=85', // Futuristic Laptop
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&h=675&q=85'  // Tech Team / Collaboration
  ],
  'AI & Web Tools': [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&h=675&q=85', // AI Neural Head
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=675&q=85', // Abstract AI Wave
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=675&q=85', // AI Face Neon
    'https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1200&h=675&q=85', // AI Glowing Data
    'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&h=675&q=85', // Futuristic Digital Space
    'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&h=675&q=85'  // Robot / AI Assistant
  ],
  'Finance & Business': [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&h=675&q=85', // Stock Candlestick Chart
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=675&q=85', // Stock Market Board
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&h=675&q=85', // Savings Coin Plant
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=675&q=85', // Business Financial Analytics
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&h=675&q=85', // Investment Strategy Meeting
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&h=675&q=85'  // Indian / Global Currency
  ],
  'Health & Wellness': [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&h=675&q=85', // Yoga / Serene Nature
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&h=675&q=85', // Fresh Organic Diet
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&h=675&q=85', // Wellness Meditation
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&h=675&q=85', // Medical & Holistic Health
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&h=675&q=85', // Healthy Green Salad
    'https://images.unsplash.com/photo-1512290900672-1f02e71f2562?auto=format&fit=crop&w=1200&h=675&q=85'  // Ayurvedic Herbal Essential Oils
  ],
  'News & Trends': [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&h=675&q=85', // News Breaking
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&h=675&q=85', // Newspapers / Editorial
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&h=675&q=85', // Digital World News
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&h=675&q=85', // World Summit / Global Affairs
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&h=675&q=85'  // International Conference / Modi Summit
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
 * Fetch or Generate a 100% topic-relevant high-resolution landscape banner image
 */
async function getCategoryBannerImage(category, topic = '') {
  // 1. First priority: Generate 100% topic-tailored AI banner and upload to Cloudinary CDN
  if (topic) {
    try {
      console.log(`[MultiCategory Image] Generating AI Banner for "${topic}" in category: "${category}"...`);
      let visualPrompt = '';
      try {
        visualPrompt = await generateImagePrompt(topic, category);
      } catch (err) {
        visualPrompt = `cinematic photography of ${topic.replace(/[^a-zA-Z0-9\s]/g, '')}, ${category}, 8k resolution, shallow depth of field, dramatic studio lighting, masterpiece, no text`;
      }

      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(visualPrompt)}?width=1200&height=675&nologo=true&seed=${seed}&model=flux`;
      
      console.log(`[MultiCategory Image] Uploading generated AI banner to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
        folder: 'myblogs',
        transformation: [{ width: 1200, height: 675, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
        timeout: 20000
      });

      if (uploadResult && uploadResult.secure_url) {
        console.log(`[MultiCategory Image] AI Banner uploaded successfully: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
      }
    } catch (aiErr) {
      console.warn(`[MultiCategory Image] AI image generation notice: ${aiErr.message}. Trying Pexels/Fallbacks...`);
    }
  }

  // 2. Fallback: Search Pexels with clean contextual query
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && topic) {
    try {
      const searchKeywords = topic
        .replace(/^(how to|what is|top \d+|best|in \d{4}|guide|tutorial|alert|surge|target)\s+/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ');

      if (searchKeywords.length >= 3) {
        const res = await axios.get('https://api.pexels.com/v1/search', {
          params: { query: `${searchKeywords}`, per_page: 5, orientation: 'landscape' },
          headers: { Authorization: pexelsKey },
          timeout: 6000
        });

        const photos = res.data?.photos;
        if (photos && photos.length > 0) {
          return photos[0].src.landscape || photos[0].src.large2x || photos[0].src.large;
        }
      }
    } catch (err) {
      console.warn(`[MultiCategory Image] Pexels search notice for "${topic}": ${err.message}`);
    }
  }

  // 3. Fallback to curated 4K Unsplash photos matching topic keywords
  const images = CATEGORY_FEATURED_IMAGES[category] || CATEGORY_FEATURED_IMAGES['Tech & Tutorials'];
  const topicHash = topic ? topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const selectedIndex = Math.abs(topicHash) % images.length;
  return images[selectedIndex];
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

  // 2. Generate 2,000+ words in-depth article using the AI Prompting Architecture (with retry on transient 503/network spikes)
  let generatedData = null;
  let attempts = 0;
  while (attempts < 3 && !generatedData) {
    attempts++;
    try {
      generatedData = await generateBlogContentCore({
        title: selectedTopic,
        category: category,
        model: 'gemini-2.5-flash',
        length: 'long',
        language: 'hinglish',
        tone: 'informative'
      });
    } catch (aiErr) {
      console.warn(`[MultiCategory Auto] AI generation attempt ${attempts} failed:`, aiErr.message);
      if (attempts < 3) {
        await new Promise(r => setTimeout(r, 4000));
      } else {
        throw aiErr;
      }
    }
  }

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
