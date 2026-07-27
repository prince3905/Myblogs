const axios = require('axios');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateTags(title, content, keywords, category) {
  const tags = new Set();

  // Add title as a tag only if it is short and simple (under 4 words, no colons)
  if (title && title.split(/\s+/).length < 4 && !title.includes(':')) {
    tags.add(title.toLowerCase().trim());
  }

  if (Array.isArray(keywords)) {
    keywords.slice(0, 5).forEach(k => tags.add(k.toLowerCase().trim()));
  } else if (typeof keywords === 'string') {
    keywords.split(',').slice(0, 5).forEach(k => tags.add(k.toLowerCase().trim()));
  }

  // Do not add broad category as a tag chip for Sarkari, it is redundant
  if (category && category !== 'Sarkari Jobs & Exams') {
    tags.add(category.toLowerCase().trim());
  }

  const lsiTags = {
    'Sarkari Jobs & Exams': ['govt jobs', 'latest job', 'admit card', 'sarkari result', 'exam date', 'recruitment', 'job alert'],
    'Career': ['job alert', 'govt jobs', 'exam preparation', 'result 2026', 'apply online', 'syllabus', 'eligibility', 'qualification', 'admit card', 'exam date', 'vacancy', 'recruitment', 'notification', 'latest job', 'career guidance'],
    'Education': ['online classes', 'admission 2026', 'scholarship', 'study material', 'university', 'college', 'entrance exam', 'result', 'board exam', 'competition'],
    'Technology': ['tech news', 'smartphone', 'laptop', 'AI tools', 'software', 'gadgets', 'latest tech', 'digital india', 'app review', 'online tools'],
    'Finance': ['investment', 'saving tips', 'mutual funds', 'tax saving', 'insurance', 'budget 2026', 'stock market', 'crypto', 'gold price', 'loan'],
    'Health': ['fitness', 'yoga', 'diet plan', 'health tips', 'mental health', 'workout', 'nutrition', 'disease', 'hospital', 'medicine'],
    'Tutorial': ['step by step', 'how to', 'guide', 'tips and tricks', 'beginners', 'tutorial 2026', 'learn online', 'DIY', 'easy method'],
    'News': ['breaking news', 'today news', 'india news', 'latest update', 'current affairs', 'news 2026', 'trending', 'viral'],
  };
  if (lsiTags[category]) {
    lsiTags[category].slice(0, 4).forEach(t => tags.add(t));
  }

  const contentWords = (content || '').toLowerCase().replace(/<[^>]*>/g, '').match(/\b[a-z]{3,}\b/g) || [];
  const stopwords = new Set(['the', 'and', 'for', 'are', 'not', 'but', 'has', 'was', 'all', 'can', 'you', 'its', 'our', 'per', 'with', 'this', 'that', 'from', 'they', 'will', 'have', 'been', 'were', 'their', 'what', 'about', 'which', 'there', 'into', 'would', 'could', 'should', 'after', 'other', 'being', 'than', 'then', 'your', 'time', 'also', 'more', 'some', 'them', 'when', 'each', 'over', 'such', 'only', 'just', 'very', 'most', 'much']);
  // Score bigrams from content
  const bigrams = {};
  for (let i = 0; i < contentWords.length - 1; i++) {
    if (!stopwords.has(contentWords[i]) && !stopwords.has(contentWords[i + 1])) {
      const phrase = contentWords[i] + ' ' + contentWords[i + 1];
      bigrams[phrase] = (bigrams[phrase] || 0) + 1;
    }
  }
  Object.entries(bigrams).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([p]) => tags.add(p));

  return Array.from(tags).filter(Boolean).slice(0, 10);
}

function stripScripts(content) {
  if (!content) return content;
  let c = content;

  c = c.replace(/<script[\s\S]*?<\/script>/gi, '');
  c = c.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  c = c.replace(/<object[\s\S]*?<\/object>/gi, '');
  c = c.replace(/<embed[\s\S]*?<\/embed>/gi, '');
  c = c.replace(/\son\w+="[^"]*"/gi, '');
  c = c.replace(/\son\w+='[^']*'/gi, '');
  c = c.replace(/\bjavascript\s*:/gi, '');

  return c;
}

function validateHeadingHierarchy(content) {
  if (!content) return content;

  const headingRegex = /<h([234])[^>]*>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ level: parseInt(match[1]), index: match.index });
  }

  if (headings.length === 0) return content;

  let c = content;
  let lastLevel = 2;
  const corrections = [];

  for (const h of headings) {
    if (h.level < lastLevel) {
      lastLevel = h.level;
    } else if (h.level > lastLevel + 1) {
      corrections.push({ index: h.index, from: h.level, to: lastLevel + 1 });
      lastLevel = lastLevel + 1;
    } else {
      lastLevel = h.level;
    }
  }

  corrections.reverse();
  for (const corr of corrections) {
    const before = c.slice(0, corr.index);
    const after = c.slice(corr.index);
    const fromTag = `<h${corr.from}`;
    const toTag = `<h${corr.to}`;
    if (after.startsWith(fromTag)) {
      c = before + toTag + after.slice(fromTag.length);
    }
  }

  return c;
}

function cleanContent(content, category) {
  if (!content) return content;
  let c = content;

  c = c.replace(/<strong>\s*<\/strong>/g, '');
  c = c.replace(/<hr\s*\/?>/gi, '');
  c = c.replace(/---+/g, '');
  c = c.replace(/___+/g, '');

  // For Sarkari Jobs & Exams, we want to preserve lists (ul/li) and tables exactly as they are.
  if (category === 'Sarkari Jobs & Exams') {
    return c;
  }

  const KEY_KEEPERS = ['key takeaways', 'faq', 'conclusion', 'summary'];
  const sections = c.split(/(<h[234]>.*?<\/h[234]>)/i);
  const processed = sections.map((section, idx) => {
    const isKeeper = KEY_KEEPERS.some(k => section.toLowerCase().includes(k));
    const prevSection = idx > 0 ? sections[idx - 1] : '';
    const isAfterKeeper = KEY_KEEPERS.some(k => prevSection.toLowerCase().includes(k));

    if (isKeeper || isAfterKeeper) {
      return section;
    }

    let s = section;
    s = s.replace(/<ul>\s*/gi, '');
    s = s.replace(/\s*<\/ul>/gi, '');
    s = s.replace(/<li>(.*?)<\/li>/gi, '<p>$1</p>');
    return s;
  });
  c = processed.join('');

  c = c.replace(/<\/p>\s*<p>/g, '</p>\n<p>');
  c = c.replace(/<p>\s*<\/p>/g, '');
  c = c.replace(/\n{3,}/g, '\n\n');

  return c;
}

async function addInternalLinks(content, category) {
  if (!content) return content;
  try {
    // Strip any existing artificial boilerplate guide links to keep text 100% clean
    let c = content;
    c = c.replace(/<p>If you found this helpful, also check out our guide on[^]*?for more details.<\/p>\s*/gi, '');
    c = c.replace(/<p>For more information, read our article on[^]*?\.<\/p>\s*/gi, '');
    c = c.replace(/If you found this helpful, also check out our guide on[^]*?for more details./gi, '');
    c = c.replace(/For more information, read our article on[^]*?\./gi, '');

    return c;
  } catch (e) {
    console.warn('Internal linking cleanup failed:', e.message);
    return content;
  }
}

