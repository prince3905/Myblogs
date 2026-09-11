/**
 * Natural Indian Search Intent & Long-Tail Keyword Automator Engine
 * Seamlessly weaves short-tail & long-tail Hinglish search phrases into articles
 * to achieve Rank 1 on Google Search for specific high-volume queries.
 */

function generateIndianSearchVariants(title = '', focusKeyword = '', urls = {}, category = '') {
  let base = (focusKeyword || title).replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  // Clean trailing branding
  base = base.replace(/\s*(Digital Home|Sarkari Result|Apply Now|Direct Link)\s*/gi, '').trim();
  if (!base.includes('2026') && !base.includes('2027')) {
    base += ' 2026';
  }

  const catLower = (category || '').toLowerCase();

  // Category 1: Current Affairs & Daily GK
  if (catLower.includes('current affair') || catLower.includes('gk') || base.toLowerCase().includes('current affairs') || base.toLowerCase().includes('करेंट अफेयर्स')) {
    return [
      {
        type: 'Quiz Query',
        phrase: `${base} 10 GK MCQs practice quiz test kaise solve kare`,
        linkUrl: '/daily-quiz',
        buttonText: '🎯 10 MCQs क्विज़ टेस्ट हल करें (Play Daily Quiz 🚀)',
        btnColor: '#10b981'
      },
      {
        type: 'Archive Query',
        phrase: `${base} monthly & weekly PDF capsules download link`,
        linkUrl: '/current-affairs',
        buttonText: '📚 पिछले सभी करेंट अफेयर्स देखें (All Archives 📁)',
        btnColor: '#4f46e5'
      },
      {
        type: 'Exam Alert Query',
        phrase: `${base} based Sarkari Exam notifications & updates`,
        linkUrl: '/job-alerts',
        buttonText: '⚡ लेटेस्ट सरकारी जॉब अलर्ट्स (Live Job Alerts 🔔)',
        btnColor: '#ea580c'
      },
      {
        type: 'Static GK Query',
        phrase: `${base} Static GK Booster points for UPSC, SSC & Railway`,
        linkUrl: '/current-affairs',
        buttonText: '📌 स्टेटिक GK और परीक्षा नोट्स (Static GK ✍️)',
        btnColor: '#0284c7'
      }
    ];
  }

  // Category 2: Tech & Tutorials
  if (catLower.includes('tech') || catLower.includes('tutorial')) {
    return [
      {
        type: 'Tutorial Query',
        phrase: `${base} step by step setup and settings guide`,
        linkUrl: '/category/tech-tutorials',
        buttonText: '💻 पूरी टेक गाइड और ट्यूटोरियल देखें (Explore Tech 🚀)',
        btnColor: '#0284c7'
      },
      {
        type: 'Tools Query',
        phrase: `${base} free utilities and productivity tools`,
        linkUrl: '/tools',
        buttonText: '🛠️ फ्री वेब टूल्स और यूटिलिटीज (Use Free Tools ⚡)',
        btnColor: '#10b981'
      },
      {
        type: 'Troubleshoot Query',
        phrase: `${base} common errors fix and tips & tricks`,
        linkUrl: '/blog',
        buttonText: '📖 सभी टेक्नोलॉजी आर्टिकल्स (Read All Tech 📁)',
        btnColor: '#4f46e5'
      }
    ];
  }

  // Category 3: AI & Web Tools
  if (catLower.includes('ai') || catLower.includes('tool')) {
    return [
      {
        type: 'AI Tool Query',
        phrase: `${base} free online AI tools and prompt guide`,
        linkUrl: '/category/ai-web-tools',
        buttonText: '🤖 AI और वेब टूल्स एक्सप्लोर करें (Try AI Tools 🚀)',
        btnColor: '#7c3aed'
      },
      {
        type: 'Utilities Query',
        phrase: `${base} fast web converters, resizers and utilities`,
        linkUrl: '/tools',
        buttonText: '✨ फ्री स्टूडेंट और वेब टूल्स (100% Free Tools 🛠️)',
        btnColor: '#10b981'
      },
      {
        type: 'Alternative Query',
        phrase: `${base} top features and free alternatives 2026`,
        linkUrl: '/blog',
        buttonText: '📚 सभी AI गाइड्स पढ़ें (Browse AI Blog 📖)',
        btnColor: '#4f46e5'
      }
    ];
  }

  // Category 4: Finance & Business
  if (catLower.includes('finance') || catLower.includes('business') || catLower.includes('money')) {
    return [
      {
        type: 'Investment Query',
        phrase: `${base} complete investment, rules and returns calculator`,
        linkUrl: '/category/finance-business',
        buttonText: '💰 फाइनेंस व बिजनेस आर्टिकल्स (Finance Guide 📈)',
        btnColor: '#059669'
      },
      {
        type: 'Tax & Savings Query',
        phrase: `${base} tax saving options, interest rates and benefits`,
        linkUrl: '/tools',
        buttonText: '📊 स्मार्ट कैलकुलेटर टूल्स (Utility Tools ⚡)',
        btnColor: '#0284c7'
      },
      {
        type: 'Scheme Query',
        phrase: `${base} government financial schemes and guidelines`,
        linkUrl: '/blog',
        buttonText: '💼 सभी बिज़नेस आर्टिकल्स (Explore Finance 📁)',
        btnColor: '#4f46e5'
      }
    ];
  }

  // Category 5: Health & Wellness
  if (catLower.includes('health') || catLower.includes('wellness') || catLower.includes('fitness')) {
    return [
      {
        type: 'Health Guide Query',
        phrase: `${base} symptoms, causes and ayurvedic remedies`,
        linkUrl: '/category/health-wellness',
        buttonText: '🌿 स्वास्थ्य और वेलनेस टिप्स (Health Guides 🩺)',
        btnColor: '#16a34a'
      },
      {
        type: 'Diet & Yoga Query',
        phrase: `${base} daily diet chart and yoga exercises`,
        linkUrl: '/blog',
        buttonText: '🧘 सभी वेलनेस ब्लॉग्स पढ़ें (Read Wellness 📖)',
        btnColor: '#4f46e5'
      }
    ];
  }

  // Category 6: News & Trends
  if (catLower.includes('news') || catLower.includes('trend')) {
    return [
      {
        type: 'News Timeline Query',
        phrase: `${base} latest news update and complete timeline`,
        linkUrl: '/category/news-trends',
        buttonText: '🌐 ट्रेंडिंग न्यूज और ताजा अपडेट (Latest News 📰)',
        btnColor: '#ea580c'
      },
      {
        type: 'Current Affairs Query',
        phrase: `${base} key takeaways and national impact analysis`,
        linkUrl: '/current-affairs',
        buttonText: '📚 डेली करेंट अफेयर्स पढ़ें (Daily Updates 🚀)',
        btnColor: '#4f46e5'
      }
    ];
  }

  // Category 7: Sarkari Job & Exam Alerts (Default for Sarkari)
  const applyUrl = urls.apply || 'https://www.india.gov.in/';
  const pdfUrl = urls.pdf || urls.web || 'https://www.india.gov.in/';
  const webUrl = urls.web || 'https://www.india.gov.in/';

  return [
    {
      type: 'Direct Link Query',
      phrase: `${base} direct link kaise download kare`,
      linkUrl: pdfUrl,
      buttonText: '🔥 डाउनलोड लिंक (Direct Link 🚀)',
      btnColor: '#16a34a'
    },
    {
      type: 'Official Portal Query',
      phrase: `${base} official website link check`,
      linkUrl: webUrl,
      buttonText: '🎯 आधिकारिक पोर्टल (Official Portal 🌐)',
      btnColor: '#2563eb'
    },
    {
      type: 'Date & Schedule Query',
      phrase: `${base} exam date & last date kab aayega`,
      linkUrl: pdfUrl,
      buttonText: '⚡ तिथियां देखें (Notice PDF 📄)',
      btnColor: '#dc2626'
    },
    {
      type: 'Step by Step Query',
      phrase: `${base} online application form step by step process in Hindi`,
      linkUrl: applyUrl,
      buttonText: '📌 ऑनलाइन आवेदन पोर्टल (Apply Online ✍️)',
      btnColor: '#ca8a04'
    }
  ];
}

