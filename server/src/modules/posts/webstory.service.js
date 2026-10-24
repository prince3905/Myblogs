const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../../config/env');
const { sanitizeAndDeduplicateTitle } = require('../../shared/utils/titleSanitizer');
const { calculateIndexingPriority } = require('../seo/seoAutomation.hook');

require('./webstory.model');
require('./post.model');
require('../liveAlerts/liveAlert.model');

const BlogPost = mongoose.model('BlogPost');
const WebStory = mongoose.model('WebStory');
const LiveAlert = mongoose.model('LiveAlert');

const fallbackBackgrounds = [
  // 1. Studying students & exam preparation
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=720&h=1280&fit=crop&q=80',

  // 2. Indian & classical government buildings / administrative architecture
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=720&h=1280&fit=crop&q=80',

  // 3. Modern offices & career desks
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=720&h=1280&fit=crop&q=80',

  // 4. Abstract dark gradients & modern textures
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=720&h=1280&fit=crop&q=80'
];

const UNSPLASH_PORTRAIT_PHOTOS = [
  'photo-1542831371-29b0f74f9713', 'photo-1499750310107-5fef28a66643', 'photo-1498050108023-c5249f4df085',
  'photo-1517694712202-14dd9538aa97', 'photo-1461749280684-dccba630e2f6', 'photo-1504384308090-c894fdcc538d',
  'photo-1486312338219-ce68d2c6f44d', 'photo-1526374965328-7f61d4dc18c5', 'photo-1497366216548-37526070297c',
  'photo-1504639725590-34d0984388bd', 'photo-1507003211169-0a1dd7228f2d', 'photo-1517245386807-bb43f82c33c4',
  'photo-1559526324-593bc073d938', 'photo-1522071820081-009f0129c71c', 'photo-1516321497487-e288fb19713f',
  'photo-1454165804606-c3d57bc86b40', 'photo-1513258496099-48168024aec0', 'photo-1434030216411-0b793f4b4173',
  'photo-1427504494785-3a9ca7044f45', 'photo-1523240795612-9a054b0db644', 'photo-1524178232363-1fb2b075b655',
  'photo-1580582932707-520aed937b7b', 'photo-1577896851231-70ef18881754', 'photo-1509062522246-3755977927d7',
  'photo-1531482615713-2afd69097998', 'photo-1521791136064-7986c2920216', 'photo-1556761175-5973dc0f32e7',
  'photo-1551836022-d5d88e9218df', 'photo-1573496359142-b8d87734a5a2', 'photo-1573497019940-1c28c88b4f3e',
  'photo-1507679799987-c73779587ccf', 'photo-1519085360753-af0119f7cbe7', 'photo-1486406146926-c627a92ad1ab',
  'photo-1497215728101-856f4ea42174', 'photo-1541888946425-d0fbb186a5b3', 'photo-1516321318423-f06f85e504b3',
  'photo-1526948128573-703ee1aeb6fa', 'photo-1557804506-669a67965ba0', 'photo-1517048676732-d65bc937f952',
  'photo-1531403009284-440f080d1e12', 'photo-1553877522-43269d4ea984', 'photo-1522202176988-66273c2fd55f',
  'photo-1450133064473-71024230f91b', 'photo-1501504905252-473c47e087f8', 'photo-1497633762265-9d179a990aa6',
  'photo-1513542789411-b6a5d4f31634', 'photo-1456513080510-7bf3a84b82f8', 'photo-1495446815901-a7297e633e8d',
  'photo-1523050854058-8df90110c9f1', 'photo-1544717305-2782549b5136', 'photo-1524995997946-a1c2e315a42f',
  'photo-1568602471122-7832951cc4c5', 'photo-1492562080023-ab3db95bfbce', 'photo-1519452635265-7b1fbfd1e4e0',
  'photo-1534528741775-53994a69daeb', 'photo-1506794778202-cad84cf45f1d', 'photo-1517841905240-472988babdf9',
  'photo-1539571696357-5a69c17a67c6', 'photo-1501196354995-cbb51c65aaea', 'photo-1494790108377-be9c29b29330'
];