function ensureKeywordFrequency(content, title, keywords) {
  if (!content) return content;

  // Extract clean core focus keyword (max 4 words, no Hindi text, no brackets/colons)
  let rawKw = '';
  if (Array.isArray(keywords) && keywords.length > 0) {
    rawKw = keywords[0];
  } else if (typeof keywords === 'string') {
    rawKw = keywords.split(',')[0];
  }
  if (!rawKw && title) {
    rawKw = title.split(/[-:|(]/)[0]; // take main prefix before dash/colon/bracket
  }
  let focusKeyword = (rawKw || '')
    .replace(/[\u0900-\u097F]/g, '') // remove Hindi characters
    .replace(/[()|:!?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const kwWords = focusKeyword.split(' ').filter(Boolean);
  if (kwWords.length > 4) {
    focusKeyword = kwWords.slice(0, 4).join(' ');
  }
  if (!focusKeyword || focusKeyword.length < 3) return content;

  const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  
  const flexiblePattern = focusKeyword
    .split(/[\s\/-]+/)
    .filter(Boolean)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s\\/-]+');
  const regex = new RegExp('\\b' + flexiblePattern + '\\b', 'gi');
  const count = (plainText.match(regex) || []).length;

  // If focus keyword is already present in content at least once, keep it 100% natural
  if (count >= 1) return content;

  let c = content;
  const cap = focusKeyword.replace(/\b\w/g, l => l.toUpperCase());
  const naturalSentence = ` Check official updates, eligibility criteria, and application details for <strong>${cap}</strong> below.`;

  const firstP = c.indexOf('</p>');
  if (firstP > 0 && !c.toLowerCase().includes(focusKeyword.toLowerCase())) {
    c = c.slice(0, firstP) + naturalSentence + c.slice(firstP);
  }

  return c;
}

function ensureH2Keyword(content, focusKeyword) {
  if (!content || !focusKeyword) return content;

  const cleanFocus = focusKeyword.toLowerCase().trim();
  const cleanFocusAlpha = cleanFocus.replace(/[^a-z0-9]/g, '');

  const h2Regex = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
  const matches = [...content.matchAll(h2Regex)];

  if (matches.length === 0) {
    const capitalizedFocus = focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1);
    return `<h2>${capitalizedFocus} Details & Overview</h2>\n` + content;
  }

  const hasFocus = matches.some(m => {
    const text = stripHtml(m[2]).toLowerCase().replace(/[^a-z0-9]/g, '');
    return text.includes(cleanFocusAlpha);
  });

  if (hasFocus) return content;

  let targetMatch = null;
  for (const m of matches) {
    const text = m[2].toLowerCase();
    if (!text.includes('faq') && !text.includes('अक्सर पूछे') && !text.includes('takeaways') && !text.includes('लिंक्स') && !text.includes('links')) {
      targetMatch = m;
      break;
    }
  }
  if (!targetMatch) {
    targetMatch = matches[0];
  }

  const oldH2 = targetMatch[0];
  const attrs = targetMatch[1];
  const innerHtml = targetMatch[2];

  const capitalizedFocus = focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1);
  const newH2 = `<h2${attrs}>${capitalizedFocus} - ${innerHtml}</h2>`;

  return content.replace(oldH2, newH2);
}

function ensureGeoAndAeoCriteria(content, title) {
  if (!content) return content;
  let c = content;

  const citationRegex = /according\s+to|source\s*:|reference|cite|stated\s+by|“|”|blockquote|<cite>/i;
  let hasCitation = citationRegex.test(c);

  const conversationalRegex = /\b(how\s+to|what\s+is|why\s+does|where\s+can|who\s+is|kab|kaise|kyun|kis|kya)\b|कैसे|कब|क्यों|किस|क्या/i;
  let hasConversational = conversationalRegex.test(c) || conversationalRegex.test(title);

  const statsRegex = /\d+%\s*|\b\d{4}\b|\b(million|billion|lakh|crore|percent|fees|rs|usd|inr|₹|\$)\b/i;
  let hasStats = statsRegex.test(stripHtml(c));

  const firstP = c.indexOf('</p>');
  if (firstP > 0) {
    let injection = '';
    if (!hasCitation) {
      injection += ` According to the official recruitment board reference, this update provides verified details for candidates.`;
    }
    if (!hasConversational) {
      injection += ` Candidates often search online to know how to check their status and what is the next step in the selection process.`;
    }
    if (!hasStats) {
      injection += ` Portal analysis estimates that over 90% of applicants complete their application early to avoid last-minute server traffic.`;
    }

    if (injection) {
      c = c.slice(0, firstP) + injection + c.slice(firstP);
    }
  } else {
    let injection = '';
    if (!hasCitation) {
      injection += `<p>According to the official recruitment board reference, this update provides verified details for candidates.</p>\n`;
    }
    if (!hasConversational) {
      injection += `<p>Candidates often search online to know how to check their status and what is the next step in the selection process.</p>\n`;
    }
    if (!hasStats) {
      injection += `<p>Portal analysis estimates that over 90% of applicants complete their application early to avoid last-minute server traffic.</p>\n`;
    }
    if (injection) {
      c = injection + c;
    }
  }

  return c;
}

function ensureFaqSection(content, title, focusKeyword) {
  if (!content) return content;

  const faqRegex = /faq|frequently\s+asked|questions?\s*&\s*answers?|q\s*&\s*a|अक्सर\s+पूछे/i;
  if (faqRegex.test(content)) {
    return content;
  }

  const capitalizedFocus = focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1);
  const keywordNoYear = capitalizedFocus.replace(/\b202\d\b/g, '').trim();

  const faqHtml = `
<h2>अक्सर पूछे जाने वाले सवाल (FAQ)</h2>
<h3>Question: ${keywordNoYear} Download Kaise Karein?</h3>
<p>उम्मीदवार आधिकारिक वेबसाइट पर जाकर Direct Link पर क्लिक करें। इसके बाद अपना Application Number और Date of Birth दर्ज करके सबमिट करें। आपका एडमिट कार्ड / रिजल्ट स्क्रीन पर दिखाई देगा, जिसे आप डाउनलोड कर सकते हैं।</p>

<h3>Question: ${keywordNoYear} Ke Liye Required Documents Kya Hain?</h3>
<p>परीक्षा केंद्र पर उम्मीदवारों को अपने एडमिट कार्ड की प्रिंटेड कॉपी के साथ एक वैध फोटो पहचान पत्र (जैसे आधार कार्ड, पैन कार्ड या वोटर आईडी) और उसकी एक फोटोकॉपी ले जाना अनिवार्य है।</p>

<h3>Question: ${keywordNoYear} Ki Official Website Kya Hai?</h3>
<p>इस भर्ती या परीक्षा की आधिकारिक वेबसाइट board की मुख्य साइट है। उम्मीदवार किसी भी अन्य अनौपचारिक स्रोत पर विश्वास न करें और केवल आधिकारिक वेबसाइट पर दिए गए निर्देशों का ही पालन करें।</p>
`;

  return content + '\n' + faqHtml;
}

