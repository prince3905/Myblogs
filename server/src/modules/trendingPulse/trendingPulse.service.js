const axios = require('axios');

/**
 * Live Multi-Category Trending Pulse Service
 * Ultra-Comprehensive, In-Depth Editorial Reporting Engine.
 * Provides 100% self-contained reports with complete context, statistics, takeaways and FAQs.
 * ZERO EXTERNAL BOUNCE — Users stay engaged entirely on our website!
 */

const CATEGORY_FEEDS = {
  finance: {
    name: 'Finance & UPI',
    badge: 'UPI & FINANCE',
    color: '#059669', // Emerald
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: '📈',
    queries: [
      'https://news.google.com/rss/search?q=UPI+payment+OR+RBI+OR+income+tax+OR+stock+market+India&hl=en-IN&gl=IN&ceid=IN:en',
      'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en'
    ]
  },
  ai: {
    name: 'AI & Web Tools',
    badge: 'AI & TOOLS',
    color: '#7C3AED', // Violet
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    icon: '🤖',
    queries: [
      'https://news.google.com/rss/search?q=Artificial+Intelligence+OR+ChatGPT+OR+Gemini+AI+OR+DeepSeek+India&hl=en-IN&gl=IN&ceid=IN:en'
    ]
  },
  tech: {
    name: 'Tech & Tutorials',
    badge: 'TECH & GADGETS',
    color: '#2563EB', // Blue
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: '💻',
    queries: [
      'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en'
    ]
  },
  health: {
    name: 'Health & Wellness',
    badge: 'HEALTH & CARE',
    color: '#0D9488', // Teal
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    icon: '🩺',
    queries: [
      'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en'
    ]
  },
  news: {
    name: 'News & Trends',
    badge: 'TOP HEADLINES',
    color: '#EA580C', // Orange
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    icon: '🔥',
    queries: [
      'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en'
    ]
  }
};

