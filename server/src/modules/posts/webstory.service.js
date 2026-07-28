const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../../config/env');

const BlogPost = mongoose.model('BlogPost');
const WebStory = mongoose.model('WebStory');

const UNSPLASH_PORTRAIT_PHOTOS = [
  'photo-1542831371-29b0f74f9713',
  'photo-1499750310107-5fef28a66643',
  'photo-1498050108023-c5249f4df085',
  'photo-1517694712202-14dd9538aa97',
  'photo-1461749280684-dccba630e2f6',
  'photo-1504384308090-c894fdcc538d',
  'photo-1486312338219-ce68d2c6f44d',
  'photo-1526374965328-7f61d4dc18c5',
  'photo-1497366216548-37526070297c',
  'photo-1504639725590-34d0984388bd',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1517245386807-bb43f82c33c4',
  'photo-1559526324-593bc073d938',
  'photo-1522071820081-009f0129c71c',
  'photo-1516321497487-e288fb19713f',
  'photo-1454165804606-c3d57bc86b40',
  'photo-1513258496099-48168024aec0',
  'photo-1434030216411-0b793f4b4173',
  'photo-1427504494785-3a9ca7044f45',
  'photo-1523240795612-9a054b0db644',
  'photo-1524178232363-1fb2b075b655',
  'photo-1580582932707-520aed937b7b',
  'photo-1577896851231-70ef18881754',
  'photo-1509062522246-3755977927d7',
  'photo-1531482615713-2afd69097998',
  'photo-1521791136064-7986c2920216',
  'photo-1556761175-5973dc0f32e7',
  'photo-1551836022-d5d88e9218df',
  'photo-1573496359142-b8d87734a5a2',
  'photo-1573497019940-1c28c88b4f3e',
  'photo-1507679799987-c73779587ccf',
  'photo-1519085360753-af0119f7cbe7',
  'photo-1486406146926-c627a92ad1ab',
  'photo-1497215728101-856f4ea42174',
  'photo-1541888946425-d0fbb186a5b3',
  'photo-1516321318423-f06f85e504b3',
  'photo-1526948128573-703ee1aeb6fa',
  'photo-1557804506-669a67965ba0',
  'photo-1517048676732-d65bc937f952',
  'photo-1531403009284-440f080d1e12',
  'photo-1553877522-43269d4ea984',
  'photo-1522202176988-66273c2fd55f',
  'photo-1450133064473-71024230f91b',
  'photo-1501504905252-473c47e087f8',
  'photo-1497633762265-9d179a990aa6',
  'photo-1513542789411-b6a5d4f31634',
  'photo-1456513080510-7bf3a84b82f8',
  'photo-1495446815901-a7297e633e8d'
];

function getUniqueUnsplashImage(title = '', slideIdx = 0) {
  const str = `${title}_slide_${slideIdx}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % UNSPLASH_PORTRAIT_PHOTOS.length;
  }
  const photoId = UNSPLASH_PORTRAIT_PHOTOS[Math.abs(hash)];
  return `https://images.unsplash.com/${photoId}?w=720&h=1280&fit=crop&q=80`;
}

async function fetchPortraitImage(query, title = '', slideIdx = 0) {
  const apiKey = process.env.PEXELS_API_KEY;
  const cleanQuery = (query || title || 'job').trim();

  if (apiKey) {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: { query: cleanQuery, per_page: 10, orientation: 'portrait' },
        headers: { Authorization: apiKey },
        timeout: 6000
      });

      const photos = response.data?.photos;
      if (photos && photos.length > 0) {
        const photo = photos[slideIdx % photos.length] || photos[0];
        return (photo.src.portrait || photo.src.large || photo.src.medium)
          .split('?')[0] + '?w=720&h=1280&fit=crop&q=80';
      }
    } catch (err) {
      console.warn(`[WebStory Sourcing] Pexels API image fetch failed for "${cleanQuery}":`, err.message);
    }
  }

  return getUniqueUnsplashImage(title || cleanQuery, slideIdx);
}

async function callAiJson(prompt) {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  
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
    try {
      console.log('[WebStory AI] Requesting Groq Llama-3.3-70b...');
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
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
      console.warn('[WebStory AI] Groq fallback failed:', err.message);
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
${alert.detailsText}
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

    // 4. Fetch background portrait images for each slide in parallel (Use featuredImage for Cover Slide if available)
    console.log('[WebStory Sourcing] Sourcing portrait background images...');
    const slidePromises = result.slides.map(async (slide, idx) => {
      let imageUrl;
      if (idx === 0 && post.featuredImage && post.featuredImage.startsWith('http') && !post.featuredImage.includes('data:image') && !post.featuredImage.includes('pollinations')) {
        imageUrl = post.featuredImage;
        console.log(`[WebStory Sourcing] Using post featured image for Cover Slide: ${imageUrl}`);
      } else {
        imageUrl = await fetchPortraitImage(slide.imageQuery || post.title, post.title, idx);
      }
      return {
        heading: slide.heading,
        text: slide.text,
        image: imageUrl
      };
    });

    const finalSlides = await Promise.all(slidePromises);

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

module.exports = { generateWebStoryForPost, callAiJson, fetchPortraitImage };
