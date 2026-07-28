const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../../config/env');

const BlogPost = mongoose.model('BlogPost');
const WebStory = mongoose.model('WebStory');

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&h=1280&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=720&h=1280&fit=crop&q=80',
];

function pickFallbackImage(query) {
  const hash = query ? query.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return HERO_PHOTOS[Math.abs(hash) % HERO_PHOTOS.length];
}

async function fetchPortraitImage(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !query || !query.trim()) {
    return pickFallbackImage(query || 'blog');
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: query.trim(), per_page: 5, orientation: 'portrait' },
      headers: { Authorization: apiKey },
      timeout: 6000
    });

    const photos = response.data?.photos;
    if (photos && photos.length > 0) {
      // Pick the first portrait photo and request a vertical cropped version suitable for mobile AMP Stories
      const photo = photos[0];
      return (photo.src.portrait || photo.src.large || photo.src.medium)
        .split('?')[0] + '?w=720&h=1280&fit=crop&q=80';
    }
  } catch (err) {
    console.warn(`[WebStory Sourcing] Pexels API image fetch failed for "${query}":`, err.message);
  }

  return pickFallbackImage(query);
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
        imageUrl = await fetchPortraitImage(slide.imageQuery || post.title);
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