function getUniqueUnsplashImage(title = '', slideIdx = 0, usedImages = new Set()) {
  const str = `${title}_slide_${slideIdx}`;
  let baseHash = 0;
  for (let i = 0; i < str.length; i++) {
    baseHash = (baseHash * 31 + str.charCodeAt(i)) % UNSPLASH_PORTRAIT_PHOTOS.length;
  }

  for (let attempt = 0; attempt < UNSPLASH_PORTRAIT_PHOTOS.length; attempt++) {
    const photoId = UNSPLASH_PORTRAIT_PHOTOS[(Math.abs(baseHash) + attempt + slideIdx * 7) % UNSPLASH_PORTRAIT_PHOTOS.length];
    const url = `https://images.unsplash.com/${photoId}?w=720&h=1280&fit=crop&q=80`;
    if (!usedImages.has(url)) {
      return url;
    }
  }

  const fallbackId = UNSPLASH_PORTRAIT_PHOTOS[(Math.abs(baseHash) + slideIdx * 13) % UNSPLASH_PORTRAIT_PHOTOS.length];
  return `https://images.unsplash.com/${fallbackId}?w=720&h=1280&fit=crop&q=80`;
}

async function fetchPortraitImage(query, title = '', slideIdx = 0, usedImages = new Set()) {
  const apiKey = process.env.PEXELS_API_KEY;
  const cleanQuery = (query || title || 'education career office').trim();

  if (apiKey) {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: { query: cleanQuery, per_page: 20, orientation: 'portrait' },
        headers: { Authorization: apiKey },
        timeout: 6000
      });

      const photos = response.data?.photos;
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const candidateIdx = (slideIdx + i) % photos.length;
          const photo = photos[candidateIdx];
          const url = (photo.src.portrait || photo.src.large || photo.src.medium)
            .split('?')[0] + '?w=720&h=1280&fit=crop&q=80';
          if (!usedImages.has(url)) {
            return url;
          }
        }
      }
    } catch (err) {
      console.warn(`[WebStory Sourcing] Pexels API image fetch notice for "${cleanQuery}":`, err.message);
    }
  }

  return getUniqueUnsplashImage(title || cleanQuery, slideIdx, usedImages);
}