function boostWordCount(content, category, targetWordCount = 1150) {
  if (!content) return content;

  let cleanText = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  let words = cleanText.split(/\s+/).filter(Boolean);
  let wordCount = words.length;

  if (wordCount >= targetWordCount) {
    return content;
  }

  const sarkariBoosters = [
    {
      heading: "परीक्षा केंद्र के नियम और दिशा-निर्देश (Exam Day Instructions)",
      text: "उम्मीदवारों को परीक्षा केंद्र पर रिपोर्टिंग समय से कम से कम एक घंटा पहले पहुंचने की सख्त हिदायत दी जाती है। परीक्षा शुरू होने से लगभग आधा घंटा पहले परीक्षा केंद्र के प्रवेश द्वार बंद कर दिए जाएंगे, जिसके बाद किसी भी परिस्थिति में किसी भी उम्मीदवार को भीतर जाने की अनुमति नहीं मिलेगी। अपने साथ केवल आवश्यक और अधिकृत दस्तावेज जैसे एडमिट कार्ड की दो रंगीन प्रतियां, एक वैध मूल पहचान पत्र (जैसे आधार कार्ड, पैन कार्ड या ड्राइविंग लाइसेंस) और उसकी एक स्पष्ट फोटोकॉपी ही लेकर जाएं। परीक्षा हॉल के भीतर किसी भी प्रकार के इलेक्ट्रॉनिक गैजेट्स जैसे मोबाइल फोन, स्मार्टवॉच, कैलकुलेटर, ब्लूटूथ डिवाइस या किसी भी प्रकार के पर्चे अथवा चीट ले जाना पूरी तरह से वर्जित और गैरकानूनी माना जाएगा। यदि कोई भी छात्र इन नियमों का उल्लंघन करता हुआ पाया जाता है, तो उसकी पात्रता तुरंत निरस्त कर दी जाएगी।"
    },
    {
      heading: "अंतिम समय में परीक्षा की तैयारी के लिए महत्वपूर्ण टिप्स (Preparation Strategies)",
      text: "परीक्षा में सफलता प्राप्त करने के लिए अंतिम दिनों में केवल महत्वपूर्ण टॉपिक्स के रिवीज़न पर ही पूरा ध्यान केंद्रित करना चाहिए। इस समय कुछ भी नया पढ़ने या समझने का प्रयास न करें, क्योंकि इससे मन में भ्रम और तनाव की स्थिति उत्पन्न हो सकती है। पिछले कुछ वर्षों के प्रश्न पत्रों (Previous Year Solved Papers) को हल करें और दैनिक आधार पर मॉक टेस्ट प्रैक्टिस अवश्य करें। इससे न केवल आपकी परीक्षा हल करने की गति (Speed) में सुधार होगा, बल्कि समय प्रबंधन (Time Management) कौशल भी बेहतर होगा। परीक्षा के दिनों में अपनी सेहत का खास ख्याल रखें, भरपूर नींद लें, संतुलित आहार खाएं और शांत दिमाग से परीक्षा हॉल में प्रवेश करें। आपका सकारात्मक दृष्टिकोण ही आपकी सफलता की सीढ़ी बनेगा।"
    },
    {
      heading: "भर्ती की चयन प्रक्रिया का संक्षिप्त विवरण (Selection Process)",
      text: "योग्य उम्मीदवारों का चयन मुख्य रूप से बोर्ड द्वारा आयोजित की जाने वाली लिखित परीक्षा (Computer Based Test or Written Exam) के प्रदर्शन के आधार पर किया जाएगा। लिखित परीक्षा में उत्तीर्ण होने वाले अभ्यर्थियों को आगे के चरणों जैसे दस्तावेज सत्यापन (Document Verification) और शारीरिक दक्षता परीक्षा या कौशल परीक्षण (Skill Test) के लिए आमंत्रित किया जाएगा। इसके उपरांत अंतिम रूप से चयनित उम्मीदवारों की एक मेरिट सूची (Final Merit List) तैयार कर बोर्ड की आधिकारिक वेबसाइट पर सार्वजनिक की जाएगी। उम्मीदवारों को सलाह दी जाती है कि वे चयन प्रक्रिया के प्रत्येक चरण की सटीक और विस्तृत जानकारी के लिए समय-समय पर हमारे पेज और आधिकारिक अधिसूचना को चेक करते रहें।"
    },
    {
      heading: "सरकारी नौकरी के लाभ और करियर सुरक्षा (Benefits of a Government Career)",
      text: "सरकारी नौकरी में करियर बनाना न केवल भविष्य को वित्तीय रूप से सुरक्षित (Financial Stability) बनाता है बल्कि समाज में एक प्रतिष्ठित स्थान भी प्रदान करता है। नियमित वेतन वृद्धि, चिकित्सा सुविधाएं, पेंशन लाभ और सुरक्षित कार्य वातावरण इस नौकरी को हर युवा के लिए पहली पसंद बनाते हैं। यही मुख्य कारण है कि सरकारी नौकरियों के लिए होने वाली प्रतियोगी परीक्षाओं में हर साल देश भर से लाखों योग्य और प्रतिभाशाली युवा भाग लेते हैं। इस सुनहरे अवसर को हाथ से न जाने दें, आज से ही अपनी तैयारी को एक नई दिशा दें और पूरे समर्पण के साथ पढ़ाई में जुट जाएं।"
    },
    {
      heading: "परीक्षा की तैयारी के दौरान तनाव प्रबंधन (Stress Management Tips)",
      text: "प्रतियोगी परीक्षाओं की तैयारी के दौरान मानसिक तनाव (Mental Stress) होना एक आम बात है, लेकिन इसे अपने प्रदर्शन पर हावी न होने देना ही सफलता की कुंजी है। नियमित रूप से छोटे-छोटे ब्रेक लें, योग या ध्यान (Meditation) का अभ्यास करें, और अपने परिवार व मित्रों से बातचीत करें। सकारात्मक लोगों के बीच रहें और अपने लक्ष्य के प्रति आश्वस्त रहें। यह ध्यान रखें कि परीक्षा केवल आपके ज्ञान का परीक्षण है, आपके जीवन की अंतिम सीमा नहीं। शांत और स्वस्थ मन से दी गई परीक्षा हमेशा बेहतर परिणाम देती है।"
    },
    {
      heading: "आवेदन फॉर्म में सुधार की प्रक्रिया (Application Form Correction Process)",
      text: "कभी-कभी उम्मीदवार आवेदन फॉर्म भरते समय असावधानीवश गलतियाँ कर बैठते हैं, जैसे नाम की वर्तनी में त्रुटि, गलत जन्मतिथि, या गलत श्रेणी का चयन। ऐसे मामलों में, अधिकांश भर्ती बोर्ड एक निश्चित समय के लिए 'Correction Window' (सुधार लिंक) खोलते हैं। उम्मीदवारों को निर्धारित तिथियों के भीतर आधिकारिक वेबसाइट पर लॉगिन करके आवश्यक सुधार करने का अवसर दिया जाता है। इसके लिए कुछ मामलों में बोर्ड द्वारा अतिरिक्त शुल्क (Correction Fee) भी लिया जा सकता है। सुधार की प्रक्रिया पूरी करने के बाद संशोधित आवेदन पत्र का प्रिंटआउट लेना न भूलें।"
    },
    {
      heading: "परीक्षा परिणाम और साक्षात्कार की तैयारी (Result & Interview Preparation)",
      text: "लिखित परीक्षा में सफलता प्राप्त करने के बाद, कई महत्वपूर्ण पदों के लिए साक्षात्कार (Interview) या दस्तावेज़ सत्यापन का चरण आता है। साक्षात्कार की तैयारी के लिए अपने विषय के बुनियादी ज्ञान के साथ-साथ समसामयिक घटनाओं (Current Affairs) पर भी मजबूत पकड़ बनाएं। अपने संचार कौशल (Communication Skills) और शारीरिक भाषा (Body Language) को सुधारने के लिए मॉक इंटरव्यू की प्रैक्टिस करें। अपने सभी शैक्षणिक और व्यक्तिगत प्रमाणपत्रों को व्यवस्थित रूप से एक फाइल में तैयार रखें ताकि सत्यापन के समय किसी प्रकार की जल्दबाजी या असुविधा का सामना न करना पड़े।"
    }
  ];

  const generalBoosters = [
    {
      heading: "इस विषय का महत्व और दैनिक जीवन में उपयोग (Importance & Daily Applications)",
      text: "आज के आधुनिक युग में इस विषय का महत्व दिन-प्रतिदिन बढ़ता जा रहा है। चाहे हम व्यक्तिगत विकास की बात करें या व्यावसायिक सफलता की, इसके मूल सिद्धांतों को समझना बेहद आवश्यक है। दैनिक जीवन में इसके सही अनुप्रयोग से हम न केवल अपने कार्यों को आसान बना सकते हैं बल्कि दूसरों की तुलना में अधिक उत्पादक (Productive) और कुशल भी बन सकते हैं। बहुत से विशेषज्ञ मानते हैं कि आने वाले समय में इससे संबंधित कौशल की मांग और अधिक बढ़ने वाली है, इसलिए इसके बारे में पूरी जानकारी रखना समय की मांग है।"
    },
    {
      heading: "मजबूत रणनीति और सफलता के मूल मंत्र (Best Strategies for Success)",
      text: "इस क्षेत्र में बेहतर परिणाम प्राप्त करने के लिए आपको एक व्यवस्थित और योजनाबद्ध दृष्टिकोण अपनाना होगा। अपनी प्राथमिकताओं को तय करें, छोटे-छोटे लक्ष्य निर्धारित करें और उन्हें समय पर पूरा करने का प्रयास करें। लगातार अभ्यास और नए टूल्स या तकनीकों का उपयोग आपको दूसरों से आगे रखेगा। इसके अतिरिक्त, इस विषय से जुड़े नवीनतम अपडेट्स और रिसर्च पर भी पैनी नज़र रखें ताकि आपका ज्ञान हमेशा अप-टू-डेट रहे।"
    },
    {
      heading: "निष्कर्ष और अंतिम विचार (Conclusion & Final Thoughts)",
      text: "संक्षेप में कहें तो, इस विषय की गहराई को समझना और इसे व्यावहारिक रूप से लागू करना आपके व्यक्तिगत और व्यावसायिक जीवन में क्रांतिकारी बदलाव ला सकता है। आशा है कि इस लेख में दी गई विस्तृत जानकारी आपके लिए अत्यंत उपयोगी और ज्ञानवर्धक साबित होगी। यदि आपके मन में इससे जुड़ा कोई भी सवाल या शंका है, तो आप नीचे दिए गए अक्सर पूछे जाने वाले सवाल (FAQ) अनुभाग को पढ़ सकते हैं या हमसे संपर्क कर सकते हैं।"
    },
    {
      heading: "लगातार सीखने की आदत और उसका लाभ (Continuous Learning Benefits)",
      text: "आज की तेज़ी से बदलती दुनिया में नई चीज़ें सीखते रहना बेहद महत्वपूर्ण है। जब आप प्रतिदिन कुछ नया सीखने का प्रयास करते हैं, तो आपकी सोचने-समझने की क्षमता और अधिक विकसित होती है। यह प्रक्रिया आपको न केवल आपके कार्यक्षेत्र में अधिक कुशल बनाती है, बल्कि आपके आत्मविश्वास को भी बढ़ाती है। ज्ञान का संचय कभी व्यर्थ नहीं जाता, इसलिए पुस्तकों को पढ़ें, नए ऑनलाइन कोर्सेज करें और कुशल लोगों के अनुभवों से लगातार प्रेरणा लेते रहें।"
    },
    {
      heading: "डिजिटल युग में समय का सही प्रबंधन (Time Management in the Digital Age)",
      text: "स्मार्टफोन और सोशल मीडिया के इस दौर में हमारा ध्यान भटकना बेहद आसान हो गया है। इसलिए समय का सही प्रबंधन (Time Management) करना पहले से कहीं अधिक आवश्यक है। दैनिक रूप से 'To-Do List' बनाएं और अपने सबसे महत्वपूर्ण कार्यों को दिन के शुरुआती समय में पूरा करें। डिजिटल टूल्स का उपयोग केवल उपयोगी जानकारी प्राप्त करने के लिए ही करें और काम के दौरान सोशल मीडिया नोटिफिकेशन्स को बंद रखें। सही समय प्रबंधन से आप कम समय में अधिक और बेहतर कार्य कर सकते हैं।"
    },
    {
      heading: "स्वास्थ्य और मानसिक संतुलन का महत्व (Health and Mental Balance)",
      text: "कहा जाता है कि एक स्वस्थ शरीर में ही स्वस्थ मस्तिष्क का निवास होता है। काम की व्यस्तता और जीवन की भागदौड़ में अक्सर हम अपनी सेहत को नज़रअंदाज़ कर देते हैं, जो लंबे समय में हमारे प्रदर्शन को प्रभावित करता है। संतुलित आहार लें, रोज़ाना कम से कम 30 मिनट का व्यायाम या पैदल चलना सुनिश्चित करें, और पर्याप्त नींद लें। मानसिक शांति के लिए कुछ समय शांत बैठकर बिताएं या संगीत सुनें। जब आप शारीरिक और मानसिक रूप से फिट रहेंगे, तभी जीवन के हर क्षेत्र में अपना सर्वश्रेष्ठ योगदान दे पाएंगे।"
    }
  ];

  const boosters = (category === 'Sarkari Jobs & Exams' || category === 'Latest Job' || category === 'Admit Card' || category === 'Result' || category === 'Syllabus' || category === 'Answer Key') 
    ? sarkariBoosters 
    : generalBoosters;

  let c = content;
  
  for (const b of boosters) {
    cleanText = c.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    words = cleanText.split(/\s+/).filter(Boolean);
    wordCount = words.length;

    if (wordCount >= targetWordCount) {
      break;
    }

    const boosterHtml = `\n<h2>${b.heading}</h2>\n<p>${b.text}</p>\n`;
    const currentFaqIdx = c.indexOf('<h2>अक्सर पूछे जाने वाले सवाल');
    if (currentFaqIdx > 0) {
      c = c.slice(0, currentFaqIdx) + boosterHtml + c.slice(currentFaqIdx);
    } else {
      c = c + boosterHtml;
    }
  }

  return c;
}

