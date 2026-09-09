const axios = require('axios');
const { generateBlogContentCore } = require('../ai/ai.controller');

const quizResponseSchema = {
  type: "OBJECT",
  properties: {
    quizzes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionId: { type: "INTEGER" },
          questionText: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          correctOptionIndex: { type: "INTEGER" },
          explanation: { type: "STRING" },
          topicCategory: { type: "STRING" }
        },
        required: ["questionId", "questionText", "options", "correctOptionIndex", "explanation", "topicCategory"]
      }
    }
  },
  required: ["quizzes"]
};

/**
 * Fetch top news summaries from authentic feeds
 */
async function fetchRawDailyNewsContext() {
  const sources = [
    'https://pib.gov.in/RssMain.aspx?ModId=6',
    'https://newsonair.gov.in/rss.aspx',
    'https://ddnews.gov.in/feed/'
  ];

  let rawHeadlines = [];

  for (const url of sources) {
    try {
      const response = await axios.get(url, {
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (response.data) {
        const itemMatches = response.data.match(/<title>([^<]+)<\/title>/gi);
        if (itemMatches) {
          const titles = itemMatches.map(t => t.replace(/<\/?title>/gi, '').replace('<![CDATA[', '').replace(']]>', '').trim());
          rawHeadlines.push(...titles.slice(1, 10));
        }
      }
    } catch (err) {
      // Continue to next source
    }
  }

  // Deduplicate headlines
  rawHeadlines = Array.from(new Set(rawHeadlines)).filter(h => h.length > 10 && !h.includes('PIB') && !h.includes('RSS'));
  return rawHeadlines.slice(0, 20).join('\n• ');
}

/**
 * Helper to call Gemini Structured Quiz Generator
 */
async function generateQuizWithGemini(prompt) {
  const candidateKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7
  ].filter(Boolean);

  let lastError = null;

  for (const apiKey of candidateKeys) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: quizResponseSchema
          }
        },
        {
          timeout: 75000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      
      try {
        const parsed = JSON.parse(text);
        if (parsed.quizzes && parsed.quizzes.length > 0) {
          return parsed.quizzes;
        }
      } catch (jsonErr) {
        // Fallback: extract individual MCQ blocks using regex if outer JSON fails
        const questionBlocks = text.match(/\{\s*"questionId"[\s\S]*?"topicCategory"\s*:\s*"[^"]*"\s*\}/g);
        if (questionBlocks && questionBlocks.length > 0) {
          const recovered = [];
          for (const block of questionBlocks) {
            try {
              recovered.push(JSON.parse(block));
            } catch (e) {}
          }
          if (recovered.length > 0) {
            return recovered;
          }
        }
        throw jsonErr;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[CurrentAffairs Quiz] Notice: ${err.message}. Trying next key...`);
    }
  }

  console.warn(`[CurrentAffairs Quiz] All keys exhausted for quiz: ${lastError?.message}`);
  return [];
}

/**
 * Strict HTML and link sanitizer for Current Affairs articles
 */
function sanitizeCurrentAffairsHtml(rawHtml = '', dateString = '') {
  if (!rawHtml) return '';

  let c = rawHtml;

  // 1. Strip Google Analytics / GTM / Ad tracking query parameters from all hrefs
  c = c.replace(/href=["']([^"']+)["']/gi, (match, url) => {
    let cleanUrl = url
      .replace(/([?&])(_gl|_ga|utm_[a-z]+|fbclid|gclid)=[^"'\s&>)]*/gi, '')
      .replace(/\?&/g, '?')
      .replace(/[?&]$/g, '');
    return `href="${cleanUrl}"`;
  });

  // 2. Fix hallucinated / incorrect internal category links
  c = c.replace(/https?:\/\/(www\.)?digitalhomeblog\.in\/category\/[a-z0-9-]+/gi, '/current-affairs');
  c = c.replace(/href=["']\/category\/[a-z0-9-]+["']/gi, 'href="/current-affairs"');

  // 3. Clean any Sarkari Job boilerplate Takeaways that don't belong in Current Affairs
  c = c.replace(
    /<h2>Key Takeaways \(महत्वपूर्ण निष्कर्ष\)<\/h2>\s*<ul>[\s\S]*?<\/ul>/gi,
    `<h2>Key Takeaways (महत्वपूर्ण निष्कर्ष व परीक्षा रिवीजन)</h2>
<ul>
  <li>आज के सभी मुख्य राष्ट्रीय व अंतर्राष्ट्रीय घटनाक्रमों के मुख्य बिंदुओं को अपने डेली रिवीजन नोट्स में अवश्य शामिल करें।</li>
  <li>नीचे दिए गए 10 MCQs डेली GK प्रैक्टिस क्विज़ को हल करके अपनी तैयारी व एक्यूरेसी का स्व-मूल्यांकन करें।</li>
  <li>स्टेटिक GK बूस्टर फैक्ट्स को UPSC, SSC CGL/CHSL, Railway RRB, BPSC व UP Police परीक्षाओं के लिए विशेष रूप से याद रखें।</li>
</ul>`
  );

  // 4. Clean any Sarkari Job Application boxes or india.gov.in links
  c = c.replace(/<div class="search-intent-box"[\s\S]*?<\/div>/gi, '');

  // 5. Append clean, high-value Current Affairs Intent & Quick Links Box
  const intentBox = `
<div class="search-intent-box" style="background:#F0FDF4; border-left:4px solid #16A34A; padding:18px; margin:24px 0; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
  <h4 style="margin:0 0 14px 0; color:#15803D; font-size:1.08rem; font-weight:800; display:flex; align-items:center; gap:8px;">
    🔍 Daily Current Affairs & Exam Prep Quick Links (महत्वपूर्ण उपयोगी कड़ियाँ)
  </h4>
  <ul style="margin:0; padding-left:18px; color:#1F2937; font-size:0.92rem; line-height:2.2; list-style-type:square;">
    <li style="margin-bottom:8px;">
      <strong style="color:#065F46; font-weight:600;">आज का 10 MCQs GK क्विज़ टेस्ट हल करें:</strong> 
      <a href="/daily-quiz" style="display:inline-flex; align-items:center; gap:4px; padding:3px 12px; background:#10b981; color:#ffffff; font-weight:700; font-size:0.8rem; border-radius:6px; text-decoration:none; margin-left:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
        🎯 Play Daily Quiz (10 MCQs) 🚀
      </a>
    </li>
    <li style="margin-bottom:8px;">
      <strong style="color:#065F46; font-weight:600;">पिछले सभी दिनों और महीनों के करेंट अफेयर्स:</strong> 
      <a href="/current-affairs" style="display:inline-flex; align-items:center; gap:4px; padding:3px 12px; background:#4f46e5; color:#ffffff; font-weight:700; font-size:0.8rem; border-radius:6px; text-decoration:none; margin-left:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
        📚 All Current Affairs Archive 📁
      </a>
    </li>
    <li style="margin-bottom:8px;">
      <strong style="color:#065F46; font-weight:600;">लेटेस्ट सरकारी नौकरी, एडमिट कार्ड व रिजल्ट अलर्ट्स:</strong> 
      <a href="/job-alerts" style="display:inline-flex; align-items:center; gap:4px; padding:3px 12px; background:#ea580c; color:#ffffff; font-weight:700; font-size:0.8rem; border-radius:6px; text-decoration:none; margin-left:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
        ⚡ Live Job Alerts 🔔
      </a>
    </li>
  </ul>
</div>
`;

  return c + '\n' + intentBox;
}

/**
 * Generates Daily Current Affairs Capsule + 10 Practice MCQs
 * @param {Date} targetDate
 */
async function generateDailyCurrentAffairs(targetDate = new Date()) {
  const istDate = new Date(targetDate.getTime() + (5.5 * 60 * 60 * 1000));
  const dateString = istDate.toISOString().split('T')[0];
  const formattedReadableDate = istDate.toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const englishReadableDate = istDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Fetch contextual headlines
  let liveNewsContext = '';
  try {
    liveNewsContext = await fetchRawDailyNewsContext();
  } catch (e) {
    liveNewsContext = '';
  }

  const postTitle = `Daily Current Affairs ${englishReadableDate} in Hindi: आज के मुख्य राष्ट्रीय व अंतर्राष्ट्रीय करेंट अफेयर्स`;

  const customCommand = `
You are the Chief Educational Editor for India's top Sarkari Exam portal (UPSC, SSC CGL/CHSL, Railways RRB, Banking IBPS, BPSC, UP Police).
Generate a comprehensive, authoritative, long-form (1,500+ words) Daily Current Affairs Capsule for ${englishReadableDate} (${formattedReadableDate}).

Target Date: ${dateString} (${englishReadableDate})
Live News Context Feed:
${liveNewsContext || 'Cover all top national, international, defense, economy, science, appointments and sports events.'}

================================================================================
MANDATORY EDUCATIONAL SECTIONS WITH <h2> and <h3> TAGS:
================================================================================
1. "<h2>आज के मुख्य करेंट अफेयर्स: सारांश (Quick Highlights at a Glance)</h2>" followed by a responsive Markdown table.
2. "<h2>1. राष्ट्रीय करेंट अफेयर्स (National Affairs & Governance)</h2>"
3. "<h2>2. अंतर्राष्ट्रीय परिदृश्य व शिखर सम्मेलन (International Summits & MoUs)</h2>"
4. "<h2>3. आर्थिक, बैंकिंग व व्यापार समाचार (Economy, Banking & Business)</h2>"
5. "<h2>4. महत्वपूर्ण नियुक्तियाँ व इस्तीफे (Appointments & Resignations)</h2>"
6. "<h2>5. रक्षा, अंतरिक्ष व विज्ञान प्रौद्योगिकी (Defense, DRDO & ISRO)</h2>"
7. "<h2>6. खेल जगत व प्रतियोगिताएं (Sports & Tournaments)</h2>"
8. "<h2>7. महत्वपूर्ण दिवस, सप्ताह व थीम (Important Days & Themes)</h2>"
9. "<h2>8. स्टेटिक GK बूस्टर फैक्ट्स (Exam Static GK Key Takeaways)</h2>"

Under each section:
- Provide 2-3 body paragraphs of detailed background.
- Embed a Static GK box: '<div class="static-gk-box" style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px;margin:12px 0;border-radius:6px;"><strong>📌 परीक्षा उपयोगी महत्वपूर्ण तथ्य (Static GK):</strong> ...</div>'
`;

  console.log(`[CurrentAffairs Service] Step 1: Generating long-form content for ${dateString}...`);
  const generatedData = await generateBlogContentCore({
    title: postTitle,
    model: 'gemini-2.5-flash',
    length: 'long',
    tone: 'informative',
    language: 'hinglish',
    category: 'Current Affairs',
    command: customCommand
  });

  // Step 2: Generate 10 Practice MCQs
  const quizPrompt = `
Generate exactly 10 high-yield, exam-standard Multiple Choice Questions (MCQs) in Hindi + English based on today's Current Affairs for ${englishReadableDate}:

Summary Context:
${generatedData.summary || generatedData.seoDescription}

Rules:
1. Exactly 10 questions with questionId 1 to 10.
2. 4 distinct options per question.
3. correctOptionIndex must be an integer (0, 1, 2, or 3).
4. Detailed explanation in Hindi + English explaining why the answer is correct.
5. Cover: National, Economy, Defense, Sports, Appointments, International, Science.
`;

  console.log(`[CurrentAffairs Service] Step 2: Generating 10 MCQs for ${dateString}...`);
  const quizzes = await generateQuizWithGemini(quizPrompt);

  const cleanSlug = `daily-current-affairs-${dateString}-hindi-gk-quiz`;
  const sanitizedContent = sanitizeCurrentAffairsHtml(generatedData.content || '', dateString);

  return {
    title: generatedData.title || postTitle,
    slug: cleanSlug,
    dateString,
    publishDate: targetDate,
    summary: generatedData.summary || generatedData.seoDescription || `आज ${formattedReadableDate} के दैनिक करेंट अफेयर्स और 10 महत्वपूर्ण MCQs।`,
    content: sanitizedContent,
    highlights: (generatedData.keywords || []).slice(0, 8),
    categories: ['National', 'International', 'Economy', 'Defense', 'Sports', 'Appointments', 'Days & Themes'],
    quizzes: quizzes || [],
    seoTitle: `Daily Current Affairs ${englishReadableDate} in Hindi | Daily GK Quiz`,
    seoDescription: `${englishReadableDate} के महत्वपूर्ण दैनिक करेंट अफेयर्स पढ़ें। UPSC, SSC, Railway, BPSC, Police भर्ती परीक्षा के लिए 10 महत्वपूर्ण MCQs और Static GK नोट्स।`,
    canonicalUrl: `https://www.digitalhomeblog.in/current-affairs/${cleanSlug}`
  };
}

module.exports = {
  generateDailyCurrentAffairs,
  sanitizeCurrentAffairsHtml,
  fetchRawDailyNewsContext
};
