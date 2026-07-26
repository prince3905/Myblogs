/**
 * 100% Authentic Natural Indian SEO & Schema Engine
 * Crafts natural, high-converting Indian Hindi-English titles, meta descriptions, and FAQ schemas
 * matching how millions of Indian candidates search Google daily.
 */

const CATEGORY_EMOJIS = {
  'Sarkari Jobs & Exams': '💼',
  'Health & Wellness': '🏥',
  'Tech & Tutorials': '⚡',
  'AI & Web Tools': '🤖',
  'News & Trends': '🔥',
  'Finance & Business': '💰',
  'default': '📌'
};

const NATURAL_INDIAN_HOOKS = [
  ': जानिए कैसे डाउनलोड करें (Direct Link)',
  ': डायरेक्ट लिंक व ऑनलाइन फॉर्म यहाँ देखें',
  ': परीक्षा तिथि व हॉल टिकट जारी, तुरंत देखें',
  ': कटऑफ मार्क्स व मेरिट लिस्ट यहाँ चेक करें',
  ': 100% आधिकारिक नोटिफिकेशन व अप्लाई लिंक'
];

/**
 * 1. Crafts a 100% Natural Indian Hinglish SEO Title
 */
function optimizeHighCtrTitle(title = '', category = '') {
  if (!title) return title;

  let clean = title.trim();

  // Strip excessive punctuation or weird tags
  clean = clean.replace(/^(🔥|⚡|💼|🏥|🤖|💰|📌)\s*/, '');
  clean = clean.replace(/\s*\|\s*(Digital Home|Sarkari Result|Inkspire Blog)\s*$/i, '');

  // Add current year naturally if missing
  if (!clean.includes('2026') && !clean.includes('2027')) {
    clean += ' 2026';
  }

  // Inject natural Indian phrase suffix if no bracket/colon exists
  if (!clean.includes(':') && !clean.includes('(') && clean.length < 52) {
    const hook = NATURAL_INDIAN_HOOKS[Math.abs(hashString(clean)) % NATURAL_INDIAN_HOOKS.length];
    clean += hook;
  }

  // Prepend clean category emoji
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.default;
  if (!clean.startsWith(emoji)) {
    clean = `${emoji} ${clean}`;
  }

  return clean.slice(0, 72);
}

/**
 * 2. Synthesizes a 100% Natural Indian Meta Description (120-155 characters)
 */
function optimizeHighCtrMetaDescription(title = '', content = '', focusKeyword = '') {
  const keyword = (focusKeyword || title).replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  let naturalDesc = `${keyword} का आधिकारिक नोटिफिकेशन व डायरेक्ट लिंक जारी हो चुका है। ऑनलाइन फॉर्म भरने की तिथि, पात्रता, आयु सीमा व जरूरी दस्तावेज यहाँ तुरंत चेक करें!`;

  if (naturalDesc.length > 158) {
    naturalDesc = `${keyword}: आधिकारिक नोटिफिकेशन जारी। पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक यहाँ देखें!`;
  }

  return naturalDesc;
}

/**
 * 3. Generates 100% Natural Indian FAQ Schema (Google Accordion)
 */
function generateFaqSchema(title = '', content = '') {
  const cleanTitle = title.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  const questions = [
    {
      q: `${cleanTitle} का आधिकारिक नोटिफिकेशन कैसे देखें?`,
      a: `${cleanTitle} का आधिकारिक नोटिफिकेशन और भर्ती विवरण इस पृष्ठ के महत्वपूर्ण लिंक (Important Links) सेक्शन में दिए गए डायरेक्ट लिंक से चेक कर सकते हैं।`
    },
    {
      q: `ऑनलाइन फॉर्म भरने के लिए कौन-कौन से मुख्य दस्तावेज चाहिए?`,
      a: `आवेदन के लिए 10वीं/12वीं/स्नातक अंकपत्र, पासपोर्ट साइज फोटो, हस्ताक्षर, आधार कार्ड और जाति/निवास प्रमाण पत्र (यदि लागू हो) होना आवश्यक है।`
    },
    {
      q: `क्या आवेदन शुल्क का भुगतान ऑनलाइन माध्यम से किया जा सकता है?`,
      a: `जी हाँ, आप यूपीआई (UPI), नेट बैंकिंग, क्रेडिट कार्ड या डेबिट कार्ड से ऑनलाइन आवेदन शुल्क जमा कर सकते हैं।`
    },
    {
      q: `डायरेक्ट ऑनलाइन अप्लाई लिंक कहाँ मिलेगा?`,
      a: `इस लेख के अंत में 'Important Direct Links' तालिका दी गई है, जहाँ से आप सीधे ऑफिशियल पोर्टल पर जाकर ऑनलाइन आवेदन कर सकते हैं।`
    }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

module.exports = {
  optimizeHighCtrTitle,
  optimizeHighCtrMetaDescription,
  generateFaqSchema
};
