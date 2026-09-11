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

function extractValidQuizzes(rawText = '') {
  if (!rawText) return [];
  // Clean markdown code blocks
  let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let list = [];
  try {
    const parsed = JSON.parse(cleaned);
    list = Array.isArray(parsed) ? parsed : (parsed.quizzes || parsed.items || parsed.questions || []);
  } catch (e) {
    // Tolerant regex parser for individual question blocks
    const regex = /\{[^{}]*("question"|"questionText")[\s\S]*?\}/g;
    const matches = cleaned.match(regex) || [];
    for (const m of matches) {
      try {
        const q = JSON.parse(m);
        list.push(q);
      } catch (err) {}
    }
  }

  // Normalize each quiz item strictly to match McqSchema
  const normalized = [];
  for (let i = 0; i < list.length; i++) {
    const q = list[i];
    const qText = (q.questionText || q.question || q.text || q.title || '').trim();
    if (!qText) continue;

    let opts = q.options || q.choices || [];
    if (!Array.isArray(opts) && typeof opts === 'object') {
      opts = Object.values(opts);
    }
    if (!Array.isArray(opts) || opts.length < 2) continue;

    let correctIdx = 0;
    if (typeof q.correctOptionIndex === 'number') {
      correctIdx = q.correctOptionIndex;
    } else if (typeof q.correctOption === 'number') {
      correctIdx = q.correctOption;
    } else if (typeof q.answerIndex === 'number') {
      correctIdx = q.answerIndex;
    } else if (typeof q.answer === 'number') {
      correctIdx = q.answer;
    } else if (typeof q.answer === 'string') {
      const matchIndex = opts.findIndex(o => String(o).toLowerCase().trim() === q.answer.toLowerCase().trim());
      if (matchIndex !== -1) {
        correctIdx = matchIndex;
      } else {
        const letter = q.answer.trim().toUpperCase();
        if (letter === 'A' || letter === '1') correctIdx = 0;
        else if (letter === 'B' || letter === '2') correctIdx = 1;
        else if (letter === 'C' || letter === '3') correctIdx = 2;
        else if (letter === 'D' || letter === '4') correctIdx = 3;
      }
    } else if (typeof q.correctAnswer === 'string') {
      const matchIndex = opts.findIndex(o => String(o).toLowerCase().trim() === q.correctAnswer.toLowerCase().trim());
      if (matchIndex !== -1) {
        correctIdx = matchIndex;
      } else {
        const letter = q.correctAnswer.trim().toUpperCase();
        if (letter === 'A' || letter === '1') correctIdx = 0;
        else if (letter === 'B' || letter === '2') correctIdx = 1;
        else if (letter === 'C' || letter === '3') correctIdx = 2;
        else if (letter === 'D' || letter === '4') correctIdx = 3;
      }
    }

    if (correctIdx < 0 || correctIdx >= opts.length) correctIdx = 0;

    normalized.push({
      questionId: Number(q.questionId) || (i + 1),
      questionText: qText,
      options: opts.slice(0, 4).map(o => String(o).trim()),
      correctOptionIndex: correctIdx,
      explanation: (q.explanation || q.reason || 'यह प्रश्न दैनिक परीक्षा व करेंट अफेयर्स के मुख्य तथ्यों पर आधारित है।').trim(),
      topicCategory: (q.topicCategory || q.category || 'General').trim()
    });
  }

  return normalized;
}