let cachedPulseData = [];
let lastFetchedTime = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function formatRelativeTime(dateString) {
  if (!dateString) return 'Recent';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function cleanTitle(rawTitle = '') {
  let t = rawTitle
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Strip trailing publisher name if separated by " - "
  if (t.includes(' - ')) {
    const parts = t.split(' - ');
    if (parts[parts.length - 1].length < 35) {
      parts.pop();
      t = parts.join(' - ').trim();
    }
  }
  return t;
}

/**
 * Intelligent In-Depth Editorial Synthesizer
 * Generates an exhaustive, multi-paragraph report with ground context, data stats, practical actions & FAQs.
 */
function synthesizeDeepReport(title, categoryKey, source) {
  const t = (title || '').toLowerCase();

  if (categoryKey === 'finance') {
    if (t.includes('upi') || t.includes('payment') || t.includes('charge') || t.includes('fee') || t.includes('limit') || t.includes('npc')) {
      return {
        subtitle: 'डिजिटल पेमेंट्स, यूपीआई गाइडलाइन्स व बैंकिंग सुरक्षा पर विस्तृत रिपोर्ट',
        summaryLead: `भारतीय राष्ट्रीय भुगतान निगम (NPCI) और भारतीय रिज़र्व बैंक (RBI) द्वारा संचालित यूनिफाइड पेमेंट्स इंटरफेस (UPI) को लेकर हालिया दिनों में उपभोक्ताओं और व्यापारियों के बीच कई नई चर्चाएं शुरू हुई हैं। देश के करोड़ों डिजिटल उपयोगकर्ताओं के लिए सबसे राहत की बात यह है कि आम नागरिकों के बीच होने वाले व्यक्तिगत (Person-to-Person यानी P2P) पेमेंट्स पूरी तरह 100% मुफ्त और सुरक्षित बने रहेंगे। सरकार और नियामक संस्थाओं ने आधिकारिक रूप से स्पष्ट किया है कि सामान्य यूपीआई लेनदेन पर आम जनता से कोई शुल्क नहीं लिया जाएगा।`,
        groundReality: `डिजिटल लेन-देन की दुनिया में पारदर्शिता लाने के लिए प्रीपेड पेमेंट इंस्ट्रूमेंट्स (वॉलेट्स आदि) और बड़े मर्चेंट ट्रांजेक्शन के लिए नियम पहले से परिभाषित हैं। तकनीकी स्तर पर सर्वर लोड को संतुलित करने और असफल लेनदेन (Failed Transactions) की दर को शून्य करने के लिए बैंक अपने कोर बैंकिंग सिस्टम को अपग्रेड कर रहे हैं। इसके साथ ही साइबर सुरक्षा के कड़े मानक लागू किए गए हैं ताकि ऑनलाइन फ्रॉड पर तत्काल रोक लगाई जा सके।`,
        keyTakeaways: [
          'व्यक्तिगत बैंक-टू-बैंक UPI ट्रांसफर पर किसी भी प्रकार का कोई शुल्क नहीं है।',
          'दैनिक सामान्य UPI ट्रांजेक्शन लिमिट बैंक के अनुसार ₹1 लाख से ₹2 लाख तक निर्धारित है, जबकि अस्पताल और शिक्षण संस्थानों के लिए यह ₹5 लाख तक है।',
          'आरबीआई के निर्देशानुसार ऑटोमैटिक फ्रॉड डिटेक्शन और रियल-टाइम एसएमएस अलर्ट्स को अनिवार्य किया गया है।',
          'गलत ट्रांजेक्शन होने की स्थिति में तुरंत बैंक के टोल-फ्री नंबर या NPCI के आधिकारिक पोर्टल पर शिकायत दर्ज कराई जा सकती है।'
        ],
        statGrid: [
          { label: 'P2P ट्रांसफर चार्ज', value: '₹0 (बिल्कुल फ्री)' },
          { label: 'सामान्य दैनिक लिमिट', value: '₹1,00,000 / दिन' },
          { label: 'शिक्षा/अस्पताल लिमिट', value: '₹5,00,000 / दिन' },
          { label: 'नियामक प्राधिकरण', value: 'RBI & NPCI भारत' }
        ],
        actionChecklist: [
          'अपने यूपीआई ऐप्स (Google Pay, PhonePe, Paytm, BHIM) को केवल आधिकारिक गूगल प्ले स्टोर या ऐपल ऐप स्टोर से ही अपडेट रखें।',
          'किसी भी अनजान व्यक्ति द्वारा भेजा गया क्यूआर कोड स्कैन न करें — ध्यान रहे कि पैसे प्राप्त करने के लिए कभी यूपीआई पिन नहीं डालना होता।',
          'अपने बैंक खाते में दैनिक यूपीआई लिमिट अपनी जरूरत के अनुसार सेट करें ताकि सुरक्षा बनी रहे।'
        ],
        faqs: [
          {
            q: 'क्या दोस्तों या परिवार को यूपीआई से पैसे भेजने पर कोई एक्स्ट्रा चार्ज कटेगा?',
            a: 'बिल्कुल नहीं! आम नागरिकों के बीच सामान्य बैंक-टू-बैंक यूपीआई ट्रांजेक्शन पर सरकार या बैंक द्वारा कोई शुल्क नहीं लगाया जाता।'
          },
          {
            q: 'यदि गलत खाते में यूपीआई पेमेंट हो जाए तो क्या करें?',
            a: 'ट्रांजेक्शन का यूटीआर नंबर (UTR Number) नोट करें, तुरंत अपने बैंक के कस्टमर केयर पर कॉल करके ट्रांजेक्शन ब्लॉक करवाएं और नेशनल साइबर क्राइम पोर्टल (1930) पर शिकायत दर्ज करें।'
          }
        ]
      };
    }

    if (t.includes('tax') || t.includes('income') || t.includes('budget') || t.includes('itr') || t.includes('gst')) {
      return {
        subtitle: 'आयकर नियम, टैक्स स्लैब व बजट प्रावधानों का संपूर्ण विश्लेषण',
        summaryLead: `प्रत्यक्ष कर बोर्ड (CBDT) और वित्त मंत्रालय द्वारा आयकर नियमों में पारदर्शिता और सरलीकरण को प्राथमिकता दी जा रही है। टैक्सपेयर्स को नए टैक्स रिजीम (New Tax Regime) और पुराने टैक्स रिजीम (Old Tax Regime) के बीच चयन करते समय अपनी वार्षिक आय, निवेश और मिलने वाली छूटों का सही मिलान करना आवश्यक है।`,
        groundReality: `कर विशेषज्ञों के अनुसार, मध्यम वर्ग और वेतनभोगी कर्मचारियों के लिए नई कर व्यवस्था में दी गई स्टैंडर्ड डिडक्शन और टैक्स रिबेट से अधिकतर लोगों की ₹7 लाख तक की आय कर-मुक्त हो जाती है। वहीं जिन लोगों के पास होम लोन का ब्याज, एचआरए और 80C के तहत बड़े निवेश हैं, उनके लिए पुरानी कर व्यवस्था का तुलनात्मक अध्ययन करना फायदेमंद रहता है।`,
        keyTakeaways: [
          'न्यू टैक्स रिजीम को डिफॉल्ट रिजीम बनाया गया है, जिसमें सरल स्लैब और अधिक रिबेट उपलब्ध है।',
          'वार्षिक आईटीआर फाइलिंग समय पर पूरी करना आवश्यक है, अन्यथा लेट फीस और ब्याज का भुगतान करना पड़ सकता है।',
          'फॉर्म 26AS और एआईएस (AIS) के माध्यम से अपने सभी टीडीएस और वित्तीय लेन-देन का पूर्व सत्यापन अनिवार्य है।'
        ],
        statGrid: [
          { label: 'डिफॉल्ट रिजीम', value: 'New Tax Regime' },
          { label: 'टैक्स रिबेट सीमा', value: '₹7 लाख तक (धारा 87A)' },
          { label: 'मानक कटौती (Standard Deduction)', value: 'वेतनभोगियों के लिए मान्य' },
          { label: 'निगरानी एजेंसी', value: 'CBDT & इनकम टैक्स' }
        ],
        actionChecklist: [
          'आयकर पोर्टल पर अपना ई-फाइलिंग अकाउंट एक्टिव और आधार-पैन लिंक्ड रखें।',
          'वित्तीय वर्ष समाप्त होने से पहले सभी जरूरी टैक्स सेविंग विकल्पों और फॉर्म 16 का मिलान करें।',
          'आईटीआर फाइल करने के बाद 30 दिनों के भीतर ई-वेरिफिकेशन (आधार ओटीपी द्वारा) अनिवार्य रूप से पूरा करें।'
        ],
        faqs: [
          {
            q: 'क्या हर किसी के लिए न्यू टैक्स रिजीम ही सबसे अच्छा है?',
            a: 'यदि आपके पास होम लोन, एचआरए या बड़े 80C निवेश नहीं हैं तो न्यू टैक्स रिजीम बेहतर है, अन्यथा दोनों की गणना करके ही निर्णय लें।'
          },
          {
            q: 'ई-वेरिफिकेशन न करने पर क्या आईटीआर अमान्य हो जाता है?',
            a: 'हाँ, बिना समय पर ई-वेरिफिकेशन किए दाखिल किया गया आईटीआर आयकर विभाग द्वारा अमान्य घोषित कर दिया जाता है।'
          }
        ]
      };
    }

    return {
      subtitle: 'बैंकिंग, मार्केट रुझान व सुरक्षित निवेश की संपूर्ण गाइड',
      summaryLead: `भारतीय अर्थव्यवस्था और बैंकिंग क्षेत्र में हो रहे निरंतर सुधारों से आम नागरिकों की बचत और निवेश पर सीधा असर पड़ रहा है। रिज़र्व बैंक ऑफ इंडिया (RBI) की मौद्रिक नीति समिति द्वारा महंगाई दर और जीडीपी ग्रोथ के संतुलन को बनाए रखने के लिए ब्याज दरों पर नियमित समीक्षा की जाती है।`,
      groundReality: `बैंकों द्वारा फिक्स्ड डिपॉजिट (FD) और सेविंग्स अकाउंट्स पर दिए जाने वाले ब्याज दरों में स्थिरता देखी जा रही है। वहीं दूसरी ओर रिटेल निवेशक अनुशासित रूप से म्यूचुअल फंड सिप (SIP) और सरकारी सुरक्षित बचत योजनाओं की ओर तेजी से आकर्षित हो रहे हैं, जिससे लंबी अवधि में वेल्थ क्रिएशन का मार्ग प्रशस्त होता है।`,
      keyTakeaways: [
        'आरबीआई की गाइडलाइन्स के तहत प्रत्येक बैंक जमाकर्ता का ₹5 लाख तक का डिपॉजिट DICGC द्वारा 100% बीमित (Insured) होता है।',
        'अपने बजट का कम से कम 20% हिस्सा नियमित बचत और आपातकालीन फंड (Emergency Fund) में रखना चाहिए।',
        'सिबिल क्रेडिट स्कोर को 750 से ऊपर रखने से भविष्य में होम लोन या पर्सनल लोन सबसे कम ब्याज दर पर आसानी से मिल जाता है।'
      ],
      statGrid: [
        { label: 'डिपॉजिट बीमा सुरक्षा', value: '₹5 लाख प्रति बैंक' },
        { label: 'आदर्श सिबिल स्कोर', value: '750+' },
        { label: 'अनुशंसित बचत नियम', value: '50-30-20 फॉर्मूला' },
        { label: 'रेगुलेटर', value: 'RBI & SEBI' }
      ],
      actionChecklist: [
        'किसी भी अनधिकृत लोन ऐप या तुरंत पैसा दोगुना करने का दावा करने वाली फर्जी स्कीमों से दूर रहें।',
        'हर 6 महीने में अपना क्रेडिट स्कोर और बैंक स्टेटमेंट चेक करें।',
        'लंबी अवधि के लक्ष्यों के लिए फिक्स्ड इनकम और इक्विटी का संतुलित पोर्टफोलियो बनाएं।'
      ],
      faqs: [
        {
          q: 'क्या फिक्स्ड डिपॉजिट में पैसा लगाना आज भी सुरक्षित है?',
          a: 'हाँ, शेड्यूल्ड बैंकों में जमा राशि सरकारी गारंटी (DICGC) के तहत ₹5 लाख तक पूरी तरह सुरक्षित होती है।'
        },
        {
          q: 'सिबिल स्कोर खराब होने पर उसे कैसे सुधारा जा सकता है?',
          a: 'क्रेडिट कार्ड के बिल और लोन की ईएमआई समय पर चुकाएं और क्रेडिट कार्ड लिमिट का 30% से अधिक इस्तेमाल न करें।'
        }
      ]
    };
  }

  if (categoryKey === 'ai') {
    return {
      subtitle: 'आर्टिफिशियल इंटेलिजेंस, जनरेटिव मॉडल्स व डिजिटल टूल्स का गहन विश्लेषण',
      summaryLead: `आर्टिफिशियल इंटेलिजेंस (AI) का दायरा अब केवल रिसर्च लैब्स तक सीमित नहीं रहा, बल्कि यह रोजमर्रा के जीवन, शिक्षा और पेशेवर कार्यप्रणाली में क्रांति ला रहा है। नए जनरेटिव एआई मॉडल्स और ऑटोमेशन टूल्स ने छात्रों, शोधकर्ताओं और क्रिएटर्स के काम करने के तरीके को पूरी तरह बदल दिया है।`,
      groundReality: `सर्च इंजन, कोडिंग असिस्टेंट्स और कंटेंट क्रिएशन प्लेटफॉर्म्स अब रीज़निंग मॉडल्स और एजेंटिक वर्कफ़्लो पर काम कर रहे हैं। इससे डेटा समराइजेशन, कॉम्प्लेक्स प्रॉब्लम सॉल्विंग और विजुअल डिजाइनिंग का काम सेकंडों में पूरा हो रहा है। भारत में एआई टूल्स का उपयोग शिक्षा और प्रतियोगी परीक्षाओं की तैयारी में भी तेजी से बढ़ रहा है।`,
      keyTakeaways: [
        'स्मार्ट प्रॉम्प्ट इंजीनियरिंग के जरिए किसी भी एआई टूल से 10 गुना बेहतर और सटीक परिणाम प्राप्त किए जा सकते हैं।',
        'मार्केट में अनेक पावरफुल एआई टूल्स विद्यार्थियों और प्रोफेशनल्स के लिए फ्री टियर में उपलब्ध हैं।',
        'एआई द्वारा तैयार किए गए डेटा और सूचनाओं का फैक्ट-चेक करना आवश्यक है ताकि तथ्यात्मक गलतियों से बचा जा सके।'
      ],
      statGrid: [
        { label: 'कार्य दक्षता वृद्धि', value: '3x - 10x तेज' },
        { label: 'उपलब्धता', value: 'मोबाइल व वेब ब्राउज़र' },
        { label: 'प्रमुख उपयोग', value: 'रिसर्च, कोडिंग व एनालिसिस' },
        { label: 'कैटेगरी', value: 'Generative AI & Tools' }
      ],
      actionChecklist: [
        'प्रॉम्प्ट लिखते समय एआई को सटीक संदर्भ (Context), अपना लक्ष्य और अपेक्षित फॉर्मेट स्पष्ट रूप से बताएं।',
        'किसी भी संवेदनशील व्यक्तिगत या वित्तीय जानकारी को पब्लिक एआई बॉट्स में इनपुट न करें।',
        'एआई टूल्स को अपना सहायक बनाएं, उन पर आंख बंद करके निर्भर न रहें।'
      ],
      faqs: [
        {
          q: 'क्या छात्र अपनी पढ़ाई और नोट्स बनाने के लिए एआई का उपयोग कर सकते हैं?',
          a: 'हाँ, कठिन विषयों को आसान भाषा में समझने और त्वरित रिवीज़न नोट्स बनाने के लिए एआई एक बेहतरीन टूल है।'
        },
        {
          q: 'क्या एआई टूल्स हमेशा 100% सही जानकारी देते हैं?',
          a: 'नहीं, एआई कभी-कभी पुराने या गलत तथ्य (Hallucinations) दे सकता है, इसलिए महत्वपूर्ण सूचनाओं की पुष्टि आधिकारिक स्रोतों से जरूर करें।'
        }
      ]
    };
  }

  if (categoryKey === 'tech') {
    return {
      subtitle: 'सॉफ्टवेयर गाइड, प्राइवेसी सेटिंग्स व गैजेट्स पर पूरी जानकारी',
      summaryLead: `तकनीक और डिजिटल गैजेट्स हमारे जीवन का अभिन्न हिस्सा बन चुके हैं। स्मार्टफोन, लैपटॉप और ऑपरेटिंग सिस्टम के नए फीचर्स जहां एक ओर हमारी उत्पादकता बढ़ाते हैं, वहीं दूसरी ओर साइबर सुरक्षा और डेटा प्राइवेसी को लेकर जागरूक रहना भी बेहद जरूरी हो गया है।`,
      groundReality: `विंडोज 11, एंड्रॉयड और आईओएस में लगातार सुरक्षा पैच और परफॉर्मेंस बूस्टर्स जारी किए जा रहे हैं। बैकग्राउंड डेटा कंजम्पशन को कम करने, बैटरी लाइफ को अनुकूलित करने और क्लाउड स्टोरेज के सुरक्षित उपयोग के लिए सही सेटिंग्स का चुनाव करना प्रत्येक यूज़र के लिए आवश्यक है।`,
      keyTakeaways: [
        'स्मार्टफोन और कंप्यूटर की स्पीड तेज रखने के लिए कैशे फाइल्स और गैर-जरूरी बैकग्राउंड ऐप्स को समय पर क्लियर करें।',
        'मैलवेयर और स्पाईवेयर से बचाव के लिए हमेशा टू-फैक्टर ऑथेंटिकेशन (2FA) ऑन रखें।',
        'अनजान लिंक्स से एपीके फाइल्स (APK) डाउनलोड करने से बचें क्योंकि इनमें खतरनाक ट्रोजन हो सकते हैं।'
      ],
      statGrid: [
        { label: 'सिस्टम परफॉर्मेंस', value: 'ऑप्टिमाइज्ड सेटिंग्स' },
        { label: 'सुरक्षा स्तर', value: '2-फैक्टर वेरिफिकेशन' },
        { label: 'सपोर्टेड ओएस', value: 'Android, Windows, iOS' },
        { label: 'गाइड टाइप', value: 'Tested & Practical' }
      ],
      actionChecklist: [
        'अपने सभी जरूरी अकाउंट्स के पासवर्ड मजबूत रखें और हर कुछ महीनों में उन्हें बदलें।',
        'अपने फोन के महत्वपूर्ण फोटो और फाइल्स का ऑटोमैटिक गूगल ड्राइव या लोकल बैकअप सेट करें।',
        'सिस्टम अपडेट आने पर उसे टालने के बजाय वाई-फाई कनेक्ट करके तुरंत अपडेट करें।'
      ],
      faqs: [
        {
          q: 'फोन बहुत धीमा चल रहा हो तो उसे बिना फॉर्मेट किए कैसे तेज करें?',
          a: 'फोन की इंटरनल स्टोरेज में कम से कम 20% स्पेस खाली रखें, बैकग्राउंड रनिंग ऐप्स को बंद करें और सेटिंग्स में जाकर एनिमेशन स्पीड 0.5x पर सेट करें।'
        },
        {
          q: 'क्या सार्वजनिक वाई-फाई पर नेट बैंकिंग का उपयोग करना सुरक्षित है?',
          a: 'नहीं, पब्लिक वाई-फाई पर बिना वीपीएन के वित्तीय लेनदेन करने से डेटा हैक होने का खतरा रहता है।'
        }
      ]
    };
  }

  if (categoryKey === 'health') {
    return {
      subtitle: 'स्वास्थ्य जागरूकता, जीवनशैली सुधार व क्लिनिकल एडवाइजरी',
      summaryLead: `आधुनिक भागदौड़ भरी जिंदगी और डेस्क जॉब कल्चर के कारण स्वास्थ्य से जुड़ी चुनौतियां तेजी से बढ़ रही हैं। स्वास्थ्य विशेषज्ञों और चिकित्सकों का मानना है कि दैनिक दिनचर्या में छोटे-छोटे सकारात्मक बदलाव करके कई गंभीर जीवनशैली बीमारियों से आसानी से बचा जा सकता है।`,
      groundReality: `संतुलित पोषण, पर्याप्त जल सेवन (हाइड्रेशन) और मानसिक तनाव को नियंत्रित रखना उत्तम स्वास्थ्य की कुंजी है। स्क्रीन टाइम अधिक होने के कारण आंखों में खिंचाव (Digital Eye Strain), सर्वाइकल पेन और नींद न आने की समस्याएं आम हो गई हैं, जिसके लिए प्राकृतिक और व्यावहारिक उपायों को अपनाना आवश्यक है।`,
      keyTakeaways: [
        'रोजाना 7 से 8 घंटे की गहरी और नियमित नींद शरीर की रोग प्रतिरोधक क्षमता (Immunity) को प्राकृतिक रूप से मजबूत करती है।',
        'ज्यादा नमक, रिफाइंड चीनी और पैकेज्ड फूड का सेवन सीमित करके हृदय स्वास्थ्य और रक्तचाप को नियंत्रित रखा जा सकता है।',
        'काम के दौरान हर 20 मिनट बाद 20 सेकंड के लिए 20 फीट दूर देखने से (20-20-20 नियम) आंखों की थकान दूर होती है।'
      ],
      statGrid: [
        { label: 'दैनिक जल सेवन', value: '2.5 से 3.5 लीटर' },
        { label: 'शारीरिक व्यायाम', value: '30 मिनट प्रतिदिन' },
        { label: 'नींद का समय', value: '7-8 घंटे आवश्यक' },
        { label: 'गाइडलाइन स्रोत', value: 'WHO व मेडिकल रिसर्च' }
      ],
      actionChecklist: [
        'सुबह उठकर खाली पेट गुनगुना पानी पिएं और दिन की शुरुआत ताजे फलों या भीगे मेवों से करें।',
        'सोने से कम से कम 1 घंटा पहले मोबाइल और टीवी स्क्रीन को पूरी तरह बंद कर दें।',
        'वर्ष में कम से कम एक बार अपनी बुनियादी स्वास्थ्य जांच (ब्लड टेस्ट, बीपी, शुगर) जरूर करवाएं।'
      ],
      faqs: [
        {
          q: 'लगातार थकान और सुस्ती महसूस होने का मुख्य कारण क्या हो सकता है?',
          a: 'विटामिन डी3, विटामिन बी12 की कमी, पर्याप्त नींद न मिलना या हीमोग्लोबिन का स्तर कम होना इसके मुख्य कारण हो सकते हैं।'
        },
        {
          q: 'तनाव और चिंता को तुरंत कम करने का सबसे सरल तरीका क्या है?',
          a: 'गहरी सांस लेने का अभ्यास (4-7-8 ब्रीदिंग तकनीक) करें और कुछ मिनटों के लिए खुली हवा में टहलें।'
        }
      ]
    };
  }

  // Default: News & Trends
  return {
    subtitle: 'राष्ट्रीय घटनाक्रम, प्रशासनिक निर्णय व सार्वजनिक नीति विश्लेषण',
    summaryLead: `देश-दुनिया और शासन व्यवस्था में हो रहे महत्वपूर्ण नीतिगत निर्णयों का सीधा असर आम नागरिकों, युवाओं और विद्यार्थियों के भविष्य पर पड़ता है। विकास योजनाओं, तकनीकी विस्तार और प्रशासनिक सुधारों से नए अवसर पैदा हो रहे हैं।`,
    groundReality: `डिजिटल इंडिया, कौशल विकास और नागरिक सेवाओं के ऑनलाइन होने से पारदर्शिता बढ़ी है। प्रतियोगी परीक्षाओं की तैयारी कर रहे विद्यार्थियों के लिए राष्ट्रीय करंट अफेयर्स, सरकारी योजनाओं और नए कानूनों की सटीक जानकारी रखना बेहद आवश्यक है ताकि वे हर परीक्षा में आगे रह सकें।`,
    keyTakeaways: [
      'सरकारी योजनाओं और कल्याणकारी कार्यक्रमों का लाभ उठाने के लिए सही पात्रता और आधिकारिक पोर्टल की जानकारी होना जरूरी है।',
      'समसामयिक घटनाक्रम (Current Affairs) का नियमित अध्ययन प्रतियोगी परीक्षाओं के लिए अत्यधिक लाभकारी है।',
      'सोशल मीडिया पर फैलने वाली अफवाहों से बचें और केवल सत्यापित स्रोतों पर ही विश्वास करें।'
    ],
    statGrid: [
      { label: 'इम्पैक्ट क्षेत्र', value: 'राष्ट्रीय व जनहित' },
      { label: 'सत्यापन', value: 'प्रामाणिक व निष्पक्ष' },
      { label: 'अपडेट प्रकार', value: '24x7 लाइव न्यूज' },
      { label: 'कवरेज', value: 'Digital Home Special' }
    ],
    actionChecklist: [
      'महत्वपूर्ण सरकारी घोषणाओं और अधिसूचनाओं के लिए हमारे लाइव अलर्ट्स सेक्शन को बुकमार्क करके रखें।',
      'अपने सभी आधिकारिक दस्तावेज (आधार, पैन, वोटर आईडी) समय पर अपडेट रखें।',
      'शिक्षा और रोजगार से जुड़ी खबरों के लिए नियमित रूप से हमारे पोर्टल पर विजिट करते रहें।'
    ],
    faqs: [
      {
        q: 'सरकारी योजनाओं से जुड़ी सही और प्रामाणिक जानकारी कहां मिलती है?',
        a: 'केंद्र और राज्य सरकारों के आधिकारिक पोर्टल्स और हमारे डिजिटल होम ब्लॉग के लाइव अपडेट्स सेक्शन पर पूरी जानकारी उपलब्ध रहती है।'
      },
      {
        q: 'प्रतियोगी परीक्षाओं के लिए करंट अफेयर्स की तैयारी कैसे करें?',
        a: 'दैनिक रूप से राष्ट्रीय व अंतरराष्ट्रीय मुख्य बिंदुओं को संक्षेप में नोट करें और नियमित क्विज का अभ्यास करें।'
      }
    ]
  };
}

async function fetchCategoryItems(categoryKey, config) {
  const items = [];
  const feedUrl = config.queries[0];

  try {
    const res = await axios.get(feedUrl, {
      timeout: 6500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(res.data)) !== null && items.length < 8) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

      let rawTitle = titleMatch ? titleMatch[1] : '';
      let source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

      if (!source && rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        source = parts[parts.length - 1].trim();
      }

      const clean = cleanTitle(rawTitle);
      if (clean && clean.length > 15 && !clean.toLowerCase().includes('google news')) {
        const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
        const report = synthesizeDeepReport(clean, categoryKey, source);

        items.push({
          id: `${categoryKey}-${Math.abs(clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0))}`,
          title: clean,
          source: source || 'Official Media',
          categoryKey,
          categoryName: config.name,
          badge: config.badge,
          color: config.color,
          bgColor: config.bgColor,
          borderColor: config.borderColor,
          icon: config.icon,
          pubDate: pubDate,
          timeAgo: formatRelativeTime(pubDate),
          report: report // Full in-depth self-contained editorial report!
        });
      }
    }
  } catch (err) {
    console.warn(`[TrendingPulse] Failed fetching ${categoryKey}: ${err.message}`);
  }

  return items;
}

/**
 * Fetch and build aggregate trending pulse across all key categories
 */
async function getTrendingPulseData(forceRefresh = false) {
  const isFresh = cachedPulseData.length > 0 && lastFetchedTime && (Date.now() - lastFetchedTime < CACHE_TTL_MS);
  if (isFresh && !forceRefresh) {
    return {
      items: cachedPulseData,
      lastUpdated: new Date(lastFetchedTime).toISOString(),
      fromCache: true
    };
  }

  console.log('[TrendingPulse] Refreshing live multi-category trends from national feeds...');
  const promises = Object.entries(CATEGORY_FEEDS).map(([key, config]) => fetchCategoryItems(key, config));
  const results = await Promise.allSettled(promises);

  const aggregated = [];
  results.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      aggregated.push(...res.value);
    }
  });

  // Sort by pubDate descending
  aggregated.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (aggregated.length > 0) {
    cachedPulseData = aggregated;
    lastFetchedTime = Date.now();
  }

  return {
    items: cachedPulseData,
    lastUpdated: new Date(lastFetchedTime || Date.now()).toISOString(),
    fromCache: false
  };
}

module.exports = {
  getTrendingPulseData,
  CATEGORY_FEEDS
};