async function callAiJson(prompt) {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];
  
  // 1. Try Gemini
  for (const key of keys) {
    for (const model of models) {
      try {
        console.log(`[WebStory AI] Requesting Gemini ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }, { timeout: 15000 });

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return JSON.parse(text);
        }
      } catch (err) {
        console.warn(`[WebStory AI] Gemini ${model} failed:`, err.message);
      }
    }
  }

  // 2. Try Groq Fallback
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'groq/compound-mini'];
    for (const gModel of groqModels) {
      try {
        console.log(`[WebStory AI] Requesting Groq ${gModel}...`);
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: gModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }, {
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          timeout: 15000
        });
        const text = res.data?.choices?.[0]?.message?.content;
        if (text) {
          return JSON.parse(text);
        }
      } catch (err) {
        console.warn(`[WebStory AI] Groq ${gModel} fallback failed:`, err.message);
      }
    }
  }

  // 3. Try OpenAI Fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      console.log('[WebStory AI] Requesting OpenAI GPT-4o-mini...');
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }, {
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      const text = res.data?.choices?.[0]?.message?.content;
      if (text) {
        return JSON.parse(text);
      }
    } catch (err) {
      console.warn('[WebStory AI] OpenAI fallback failed:', err.message);
    }
  }

  throw new Error('All configured AI API services (Gemini, Groq, OpenAI) failed to generate Web Story content.');
}

async function generateWebStoryForPost(post, alert) {
  try {
    // 1. Decision Logic (Filter for High-Demand & Job related updates only)
    const highDemandKeywords = [
      'admit card', 'result', 'answer key', 'direct link', 'apply online', 
      'online form', 'vacancy', 'recruitment', 'bharti', 'conductor', 'apprentice'
    ];
    const titleLower = post.title.toLowerCase();
    const isHighDemand = highDemandKeywords.some(kw => titleLower.includes(kw));

    if (!isHighDemand) {
      console.log(`[WebStory Sourcing] Post "${post.title}" bypassed (No high-demand keyword hooks found).`);
      return null;
    }

    console.log(`[WebStory Sourcing] Post "${post.title}" passed filter! Launching Gemini Web Story writer...`);

    // 2. Build Structured Prompts for exactly 5 Slides
    const prompt = `You are a professional SEO copywriter and Google Discover Web Story optimizer.
Create a highly engaging Web Story of exactly 5 slides for this job alert post:
Post Title: "${post.title}"
Post Summary/Excerpt: "${post.excerpt}"
Factual Job Context:
"""
${alert?.detailsText || post?.content || post?.excerpt || ''}
"""

SLIDE STRUCTURE DIRECTIVES:
- Slide 1 (Cover / The Hook): Bada click-magnet title in Hindi/Hinglish (e.g. "UP Dairy Development Bharti 2026: भर्ती का सुनहरा मौका!"). Heading: max 60 chars. Description: max 120 chars.
- Slide 2 (Eligibility & Post Details): Seat count, qualification, age limit. Heading: max 60 chars. Description: max 180 chars.
- Slide 3 (Dates & Fees): Apply start/last dates, category fees. Heading: max 60 chars. Description: max 180 chars.
- Slide 4 (Warning / Alerts): Size/cleanliness of photo & signature, or selection process tip (e.g. "Photo upload karte waqt size dhyan rakhein, warna form reject ho sakta hai!"). Heading: max 60 chars. Description: max 180 chars.
- Slide 5 (Swipe-Up Call to Action): Apply online link active notice (e.g., "Apply online link start, click to apply now or join Telegram!"). Heading: max 60 chars. Description: max 180 chars.

JSON Output Schema:
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Exciting click magnet Web Story Title",
  "slides": [
    {
      "heading": "Slide heading",
      "text": "Slide text content under 180 characters",
      "imageQuery": "short stock image search query keywords for the background portrait image, e.g. 'office computer drafting table' or 'indian railways train' or 'military jets'"
    }
  ]
}
Each slide MUST contain a descriptive 'imageQuery' to fetch the background.
`;

    // 3. Trigger AI JSON Content Writer
    const result = await callAiJson(prompt);
    if (!result || !result.slides || result.slides.length !== 5) {
      throw new Error('AI generator failed to return exactly 5 slides.');
    }

    // 4. Fetch background portrait images for each slide with guaranteed zero duplicates
    console.log('[WebStory Sourcing] Sourcing unique portrait background images...');
    const usedImages = new Set();
    const finalSlides = [];

    for (let idx = 0; idx < result.slides.length; idx++) {
      const slide = result.slides[idx];
      let imageUrl = null;
      if (idx === 0 && post.featuredImage && post.featuredImage.startsWith('http') && !post.featuredImage.includes('data:image') && !post.featuredImage.includes('pollinations') && !usedImages.has(post.featuredImage)) {
        imageUrl = post.featuredImage;
        usedImages.add(imageUrl);
        console.log(`[WebStory Sourcing] Using post featured image for Cover Slide: ${imageUrl}`);
      } else {
        imageUrl = await fetchPortraitImage(slide.imageQuery || post.title, post.title, idx, usedImages);
        usedImages.add(imageUrl);
      }
      finalSlides.push({
        heading: slide.heading,
        text: slide.text,
        image: imageUrl
      });
    }

    // 5. Create Mongoose WebStory Document
    // Delete any existing WebStory with same slug to avoid index conflicts
    await WebStory.deleteMany({ slug: post.slug });

    const newStory = new WebStory({
      title: result.title || post.title,
      slug: post.slug,
      post: post._id,
      slides: finalSlides,
      status: post.status, // Match drafted/published status of parent blog post
      views: 0
    });

    await newStory.save();
    console.log(`[WebStory Sourcing] Web Story successfully drafted for: "${post.title}" [Slug: ${post.slug}]`);

    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'WEB_STORY',
      level: 'SUCCESS',
      action: 'Google Discover WebStory Created',
      message: `Generated 5-Slide Visual WebStory for "${post.title}"`,
      metadata: { title: post.title, slug: post.slug, slides: finalSlides.length, storyId: newStory._id }
    });

    return newStory._id;

  } catch (err) {
    console.error('[WebStory Sourcing] Story generator failed:', err.message);
    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'WEB_STORY',
      level: 'ERROR',
      action: 'WebStory Generator Failed',
      message: err.message,
      metadata: { title: post?.title }
    });
    return null;
  }
}

/**
 * Fast, deterministic (no LLM, no 429 risk) Web Story generator for Tier-1 LiveAlert jobs.
 * Enforces strict crawl budget rules (max 8 stories per day, Tier-1 or 50+ posts only).
 */
async function generateWebStoryForLiveAlert(alertDoc) {
  try {
    if (!alertDoc || !alertDoc._id || !alertDoc.slug) {
      return null;
    }

    // 1. Strict Geo & Niche Filter: Indian Government Jobs only
    if (alertDoc.isGlobal === true) {
      return null;
    }

    // 2. Strict Qualification Filter (Crawl Budget Protection)
    const rawPriority = alertDoc.indexingPriority || calculateIndexingPriority(alertDoc.title, alertDoc.boardName, alertDoc.category);
    
    // Parse vacancy count from detailsText or title
    const vacancyMatch = (alertDoc.detailsText || alertDoc.title || '').match(/(?:total vacancies|vacancies|posts?|कुल पद)[^\d\n]*(\d+[\d,]*)/i)
      || (alertDoc.title || '').match(/\b(\d+)\s*(?:posts|पद|vacancies)\b/i);
    const parsedVacancies = vacancyMatch ? parseInt(vacancyMatch[1].replace(/,/g, ''), 10) : 0;
    const isCurrentAffairs = alertDoc.category === 'Current Affairs';
    const isUrgent = rawPriority === 'URGENT';
    const isHighVacancy = parsedVacancies >= 50;

    if (!isUrgent && !isHighVacancy && !isCurrentAffairs) {
      return null;
    }

    // 3. De-duplication Check: If story already exists, skip
    const existingStory = await WebStory.findOne({
      $or: [
        { slug: alertDoc.slug },
        { liveAlert: alertDoc._id }
      ]
    }).select('_id slug');

    if (existingStory) {
      return existingStory._id;
    }

    // 4. Strict Daily Cap: Maximum 8 LiveAlert Web Stories per day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await WebStory.countDocuments({
      createdAt: { $gte: startOfToday },
      liveAlert: { $exists: true }
    });

    if (todayCount >= 8) {
      console.log(`[WebStory LiveAlert] Daily crawl budget cap of 8 stories reached today. Skipping: "${alertDoc.title}"`);
      return null;
    }

    // 5. Clean & Deduplicate Title
    const cleanTitle = sanitizeAndDeduplicateTitle(alertDoc.title || 'Sarkari Job Notification 2026');
    const board = (alertDoc.boardName && alertDoc.boardName !== 'Official Board') ? alertDoc.boardName : 'सरकारी विभाग';
    const state = alertDoc.state || 'All India';
    const lastDate = (alertDoc.lastDate && alertDoc.lastDate !== 'N/A') ? alertDoc.lastDate : 'जल्द घोषित होगी';
    const vacancyBadge = parsedVacancies > 0 ? `${parsedVacancies}+` : 'विभिन्न';

    // Parse qualification summary
    let qualification = '10वीं / 12वीं / स्नातक / संबंधित डिप्लोमा';
    if (alertDoc.detailsText) {
      const qMatch = alertDoc.detailsText.match(/(?:qualification|योग्यता|eligibility)[^\n:]*[:\-]([^\n]+)/i);
      if (qMatch && qMatch[1].trim()) {
        qualification = qMatch[1].trim().slice(0, 60);
      }
    }

    // Parse pay scale / salary summary
    let salary = 'नियमानुसार उत्कृष्ट 7th CPC वेतनमान';
    if (alertDoc.detailsText) {
      const sMatch = alertDoc.detailsText.match(/(?:pay scale|salary|वेतनमान)[^\n:]*[:\-]([^\n]+)/i);
      if (sMatch && sMatch[1].trim()) {
        salary = sMatch[1].trim().slice(0, 60);
      }
    }

    // 6. Source High-Quality Vertical (9:16) Background Image
    let storyBgImage = null;
    if (alertDoc.featuredImage && typeof alertDoc.featuredImage === 'string' && alertDoc.featuredImage.startsWith('http') && !alertDoc.featuredImage.includes('logo-og.webp')) {
      storyBgImage = alertDoc.featuredImage;
    } else if (alertDoc.imageUrl && typeof alertDoc.imageUrl === 'string' && alertDoc.imageUrl.startsWith('http')) {
      storyBgImage = alertDoc.imageUrl;
    }

    // If no specific high-res image found for the job, randomly select from fallbackBackgrounds
    if (!storyBgImage) {
      const randomIndex = Math.floor(Math.random() * fallbackBackgrounds.length);
      storyBgImage = fallbackBackgrounds[randomIndex];
    }

    // 7. Assemble 5 High-Retention Slides (Consistent, high-res background with dark overlay)
    const finalSlides = [
      {
        heading: cleanTitle,
        text: `🔥 बंपर भर्ती जारी! कुल ${vacancyBadge} पद। ${qualification} पास उम्मीदवारों के लिए सरकारी नौकरी का सुनहरा अवसर।`,
        image: storyBgImage
      },
      {
        heading: `🏛️ विभाग एवं पद विवरण`,
        text: `संगठन: ${board} | कुल पद: ${vacancyBadge} | कार्यक्षेत्र: ${state} | पद नाम व श्रेणीवार विवरण चेक करें।`,
        image: storyBgImage
      },
      {
        heading: `📋 शैक्षणिक योग्यता व आयु सीमा`,
        text: `आवश्यक योग्यता: ${qualification} | आयु सीमा व आरक्षित वर्गों को नियमानुसार अधिकतम आयु में छूट लागू।`,
        image: storyBgImage
      },
      {
        heading: `📅 महत्वपूर्ण तिथियां व वेतनमान`,
        text: `ऑनलाइन आवेदन की अंतिम तिथि: ${lastDate} | वेतनमान: ${salary} | अंतिम तारीख से पहले फॉर्म अवश्य भरें।`,
        image: storyBgImage
      },
      {
        heading: `⚡ 100% आधिकारिक आवेदन लिंक`,
        text: `पूरी जानकारी, आधिकारिक नोटिफिकेशन PDF व ऑनलाइन आवेदन लिंक के लिए नीचे Swipe Up करें।`,
        image: storyBgImage
      }
    ];

    // 8. Create & Save WebStory Document
    const newStory = new WebStory({
      title: cleanTitle,
      slug: alertDoc.slug,
      liveAlert: alertDoc._id,
      slides: finalSlides,
      status: 'published',
      isPublished: true,
      isGlobal: false,
      isIndexable: true,
      views: 0
    });

    await newStory.save();
    console.log(`[WebStory LiveAlert] ⚡ Auto-generated Web Story for Tier-1 alert: "${cleanTitle}" [Slug: ${alertDoc.slug}]`);

    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'WEB_STORY',
      level: 'SUCCESS',
      action: 'Tier-1 LiveAlert WebStory Created',
      message: `Deterministic WebStory published for "${cleanTitle}" (${todayCount + 1}/8 today)`,
      metadata: { title: cleanTitle, slug: alertDoc.slug, alertId: alertDoc._id, storyId: newStory._id }
    });

    return newStory._id;
  } catch (err) {
    console.error(`[WebStory LiveAlert] Failed to generate story for alert "${alertDoc?.title}":`, err.message);
    return null;
  }
}

module.exports = { generateWebStoryForPost, generateWebStoryForLiveAlert, callAiJson, fetchPortraitImage, fallbackBackgrounds };