function getDefaultEmergencyQuizzes(dateString = '') {
  return [
    {
      questionId: 1,
      questionText: `दैनिक करेंट अफेयर्स (${dateString}): हाल ही में केंद्र सरकार द्वारा शुरू किए गए "डिजिटल भारत कौशल मिशन" का मुख्य उद्देश्य क्या है?`,
      options: ['ग्रामीण युवाओं को तकनीकी प्रशिक्षण देना', 'नई रक्षा मिसाइल प्रणाली का विकास', 'सौर ऊर्जा उपकरणों पर सब्सिडी', 'अंतरिक्ष अनुसंधान को बढ़ावा देना'],
      correctOptionIndex: 0,
      explanation: 'डिजिटल भारत कौशल मिशन के तहत ग्रामीण व अर्ध-शहरी युवाओं को आधुनिक AI, कोडिंग व डिजिटल टूल्स का निःशुल्क प्रशिक्षण दिया जाता है।',
      topicCategory: 'National'
    },
    {
      questionId: 2,
      questionText: 'भारतीय रिजर्व बैंक (RBI) द्वारा मौद्रिक नीति समिति (MPC) की बैठक में रेपो दर का निर्धारण किस मुख्य उद्देश्य से किया जाता है?',
      options: ['विदेशी मुद्रा भंडार बढ़ाना', 'मुद्रास्फीति (महंगाई) को नियंत्रित करना व विकास को गति देना', 'शेयर बाजार में निवेश बढ़ाना', 'सोने के आयात को सीमित करना'],
      correctOptionIndex: 1,
      explanation: 'RBI की MPC समिति का प्राथमिक लक्ष्य मूल्य स्थिरता बनाए रखते हुए विकास को गति देना और मुद्रास्फीति को 4% (+/-2%) के लक्ष्य में रखना है।',
      topicCategory: 'Economy'
    },
    {
      questionId: 3,
      questionText: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) के आगामी गगनयान मिशन का मुख्य उद्देश्य क्या है?',
      options: ['चंद्रमा के दक्षिणी ध्रुव पर मानव बस्ती बसाना', 'भारतीय अंतरिक्ष यात्रियों को पृथ्वी की निचली कक्षा (LEO) में भेजना', 'मंगल ग्रह पर रोवर उतारना', 'सूर्य के कोरोना का विस्तृत अध्ययन'],
      correctOptionIndex: 1,
      explanation: 'गगनयान भारत का पहला मानव अंतरिक्ष उड़ान मिशन है, जिसके तहत 3 सदस्यीय दल को 3 दिनों के लिए 400 किमी की निचली कक्षा में भेजा जाएगा।',
      topicCategory: 'Science'
    },
    {
      questionId: 4,
      questionText: 'हाल ही में आयोजित बहुराष्ट्रीय समुद्री अभ्यास "MILAN" का आयोजन भारतीय नौसेना द्वारा किस नौसैनिक कमान के तहत किया गया?',
      options: ['पश्चिमी नौसेना कमान (मुंबई)', 'पूर्वी नौसेना कमान (विशाखापत्तनम)', 'दक्षिणी नौसेना कमान (कोच्चि)', 'अंडमान और निकोबार कमान'],
      correctOptionIndex: 1,
      explanation: 'मिलन (MILAN) द्विवार्षिक बहुपक्षीय नौसैनिक अभ्यास है, जिसका आयोजन पूर्वी नौसेना कमान, विशाखापत्तनम द्वारा मित्र देशों के साथ किया जाता है।',
      topicCategory: 'Defense'
    },
    {
      questionId: 5,
      questionText: 'अंतर्राष्ट्रीय सौर गठबंधन (International Solar Alliance - ISA) का मुख्यालय भारत के किस शहर में स्थित है?',
      options: ['नई दिल्ली', 'गुरुग्राम (हरियाणा)', 'बेंगलुरु (कर्नाटक)', 'गांधीनगर (गुजरात)'],
      correctOptionIndex: 1,
      explanation: 'ISA का मुख्यालय गुरुग्राम (हरियाणा) में राष्ट्रीय सौर ऊर्जा संस्थान (NISE) परिसर में स्थित है।',
      topicCategory: 'International'
    },
    {
      questionId: 6,
      questionText: 'भारत के संविधान के किस अनुच्छेद के तहत "संघ लोक सेवा आयोग" (UPSC) के अध्यक्ष व सदस्यों की नियुक्ति राष्ट्रपति द्वारा की जाती है?',
      options: ['अनुच्छेद 280', 'अनुच्छेद 316', 'अनुच्छेद 324', 'अनुच्छेद 352'],
      correctOptionIndex: 1,
      explanation: 'संविधान के अनुच्छेद 316 के तहत UPSC तथा राज्य लोक सेवा आयोगों के अध्यक्ष और सदस्यों की नियुक्ति का प्रावधान है।',
      topicCategory: 'National'
    },
    {
      questionId: 7,
      questionText: 'हाल ही में संपन्न राष्ट्रीय खेलों में सर्वश्रेष्ठ पुरुष एथलीट की "राजा भालिंद्र सिंह ट्रॉफी" किस राज्य/दल ने जीती?',
      options: ['महाराष्ट्र', 'सर्विसेज (Services Sports Control Board)', 'हरियाणा', 'केरल'],
      correctOptionIndex: 1,
      explanation: 'राष्ट्रीय खेलों में ओवरऑल चैंपियनशिप के लिए सर्विसेज स्पोर्ट्स कंट्रोल बोर्ड (SSCB) को राजा भालिंद्र सिंह ट्रॉफी प्रदान की जाती है।',
      topicCategory: 'Sports'
    },
    {
      questionId: 8,
      questionText: 'नीति आयोग (NITI Aayog) के वर्तमान पदेन अध्यक्ष (Ex-officio Chairperson) कौन होते हैं?',
      options: ['भारत के राष्ट्रपति', 'भारत के प्रधानमंत्री', 'केंद्रीय वित्त मंत्री', 'RBI गवर्नर'],
      correctOptionIndex: 1,
      explanation: 'भारत के प्रधानमंत्री नीति आयोग के पदेन अध्यक्ष होते हैं।',
      topicCategory: 'Appointments'
    },
    {
      questionId: 9,
      questionText: 'प्रतिवर्ष "राष्ट्रीय विज्ञान दिवस" (National Science Day) किस ऐतिहासिक वैज्ञानिक खोज के उपलक्ष्य में 28 फरवरी को मनाया जाता है?',
      options: ['रामानुजन संख्या सिद्धांत', 'रमन प्रभाव (Raman Effect)', 'बोस-आइंस्टीन सांख्यिकी', 'परमाणु परीक्षण पोखरण'],
      correctOptionIndex: 1,
      explanation: 'सर सी.वी. रमन द्वारा 28 फरवरी 1928 को की गई रमन प्रभाव की खोज के सम्मान में प्रतिवर्ष 28 फरवरी को राष्ट्रीय विज्ञान दिवस मनाया जाता है।',
      topicCategory: 'Days & Themes'
    },
    {
      questionId: 10,
      questionText: 'पर्यावरण एवं जलवायु परिवर्तन: भारत ने किस वर्ष तक "शुद्ध शून्य कार्बन उत्सर्जन" (Net Zero Carbon Emissions) का राष्ट्रीय लक्ष्य निर्धारित किया है?',
      options: ['2047 तक', '2050 तक', '2070 तक', '2030 तक'],
      correctOptionIndex: 2,
      explanation: 'COP26 जलवायु शिखर सम्मेलन में भारत ने वर्ष 2070 तक शुद्ध शून्य (Net Zero) कार्बन उत्सर्जन प्राप्त करने की पंचामृत प्रतिज्ञा ली थी।',
      topicCategory: 'Environment'
    }
  ];
}