/**
 * Injects a natural, Google-friendly "Search Queries Overview" box into article HTML
 */
function injectNaturalKeywordBox(content = '', title = '', focusKeyword = '', urls = {}, category = '') {
  if (!content) return content;

  // Don't duplicate if already injected
  if (content.includes('search-intent-box') || content.includes('Frequently Google Searched Queries')) {
    return content;
  }

  const variants = generateIndianSearchVariants(title, focusKeyword, urls, category);

  const boxHtml = `
<div class="search-intent-box" style="background:#F0FDF4; border-left:4px solid #16A34A; padding:18px; margin:24px 0; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
  <h4 style="margin:0 0 14px 0; color:#15803D; font-size:1.08rem; font-weight:800; display:flex; align-items:center; gap:8px;">
    🔍 Frequently Google Searched Queries (मुख्य खोज प्रश्न)
  </h4>
  <ul style="margin:0; padding-left:18px; color:#1F2937; font-size:0.92rem; line-height:2.2; list-style-type:square;">
    ${variants.map(v => `
      <li style="margin-bottom:8px;">
        <strong style="color:#065F46; font-weight:600;">${v.phrase}:</strong> 
        <a href="${v.linkUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:4px; padding:3px 12px; background:${v.btnColor}; color:#ffffff; font-weight:700; font-size:0.8rem; border-radius:6px; text-decoration:none; margin-left:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
          ${v.buttonText}
        </a>
      </li>
    `).join('')}
  </ul>
</div>
`;

  // Always append Search Intent CTA box to the VERY BOTTOM of article content
  return content + '\n' + boxHtml;
}

module.exports = {
  generateIndianSearchVariants,
  injectNaturalKeywordBox
};
