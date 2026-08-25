/**
 * Natural Indian Search Intent & Long-Tail Keyword Automator Engine
 * Seamlessly weaves short-tail & long-tail Hinglish search phrases into articles
 * to achieve Rank 1 on Google Search for specific high-volume queries.
 */

function generateIndianSearchVariants(title = '', focusKeyword = '', urls = {}) {
  let base = (focusKeyword || title).replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  // Clean trailing branding
  base = base.replace(/\s*(Digital Home|Sarkari Result|Apply Now|Direct Link)\s*/gi, '').trim();
  if (!base.includes('2026') && !base.includes('2027')) {
    base += ' 2026';
  }

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
function injectNaturalKeywordBox(content = '', title = '', focusKeyword = '', urls = {}) {
  if (!content) return content;

  // Don't duplicate if already injected
  if (content.includes('search-intent-box') || content.includes('Frequently Google Searched Queries')) {
    return content;
  }

  const variants = generateIndianSearchVariants(title, focusKeyword, urls);

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