/**
 * Helper to call Gemini Structured Quiz Generator with robust Multi-AI Fallback
 */
async function generateQuizWithGemini(prompt, dateString = '') {
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
          contents: [{ role: 'user', parts: [{ text: `${prompt}\nRespond ONLY in valid JSON with an array named "quizzes". Keep questions & explanations concise.` }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        },
        {
          timeout: 45000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      let quizzes = extractValidQuizzes(text);
      if (quizzes.length >= 6) {
        console.log(`[CurrentAffairs Quiz] Gemini generated ${quizzes.length} MCQs. Ensuring 10 questions...`);
        quizzes = ensureTenQuestions(quizzes, dateString);
        return quizzes;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[CurrentAffairs Quiz] Gemini Notice: ${err.message}. Trying next key...`);
    }
  }

  // Fallback 2: Try Groq API
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (GROQ_API_KEY) {
    try {
      console.log('[CurrentAffairs Quiz] Trying Groq fallback for MCQs...');
      const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are an expert exam quiz creator. You must output only valid JSON with "quizzes" array containing 10 MCQs.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000
      }, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        timeout: 35000
      });

      const raw = groqRes.data?.choices?.[0]?.message?.content;
      let quizzes = extractValidQuizzes(raw);
      if (quizzes.length >= 6) {
        console.log(`[CurrentAffairs Quiz] Groq generated ${quizzes.length} MCQs. Ensuring 10 questions...`);
        quizzes = ensureTenQuestions(quizzes, dateString);
        return quizzes;
      }
    } catch (groqErr) {
      console.warn(`[CurrentAffairs Quiz] Groq fallback notice: ${groqErr.message}`);
    }
  }

  console.warn(`[CurrentAffairs Quiz] All AI models failed. Using guaranteed High-Yield Exam MCQs bank.`);
  return getDefaultEmergencyQuizzes(dateString);
}

function ensureTenQuestions(quizzes = [], dateString = '') {
  const emergency = getDefaultEmergencyQuizzes(dateString);
  const combined = [...quizzes];
  
  for (const em of emergency) {
    if (combined.length >= 10) break;
    // avoid duplicate question text
    if (!combined.some(q => q.questionText.slice(0, 20) === em.questionText.slice(0, 20))) {
      combined.push(em);
    }
  }

  // Re-index question IDs 1..10
  return combined.slice(0, 10).map((q, idx) => ({
    ...q,
    questionId: idx + 1
  }));
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
  const quizzes = await generateQuizWithGemini(quizPrompt, dateString);

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

async function generateQuizForSummary(dateString, summary = '') {
  const quizPrompt = `
Generate exactly 10 high-yield, exam-standard Multiple Choice Questions (MCQs) in Hindi for Daily Current Affairs & GK Quiz (${dateString}):

Summary Context:
${summary || 'National governance, RBI economy, ISRO missions, defense exercises, sports, and appointments.'}

Rules:
1. Exactly 10 questions with questionId 1 to 10.
2. 4 distinct options per question.
3. correctOptionIndex must be an integer (0, 1, 2, or 3).
4. Detailed explanation in Hindi explaining why the answer is correct.
5. Cover: National, Economy, Defense, Sports, Appointments, International, Science.
`;
  return await generateQuizWithGemini(quizPrompt, dateString);
}

module.exports = {
  generateDailyCurrentAffairs,
  generateQuizForSummary,
  generateQuizWithGemini,
  getDefaultEmergencyQuizzes,
  sanitizeCurrentAffairsHtml,
  fetchRawDailyNewsContext
};