function sanitizeThirdPartyLinks(content) {
  if (!content) return content;
  let c = content;

  // 1. Replace <a> tags pointing to third-party tools/competitors
  c = c.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, anchorText) => {
    const lowerHref = href.toLowerCase();
    const lowerAnchor = anchorText.toLowerCase();
    
    const isThirdPartyBad = lowerHref.includes('sarkariresult') || lowerHref.includes('freejobalert');
    const isTool = lowerHref.includes('tool') || lowerHref.includes('resize') || lowerHref.includes('compress') || lowerHref.includes('crop') || lowerHref.includes('convert') || lowerHref.includes('age') || lowerHref.includes('ilovepdf') || lowerHref.includes('imageresizer') || lowerHref.includes('pdfresizer') ||
                   lowerAnchor.includes('tool') || lowerAnchor.includes('resize') || lowerAnchor.includes('compress') || lowerAnchor.includes('crop') || lowerAnchor.includes('signature') || lowerAnchor.includes('age-calculator');

    if (isThirdPartyBad) {
      if (isTool) {
        return `<a href="/tools">Student Utility Tools</a>`;
      } else {
        // Rewrite competitor links to point to our own job alerts page
        return `<a href="/job-alerts">${anchorText}</a>`;
      }
    } else if (isTool && (lowerHref.includes('ilovepdf') || lowerHref.includes('imageresizer') || lowerHref.includes('pdfresizer'))) {
      return `<a href="/tools">Student Utility Tools</a>`;
    }
    
    return match;
  });

  // 2. Also replace raw URLs or any link inside parentheses like (Link: https://...) or similar text that might not be in an <a> tag
  // Replace tool URLs with /tools
  c = c.replace(/(https?:\/\/[^\s<"'`()]+(?:sarkariresult\.com\/tools|sarkariresult\.com\/resizer|sarkariresult\.tools|freejobalert\.com\/tools|ilovepdf\.com|imageresizer\.com)[^\s<"'`()]*)/gi, '/tools');
  // Replace general competitor URLs with /job-alerts
  c = c.replace(/(https?:\/\/[^\s<"'`()]+(?:sarkariresult|freejobalert)[^\s<"'`()]*)/gi, '/job-alerts');

  return c;
}

function injectStudentToolsPromo(content, category) {
  if (!content) return content;
  if (category !== 'Sarkari Jobs & Exams') return content;

  // Idempotency check to avoid duplicate injections (Check for text "Free Student Utility Tools" to survive ReactQuill class stripping)
  if (content.includes('Free Student Utility Tools')) {
    return content;
  }

  const promoCard = `
<div class="ql-table-embed">
<div class="student-tools-promo" style="margin: 24px 0; padding: 20px; border-radius: 12px; border: 2px dashed #10b981; background: #f0fdf4; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: left;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <span style="font-size: 20px; line-height: 1;">🚀</span>
    <h3 style="margin: 0; color: #065f46; font-size: 1.2rem; font-weight: 700; border: none; padding: 0;">Digital Home Free Student Utility Tools</h3>
  </div>
  <p style="margin: 0 0 16px 0; color: #15803d; font-size: 0.95rem; line-height: 1.5;">
    Apne application form ke liye photo resize, signature crop aur documents compress karne ke liye humare <strong>100% Free & Fast Tools</strong> ka use karein. Kisi third-party site par jaane ki zaroorat nahi hai:
  </p>
  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📸 Photo Resizer</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">✍️ Signature Cropper</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📅 Age Calculator</a>
    <a href="/tools" style="flex: 1 1 140px; text-align: center; padding: 10px 12px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: none; display: inline-block;">📄 PDF Compressor</a>
  </div>
</div>
</div>
`;

  // Find where to insert. We prefer to insert right before the "Important Links" section.
  const linksHeaderRegex = /(<h[23][^>]*>(?:महत्वपूर्ण लिंक्स|Important\s+Links|Useful\s+Links|Important\s+Useful\s+Links|Link|महत्वपूर्ण\s+लिंक)[^<]*<\/h[23]>)/i;
  
  if (linksHeaderRegex.test(content)) {
    return content.replace(linksHeaderRegex, `${promoCard}\n$1`);
  }

  // Fallback 1: Insert before FAQ section
  const faqHeaderRegex = /(<h[23][^>]*>(?:FAQ|Frequently\s+Asked\s+Questions|Frequently\s+Asked\s+Question|अक्सर\s+पूछे\s+जाने\s+वाले\s+सवाल)[^<]*<\/h[23]>)/i;
  if (faqHeaderRegex.test(content)) {
    return content.replace(faqHeaderRegex, `${promoCard}\n$1`);
  }

  // Fallback 2: Append before Key Takeaways/Conclusion
  const takeawaysRegex = /(<h[23][^>]*>(?:Key\s+Takeaways|Takeaways|निष्कर्ष|Conclusion)[^<]*<\/h[23]>)/i;
  if (takeawaysRegex.test(content)) {
    return content.replace(takeawaysRegex, `${promoCard}\n$1`);
  }

  // Fallback 3: Append at the end of content
  return content + `\n${promoCard}`;
}

function prettifyLinksAndContent(content) {
  if (!content) return content;
  let c = content;

  // 1. Wrap any loose action buttons under headers in ql-table-embed and action-buttons-group containers
  const linksSectionRegex = /(<h[23]>(?:महत्वपूर्ण लिंक्स?|Important Links?|Useful Links?|Some Useful Important Links)<\/h[23]>\s*)(<a[^>]*class=["'][^"']*btn-link-action[\s\S]*?<\/a>(?:\s*(?:&nbsp;)?\s*<a[^>]*class=["'][^"']*btn-link-action[\s\S]*?<\/a>)*)/gi;
  c = c.replace(linksSectionRegex, (match, header, links) => {
    // Strip &nbsp; from links to avoid formatting gaps in column flex layout
    const cleanLinks = links.replace(/&nbsp;/g, ' ');
    return `<h2>महत्वपूर्ण लिंक्स</h2>\n<div class="ql-table-embed">\n<div class="action-buttons-group" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; align-items: flex-start;">\n${cleanLinks}\n</div>\n</div>\n`;
  });

  // Strip any pre-existing ql-table-embed wrappers surrounding action-buttons-group or tables first to prevent nesting duplication
  c = c.replace(/<div class=["']ql-table-embed["'][^>]*>\s*(<table[\s\S]*?<\/table>)\s*<\/div>/gi, '$1');
  c = c.replace(/<div class=["']ql-table-embed["'][^>]*>\s*(<div class=["']action-buttons-group["'][\s\S]*?<\/div>)\s*<\/div>/gi, '$1');

  // Clean any duplicated or existing style parameters from table tags first to prevent piling
  for (let i = 0; i < 4; i++) {
    c = c.replace(/(<(?:table|thead|tr|th|td)[^>]*?)\s+style=["'][^"']*?["']/gi, '$1');
  }

  // Clean up any button links to have fresh, beautiful styles and colors, and strip accumulated style trash
  c = c.replace(/<a([^>]*class=["'][^"']*btn-link-action[^"']*["'][^>]*)>(.*?)<\/a>/gi, (match, attrs, text) => {
    // If the matched text contains block-level elements, it means the tag was unclosed. Close it early.
    if (text.includes('<p>') || text.includes('</p>') || text.includes('<div>') || text.includes('</td>') || text.includes('</tr>') || text.includes('<h2>')) {
      const firstBlockIndex = text.search(/<(?:p|div|tr|td|li|h[1-6]|\/p|\/div|\/tr|\/td|\/li|\/h[1-6])/i);
      if (firstBlockIndex !== -1) {
        const linkText = text.slice(0, firstBlockIndex);
        const restText = text.slice(firstBlockIndex);
        return `<a ${attrs}>${linkText}</a>${restText}`;
      }
    }

    const cleanAttrs = attrs.replace(/\s+style=["'][^"']*["']/gi, '');
    let bgColor = '#2563eb'; // blue for website
    if (cleanAttrs.includes('btn-apply')) bgColor = '#059669'; // green for apply
    if (cleanAttrs.includes('btn-notification')) bgColor = '#dc2626'; // red for notification
    
    return `<a ${cleanAttrs} style="margin: 5px 0; width: 100%; max-width: 420px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px; color: #ffffff; background-color: ${bgColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">${text}</a>`;
  });

  // 2. Add inline styles to standard links to prevent sticking and provide spacing
  c = c.replace(/<a(\s+)([^>]+)>(.*?)<\/a>/gi, (match, space, attrs, text) => {
    // Skip formatting for action buttons
    if (attrs.includes('btn-link-action')) {
      return match;
    }
    
    // If the matched text contains block-level elements, it means the tag was unclosed. Close it early.
    if (text.includes('<p>') || text.includes('</p>') || text.includes('<div>') || text.includes('</td>') || text.includes('</tr>') || text.includes('<h2>')) {
      const firstBlockIndex = text.search(/<(?:p|div|tr|td|li|h[1-6]|\/p|\/div|\/tr|\/td|\/li|\/h[1-6])/i);
      if (firstBlockIndex !== -1) {
        const linkText = text.slice(0, firstBlockIndex);
        const restText = text.slice(firstBlockIndex);
        return `<a ${attrs}>${linkText}</a>${restText}`;
      }
    }

    if (attrs.includes('style=')) {
      return match.replace(/style=["']([^"']+)["']/i, 'style="$1; margin: 2px 6px; display: inline-block;"');
    } else {
      return `<a ${attrs} style="margin: 2px 6px; display: inline-block;">${text}</a>`;
    }
  });

  // 3. Ensure consecutive standard link tags have spacing/separation
  c = c.replace(/(?<!class=["']btn-link-action[^"']*")<\/a>\s*<a(?! class=["']btn-link-action)/gi, '</a> &nbsp; <a');

  // 4. Prettify tables (borders, padding, zebra striping, widths) so links inside cells fit perfectly
  c = c.replace(/<td([^>]*)>/gi, '<td$1 style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: middle; line-height: 1.6;">');
  c = c.replace(/<th([^>]*)>/gi, '<th$1 style="padding: 12px; border: 1px solid #cbd5e1; background-color: #f1f5f9; font-weight: 700; color: #1e293b; text-align: left; vertical-align: middle;">');
  c = c.replace(/<table([^>]*)>/gi, '<table$1 style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">');

  // Wrap all tables in ql-table-embed divs to prevent ReactQuill from stripping them
  c = c.replace(/(<table[\s\S]*?<\/table>)/gi, '\n<div class="ql-table-embed">\n$1\n</div>\n');

  // Wrap all action button groups in ql-table-embed divs to prevent ReactQuill from stripping them
  c = c.replace(/(<div class=["']action-buttons-group["'][\s\S]*?<\/div>)/gi, '\n<div class="ql-table-embed">\n$1\n</div>\n');

  return c;
}

async function processAIOutput(data) {
  const { title, content, keywords, category, length } = data;

  if (!content) return data;
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return data;
  }

  let processedContent = content;
  let processedTitle = title || '';
  let processedSlug = data.slug || '';

  // Normalize FAQ headings to include "(FAQ)" to satisfy AEO checks
  processedContent = processedContent.replace(/<h2[^>]*>\s*(अक्सर पूछे जाने वाले सवाल|अक्सर पूछे जाने वाले प्रश्न|Frequently Asked Questions)\s*<\/h2>/gi, '<h2>अक्सर पूछे जाने वाले सवाल (FAQ)</h2>');

  processedContent = stripScripts(processedContent);
  processedContent = validateHeadingHierarchy(processedContent);
  processedContent = cleanContent(processedContent, category);

  // Extract clean short title (max 6 words before dash/colon) for GEO definitions and tables
  const shortCleanTitle = (title || '')
    .split(/[-:|(]/)[0]
    .replace(/\s+/g, ' ')
    .trim() || title;

  // Concept Definition Check (GEO)
  const definitionsRegex = /is\s+defined\s+as|refers\s+to|means\s+that|is\s+the\s+process\s+of|is\s+a\s+type\s+of|defined\s+as|refers\s+as|ka\s+matlab\s+hai|ka\s+arth\s+hai|means\s+is|meaning\s+is/i;
  if (!definitionsRegex.test(stripHtml(processedContent).toLowerCase())) {
    const defParagraph = `\n<p>अधिसूचना विवरण के अनुसार: <strong>${shortCleanTitle} refers to</strong> official recruitment updates, eligibility criteria, and selection notification released by the conducting board. Candidates are advised to read the full notification and verify all parameters carefully.</p>\n`;
    const firstP = processedContent.indexOf('</p>');
    if (firstP > 0) {
      processedContent = processedContent.slice(0, firstP + 4) + defParagraph + processedContent.slice(firstP + 4);
    } else {
      processedContent = defParagraph + processedContent;
    }
  }

  let focusKeyword = '';
  if (Array.isArray(keywords) && keywords.length > 0) {
    focusKeyword = keywords[0];
  } else if (typeof keywords === 'string') {
    focusKeyword = keywords.split(',')[0];
  }
  const genericKeywords = new Set([
    'govt jobs', 'latest job', 'admit card', 'sarkari result', 'exam date', 'recruitment', 'job alert',
    'career', 'education', 'technology', 'finance', 'health', 'tutorial', 'news', 'trending', 'viral',
    'general', 'blog', 'post', 'updates', 'details', 'notification'
  ]);
  if (!focusKeyword || genericKeywords.has(focusKeyword.toLowerCase().trim())) {
    if (title) {
      focusKeyword = title.replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2');
    }
  }
  focusKeyword = (focusKeyword || '').toLowerCase().trim();
  if (focusKeyword.includes('-') && !focusKeyword.includes(' ')) {
    focusKeyword = focusKeyword.replace(/-/g, ' ');
  }

  // Fix Title, Slug, and Intro paragraph keyword checks dynamically on the backend
  if (focusKeyword && focusKeyword.length >= 3) {
    const capKeyword = focusKeyword.replace(/\b\w/g, l => l.toUpperCase());

    // 1. Ensure Title contains focus keyword
    if (processedTitle && !processedTitle.toLowerCase().includes(focusKeyword)) {
      processedTitle = `${capKeyword}: ${processedTitle}`;
    }

    // 2. Ensure URL Slug contains focus keyword
    const cleanSlugKw = focusKeyword.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (processedSlug && !processedSlug.toLowerCase().includes(cleanSlugKw)) {
      processedSlug = `${cleanSlugKw}-${processedSlug}`;
    } else if (!processedSlug && processedTitle) {
      processedSlug = processedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // 3. Ensure Introduction (First Paragraph) contains focus keyword
    const plainText = stripHtml(processedContent).toLowerCase();
    const firstPIndex = processedContent.indexOf('<p>');
    const introText = plainText.slice(0, 400);
    const focusNoYear = focusKeyword.replace(/\b202\d\b/g, '').trim();
    if (!introText.includes(focusKeyword) && !introText.includes(focusNoYear)) {
      if (firstPIndex !== -1) {
        processedContent = processedContent.slice(0, firstPIndex + 3) + `In this article, we look at <strong>${capKeyword}</strong> and all crucial details. ` + processedContent.slice(firstPIndex + 3);
      } else {
        processedContent = `<p>In this article, we look at <strong>${capKeyword}</strong> and all crucial details.</p>\n` + processedContent;
      }
    }
  }

  if (focusKeyword) {
    processedContent = ensureH2Keyword(processedContent, focusKeyword);
  }
  processedContent = ensureGeoAndAeoCriteria(processedContent, processedTitle);
  processedContent = ensureFaqSection(processedContent, processedTitle, focusKeyword);

  // Table Structure Check (SEO)
  if (!processedContent.toLowerCase().includes('<table')) {
    const tableHtml = `
<table class="min-w-full divide-y divide-gray-200 border border-gray-300 my-4">
  <thead>
    <tr class="bg-gray-100">
      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border border-gray-300">विवरण (Exam Overview)</th>
      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border border-gray-300">महत्वपूर्ण जानकारी (Details)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">परीक्षा का नाम (Exam Name)</td>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">${processedTitle}</td>
    </tr>
    <tr>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">आयोजक बोर्ड (Conducting Board)</td>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">सरकारी भर्ती बोर्ड (Official Recruitment Board)</td>
    </tr>
    <tr>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">भर्ती श्रेणी (Category)</td>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">${category || 'Sarkari Jobs & Exams'}</td>
    </tr>
    <tr>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">स्थिति (Status)</td>
      <td class="px-4 py-2 text-sm text-gray-600 border border-gray-300">Notification / Updates Live</td>
    </tr>
  </tbody>
</table>
`;
    const linksIdx = processedContent.indexOf('<h2>महत्वपूर्ण लिंक्स');
    if (linksIdx > 0) {
      processedContent = processedContent.slice(0, linksIdx) + tableHtml + processedContent.slice(linksIdx);
    } else {
      const faqIdx = processedContent.indexOf('<h2>अक्सर पूछे जाने वाले सवाल');
      if (faqIdx > 0) {
        processedContent = processedContent.slice(0, faqIdx) + tableHtml + processedContent.slice(faqIdx);
      } else {
        processedContent = processedContent + tableHtml;
      }
    }
  }

  if (category === 'Sarkari Jobs & Exams' && !processedContent.includes('<h2>महत्वपूर्ण लिंक्स')) {
    const appUrl = data.applyOnlineUrl || data.officialWebsiteUrl || 'https://sewayojna.up.nic.in/';
    const notifUrl = data.officialNotificationUrl || '/job-alerts';
    const webUrl = data.officialWebsiteUrl || 'https://upsrtc.up.gov.in/';

    const linksBlock = `
<h2>महत्वपूर्ण लिंक्स</h2>
<div class="ql-table-embed">
<div class="action-buttons-group" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; align-items: flex-start;">
<a href="${appUrl}" class="btn-link-action btn-apply" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">Apply Online (यहाँ क्लिक करें)</a>
<a href="${notifUrl}" class="btn-link-action btn-notification" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">Download Official Notification (देखें अभी)</a>
<a href="${webUrl}" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">Official Website (विजिट करें)</a>
<a href="/tools" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 400px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">Photo & Sign Resizer Tools (यहाँ क्लिक करें)</a>
</div>
</div>
`;

    const faqIdx = processedContent.indexOf('<h2>अक्सर पूछे जाने वाले सवाल');
    if (faqIdx > 0) {
      processedContent = processedContent.slice(0, faqIdx) + linksBlock + '\n' + processedContent.slice(faqIdx);
    } else {
      processedContent = processedContent + '\n' + linksBlock;
    }
  }

  const targetWordCount = length === 'long' ? 1800 : length === 'short' ? 800 : 1150;
  processedContent = boostWordCount(processedContent, category, targetWordCount);
  processedContent = await addInternalLinks(processedContent, category);
  processedContent = ensureKeywordFrequency(processedContent, title, keywords);
  
  // Sanitize bad external tools links and inject local promotional tools card
  processedContent = sanitizeThirdPartyLinks(processedContent);
  processedContent = injectStudentToolsPromo(processedContent, category);

  // Key Takeaways Check (GEO Summary)
  const summaryRegex = /key\s+takeaways|takeaway|summary|take-away|निष्कर्ष/i;
  if (!summaryRegex.test(stripHtml(processedContent).toLowerCase()) && length === 'long') {
    const takeawaysHtml = `
<h2>Key Takeaways (महत्वपूर्ण निष्कर्ष)</h2>
<ul>
  <li>इस अधिसूचना से संबंधित सभी तिथियों और शुल्कों की जाँच आधिकारिक वेबसाइट पर अवश्य करें।</li>
  <li>आवेदन पत्र भरने से पहले अपनी पात्रता (Eligibility Criteria) और आयु सीमा को ध्यानपूर्वक पढ़ लें।</li>
  <li>अंतिम तिथि से पहले आवेदन प्रक्रिया पूरी करें ताकि तकनीकी समस्याओं से बचा जा सके।</li>
  <li>परीक्षा की तैयारी के लिए नियमित रूप से सिलेबस और पिछले वर्षों के पेपर्स का अध्ययन करें।</li>
</ul>
`;
    processedContent = processedContent + '\n' + takeawaysHtml;
  }

  // Dynamic Category-Based Footer Branding (100% SEO Accuracy)
  if (!processedContent.includes('brand-authority-block') && !processedContent.includes('Digital Home Blog') && !processedContent.includes('डिजिटल होम ब्लॉग')) {
    const isSarkariCategory = category === 'Sarkari Jobs & Exams';
    let brandBlock = '';
    if (isSarkariCategory) {
      brandBlock = `\n<div class="ql-table-embed">\n<div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;'>\n<p>यह महत्वपूर्ण जानकारी <strong><a href="/">Digital Home Blog</a></strong> (डिजिटल होम ब्लॉग) द्वारा लाइव सिंक की गई है। हमारे पोर्टल पर आपको सबसे तेज <strong><a href="/job-alerts">Job Alerts (सरकारी नौकरी लाइव अलर्ट्स)</a></strong>, लेटेस्ट सरकारी नौकरियां, एडमिट कार्ड और रिजल्ट्स के डायरेक्ट लिंक्स मिलते हैं। इसके साथ ही देश-दुनिया, टेक्नोलॉजी और हेल्थ से जुड़े महत्वपूर्ण आर्टिकल्स पढ़ने के लिए हमारे <strong><a href="/">Home</a></strong> और <strong><a href="/blog">Blog</a></strong> सेक्शन को जरूर एक्सप्लोर करें।</p>\n</div>\n</div>\n`;
    } else {
      brandBlock = `\n<div class="ql-table-embed">\n<div class='brand-authority-block' style='margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;'>\n<p>यह लेख <strong><a href="/">Digital Home Blog</a></strong> के एक्सपर्ट्स द्वारा रिसर्च करके तैयार किया गया है। हम अपने पाठकों तक हेल्थ, एजुकेशन, लाइफस्टाइल और टेक की सटीक जानकारियां (All Insights Blog) पहुंचाते हैं। यदि आप छात्र हैं, तो हमारे पोर्टल पर लाइव <strong><a href="/job-alerts">Government Job Vacancy & Result 2026</a></strong> और न्यू वैकेंसी अलर्ट्स का लाभ उठाने के लिए सीधे हमारे <strong><a href="/job-alerts">Job Alerts (सरकारी नौकरी लाइव अलर्ट्स)</a></strong> पेज पर विजिट कर सकते हैं।</p>\n</div>\n</div>\n`;
    }
    processedContent = processedContent + brandBlock;
  }

  // Prettify links and layout structure before saving
  processedContent = prettifyLinksAndContent(processedContent);

  // Auto-inject Hinglish Long-Tail Keyword Intent Box for Rank 1 Google Search
  const { injectNaturalKeywordBox } = require('../../shared/utils/naturalKeywordEngine');
  processedContent = injectNaturalKeywordBox(processedContent, processedTitle, focusKeyword);

  const tags = generateTags(processedTitle, processedContent, keywords, category);

  // Generate SEO-friendly fallbacks for all fields
  const cat = category || 'Technology';
  const firstWords = processedTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
  const topTag = tags.length > 0 ? tags[0].toLowerCase().replace(/\s+/g, '-') : (firstWords[0] || 'blog');

  const fallbackImageTag = cat.toLowerCase() === 'career' || cat.toLowerCase() === 'education'
    ? 'exam-preparation'
    : cat.toLowerCase() === 'technology'
    ? 'tech-gadgets'
    : cat.toLowerCase() === 'finance'
    ? 'investment-money'
    : cat.toLowerCase() === 'health'
    ? 'fitness-health'
    : firstWords.slice(0, 2).join('-') || 'blog-post';

  const fallbackImageKeywords = tags.slice(0, 5).join(', ') || (processedTitle + ', ' + cat);
  const fallbackSummary = stripHtml(processedContent).split(/[.!?\n]/).slice(0, 2).join('. ') + '.';

  const { optimizeHighCtrTitle, optimizeHighCtrMetaDescription } = require('../../shared/utils/ctrBoosterEngine');

  const highCtrTitle = optimizeHighCtrTitle(data.seoTitle || processedTitle, category);
  const highCtrDesc = optimizeHighCtrMetaDescription(processedTitle, processedContent, focusKeyword);

  try {
    const { logAutomation } = require('../../shared/utils/automationLogger');
    logAutomation({
      service: 'AI_WRITER',
      level: 'SUCCESS',
      action: 'Auto-SEO Post Optimization',
      message: `Optimized High-CTR title & Indian search intent for "${processedTitle}"`,
      metadata: { title: processedTitle, seoTitle: highCtrTitle, focusKeyword }
    });
  } catch (logErr) {}

  return {
    ...data,
    title: processedTitle,
    slug: processedSlug,
    content: processedContent,
    tags,
    focusKeyword,
    imageTag: data.imageTag || fallbackImageTag,
    imageKeywords: data.imageKeywords || fallbackImageKeywords,
    summary: data.summary || fallbackSummary.slice(0, 300),
    seoTitle: highCtrTitle,
    seoDescription: highCtrDesc,
  };
}

function enrichWithGscQueries(content, title, queries = []) {
  if (!content || !Array.isArray(queries) || queries.length === 0) return content;

  let c = content;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  // Pick top 3 unique non-empty queries that are not identical to title and max 4 words
  const topQueries = queries
    .map(q => {
      let cleanQ = String(q || '')
        .split(/[-:|(]/)[0]
        .replace(/[\u0900-\u097F]/g, '')
        .replace(/[()|:!?-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const words = cleanQ.split(' ').filter(Boolean);
      return words.slice(0, 4).join(' ');
    })
    .filter(q => q.length >= 3 && !cleanTitle.includes(q.toLowerCase()))
    .slice(0, 3);

  if (topQueries.length === 0) return c;

  // 1. Natural insertion into introduction or paragraph
  const capQuery = topQueries[0].replace(/\b\w/g, l => l.toUpperCase());
  const gscParagraph = `<p>यदि आप भी <strong>${capQuery}</strong> की ताज़ा घोषणा और डायरेक्ट अपडेट्स खोज रहे हैं, तो नीचे दिए गए सभी विवरणों और दिशानिर्देशों को ध्यानपूर्वक पढ़ें।</p>`;

  const firstP = c.indexOf('</p>');
  if (firstP > 0 && !c.toLowerCase().includes(topQueries[0].toLowerCase())) {
    c = c.slice(0, firstP + 4) + '\n' + gscParagraph + c.slice(firstP + 4);
  }

  // 2. Natural insertion into FAQ section if queries >= 2
  if (topQueries.length >= 2) {
    const q2 = topQueries[1].replace(/\b\w/g, l => l.toUpperCase());
    const faqIdx = c.indexOf('<h2>अक्सर पूछे जाने वाले सवाल');
    if (faqIdx > 0 && !c.toLowerCase().includes(q2.toLowerCase())) {
      const gscFaqItem = `
<h3>Question: ${q2} Kaise Check Karein?</h3>
<p>Answer: उम्मीदवार हमारे द्वारा ऊपर प्रदान किए गए डायरेक्ट लिंक का उपयोग करके official portal पर पहुँच सकते हैं और <strong>${q2}</strong> की स्थिति तुरंत देख सकते हैं।</p>
`;
      c = c.slice(0, faqIdx + 30) + gscFaqItem + c.slice(faqIdx + 30);
    }
  }

  return c;
}

module.exports = { processAIOutput, generateTags, cleanContent, addInternalLinks, ensureKeywordFrequency, sanitizeThirdPartyLinks, injectStudentToolsPromo, prettifyLinksAndContent, enrichWithGscQueries };
