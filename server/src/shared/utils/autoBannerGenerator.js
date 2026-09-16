const axios = require('axios');

/**
 * Server-side Auto Canvas Banner SVG Generator.
 * Replicates the EXACT HTML5 Canvas Banner Designer logic from PostEditorPage.jsx 1:1.
 * ONLY USED FOR SARKARI JOBS & EXAMS CATEGORY.
 */

const NON_SARKARI_FALLBACKS = {
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=675&fit=crop&q=80'
  ],
  health: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=675&fit=crop&q=80'
  ],
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&h=675&fit=crop&q=80'
  ],
  general: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=675&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=675&fit=crop&q=80'
  ]
};

async function fetchLandscapePhoto(query = '', category = '') {
  const apiKey = process.env.PEXELS_API_KEY;
  if (apiKey && query && query.trim()) {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: { query: query.trim(), per_page: 5, orientation: 'landscape' },
        headers: { Authorization: apiKey },
        timeout: 6000
      });
      const photos = response.data?.photos;
      if (photos && photos.length > 0) {
        return photos[0].src.landscape || photos[0].src.large || photos[0].src.medium;
      }
    } catch (err) {}
  }

  const catKey = (category || '').toLowerCase();
  let list = NON_SARKARI_FALLBACKS.general;
  if (catKey.includes('tech') || catKey.includes('ai') || catKey.includes('code') || catKey.includes('developer')) {
    list = NON_SARKARI_FALLBACKS.tech;
  } else if (catKey.includes('health') || catKey.includes('wellness') || catKey.includes('fitness')) {
    list = NON_SARKARI_FALLBACKS.health;
  } else if (catKey.includes('finance') || catKey.includes('business') || catKey.includes('money')) {
    list = NON_SARKARI_FALLBACKS.finance;
  }

  const hash = query ? query.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return list[Math.abs(hash) % list.length];
}

function detectOrgEmblem(titleStr = '', catStr = '') {
  const t = (titleStr + ' ' + catStr).toLowerCase();

  // Category specific emblems
  if (t.includes('ai') || t.includes('web tool') || t.includes('chatgpt') || t.includes('bot')) {
    return { code: 'AI & TECH INSIGHTS', symbol: '🤖', primaryColor: '#38bdf8', bgCircle: '#1e1b4b' };
  }
  if (t.includes('finance') || t.includes('business') || t.includes('market') || t.includes('upi') || t.includes('tax') || t.includes('stock') || t.includes('money')) {
    return { code: 'FINANCE & MARKET', symbol: '📈', primaryColor: '#10b981', bgCircle: '#022c22' };
  }
  if (t.includes('health') || t.includes('wellness') || t.includes('fitness') || t.includes('diet') || t.includes('medical') || t.includes('doctor')) {
    return { code: 'HEALTH & WELLNESS', symbol: '🩺', primaryColor: '#2dd4bf', bgCircle: '#042f2e' };
  }
  if (t.includes('tech') || t.includes('tutorial') || t.includes('coding') || t.includes('software') || t.includes('windows') || t.includes('android')) {
    return { code: 'TECH GUIDE & TIPS', symbol: '💻', primaryColor: '#60a5fa', bgCircle: '#0f172a' };
  }
  if (t.includes('news') || t.includes('trend')) {
    return { code: 'TRENDING NEWS', symbol: '🔥', primaryColor: '#fb923c', bgCircle: '#431407' };
  }

  // Sarkari Jobs & Exams emblems
  if (t.includes('rrb') || t.includes('railway')) {
    return { code: 'RRB GOVT', symbol: '🚂', primaryColor: '#facc15', bgCircle: '#1e3a8a' };
  }
  if (t.includes('ssc') || t.includes('cgl') || t.includes('chsl') || t.includes('mts') || t.includes('upsssc')) {
    return { code: 'SSC EXAM', symbol: '🏛️', primaryColor: '#38bdf8', bgCircle: '#0f172a' };
  }
  if (t.includes('police') || t.includes('si ') || t.includes('constable') || t.includes('bpssc')) {
    return { code: 'POLICE RECRUITMENT', symbol: '🛡️', primaryColor: '#f87171', bgCircle: '#450a0a' };
  }
  if (t.includes('bank') || t.includes('sbi') || t.includes('ibps') || t.includes('ubi') || t.includes('rbi') || t.includes('pnb')) {
    return { code: 'BANK SO EXAM', symbol: '🏦', primaryColor: '#facc15', bgCircle: '#0369a1' };
  }
  if (t.includes('upsc') || t.includes('ias') || t.includes('ips') || t.includes('ras') || t.includes('mppsc')) {
    return { code: 'UPSC CIVIL', symbol: '⚖️', primaryColor: '#fbbf24', bgCircle: '#7c2d12' };
  }
  if (t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('defence') || t.includes('iaf') || t.includes('agniveer')) {
    return { code: 'ARMED FORCES', symbol: '⚔️', primaryColor: '#c084fc', bgCircle: '#312e81' };
  }
  if (t.includes('isro') || t.includes('drdo')) {
    return { code: 'ISRO SPACE', symbol: '🚀', primaryColor: '#38bdf8', bgCircle: '#0c4a6e' };
  }
  if (t.includes('nta') || t.includes('neet') || t.includes('jee') || t.includes('cuet') || t.includes('bed') || t.includes('admission')) {
    return { code: 'NTA TESTING', symbol: '🎓', primaryColor: '#34d399', bgCircle: '#064e3b' };
  }
  return { code: 'OFFICIAL SELECTION', symbol: '🏛️', primaryColor: '#10b981', bgCircle: '#065f46' };
}

function detectThemeColors(titleStr = '', catStr = '') {
  const t = (titleStr + ' ' + catStr).toLowerCase();

  // Category specific themes
  if (t.includes('ai') || t.includes('web tool') || t.includes('chatgpt')) {
    return { 
      stop0: '#090d16', stop1: '#1e1b4b', accentGlow: '#38bdf8', pillBg: '#c084fc',
      headerTag: 'DIGITAL HOME • AI & TECH INTELLIGENCE • 2026',
      subtitle: 'कंप्यूटर & AI टूल्स का आसान और पूरा गाइड',
      badge1: '✔ 100% WORKING GUIDE', badge2: '⚡ STEP BY STEP', badge3: '🚀 PRO TIPS'
    };
  }
  if (t.includes('finance') || t.includes('business') || t.includes('upi') || t.includes('tax') || t.includes('stock') || t.includes('money')) {
    return { 
      stop0: '#022c22', stop1: '#064e3b', accentGlow: '#10b981', pillBg: '#fef08a',
      headerTag: 'DIGITAL HOME • FINANCE & WEALTH INSIGHTS • 2026',
      subtitle: 'नियम, प्रभाव और बचत/निवेश की जरूरी बातें',
      badge1: '✔ EXPERT ANALYSIS', badge2: '📊 MARKET IMPACT', badge3: '💡 MONEY TIPS'
    };
  }
  if (t.includes('health') || t.includes('wellness') || t.includes('fitness') || t.includes('diet') || t.includes('medical') || t.includes('doctor')) {
    return { 
      stop0: '#042f2e', stop1: '#0f766e', accentGlow: '#2dd4bf', pillBg: '#ccfbf1',
      headerTag: 'DIGITAL HOME • HEALTH & WELLNESS GUIDE • 2026',
      subtitle: 'लक्षण, कारण और बचाव के असरदार उपाय',
      badge1: '✔ DOCTOR INSIGHTS', badge2: '🌿 100% PRACTICAL', badge3: '🩺 HEALTH CARE'
    };
  }
  if (t.includes('tech') || t.includes('tutorial') || t.includes('coding') || t.includes('software') || t.includes('windows') || t.includes('android')) {
    return { 
      stop0: '#0a192f', stop1: '#1e3a8a', accentGlow: '#60a5fa', pillBg: '#fde047',
      headerTag: 'DIGITAL HOME • TECH TIPS & STEP-BY-STEP • 2026',
      subtitle: 'आसान भाषा में पूरा समाधान और सेटिंग्स',
      badge1: '✔ TESTED SOLUTION', badge2: '⚡ FAST FIX', badge3: '💻 STEP BY STEP'
    };
  }
  if (t.includes('news') || t.includes('trend')) {
    return { 
      stop0: '#1c1917', stop1: '#431407', accentGlow: '#fb923c', pillBg: '#fed7aa',
      headerTag: 'DIGITAL HOME • TOP TRENDS & ANALYSIS • 2026',
      subtitle: 'पूरी ग्राउंड रिपोर्ट और जरूरी मुख्य बिंदु',
      badge1: '✔ VERIFIED REPORT', badge2: '⚡ KEY FACTS', badge3: '🌐 IN-DEPTH INSIGHT'
    };
  }

  // Sarkari Jobs & Exams themes
  if (t.includes('police') || t.includes('constable')) {
    return { 
      stop0: '#450a0a', stop1: '#991b1b', accentGlow: '#f87171', pillBg: '#fef08a',
      headerTag: 'DIGITAL HOME BLOG • POLICE RECRUITMENT • 2026',
      subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
      badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
    };
  }
  if (t.includes('bank') || t.includes('ibps') || t.includes('sbi')) {
    return { 
      stop0: '#0f172a', stop1: '#1e3a8a', accentGlow: '#38bdf8', pillBg: '#facc15',
      headerTag: 'DIGITAL HOME BLOG • BANKING RECRUITMENT • 2026',
      subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
      badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
    };
  }
  if (t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('defence')) {
    return { 
      stop0: '#1e1b4b', stop1: '#3730a3', accentGlow: '#c084fc', pillBg: '#e0e7ff',
      headerTag: 'DIGITAL HOME BLOG • DEFENCE RECRUITMENT • 2026',
      subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
      badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
    };
  }
  if (t.includes('upsc') || t.includes('rpsc') || t.includes('mppsc')) {
    return { 
      stop0: '#451a03', stop1: '#78350f', accentGlow: '#fbbf24', pillBg: '#fef3c7',
      headerTag: 'DIGITAL HOME BLOG • CIVIL SERVICES UPDATES • 2026',
      subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
      badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
    };
  }
  if (t.includes('nta') || t.includes('cuet') || t.includes('admission') || t.includes('jee')) {
    return { 
      stop0: '#064e3b', stop1: '#047857', accentGlow: '#34d399', pillBg: '#d1fae5',
      headerTag: 'DIGITAL HOME BLOG • ENTRANCE & ADMISSION • 2026',
      subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
      badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
    };
  }
  return { 
    stop0: '#0a192f', stop1: '#1e293b', accentGlow: '#38bdf8', pillBg: '#e0f2fe',
    headerTag: 'DIGITAL HOME BLOG • OFFICIAL PORTAL UPDATES • 2026',
    subtitle: 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक',
    badge1: '✔ OFFICIAL FORM', badge2: '⚡ DIRECT LINK', badge3: '📄 NOTIFICATION PDF'
  };
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(titleStr = '') {
  let cleanStr = titleStr
    .replace(/\s+/g, ' ')
    .replace(/Step by Step Apply Now/gi, '')
    .replace(/\(Direct Link\)/gi, '')
    .trim();

  const words = cleanStr.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= 26) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
    if (lines.length === 2) break;
  }
  if (currentLine && lines.length < 2) {
    lines.push(currentLine);
  }

  return lines;
}

function generateExactCanvasSvg(title = '', category = 'Sarkari Jobs & Exams') {
  const emblem = detectOrgEmblem(title, category);
  const theme = detectThemeColors(title, category);
  const titleLines = wrapTitle(title);

  const escapedEmblemSymbol = escapeXml(emblem.symbol);
  const escapedEmblemCode = escapeXml(emblem.code);
  const escapedHeaderTag = escapeXml(theme.headerTag);
  const escapedSubtitle = escapeXml(theme.subtitle);
  const escapedBadge1 = escapeXml(theme.badge1);
  const escapedBadge2 = escapeXml(theme.badge2);
  const escapedBadge3 = escapeXml(theme.badge3);

  const escapedLine1 = escapeXml((titleLines[0] || 'DIGITAL HOME SPECIAL UPDATE').toUpperCase());
  const escapedLine2 = escapeXml((titleLines[1] || '2026 COMPLETE GUIDE').toUpperCase());

  const hasTwoLines = Boolean(titleLines[1]);
  const line1Y = hasTwoLines ? 315 : 355;
  const line2Y = line1Y + 72;
  const subtitleY = hasTwoLines ? 475 : 445;
  const badgesY = hasTwoLines ? 545 : 515;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.stop0}" />
      <stop offset="100%" stop-color="${theme.stop1}" />
    </linearGradient>

    <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="1200" height="675" fill="url(#bgGrad)" />

  <rect x="24" y="24" width="1152" height="627" rx="20" ry="20" fill="none" stroke="${theme.accentGlow}" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.4" />

  <circle cx="1080" cy="120" r="160" fill="${theme.accentGlow}" opacity="0.08" />
  <circle cx="120" cy="580" r="220" fill="${theme.accentGlow}" opacity="0.05" />

  <text x="60" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="24" fill="${theme.accentGlow}" letter-spacing="3">${escapedHeaderTag}</text>

  <g transform="translate(730, 48)" filter="url(#badgeGlow)">
    <rect x="0" y="0" width="410" height="62" rx="31" ry="31" fill="${emblem.bgCircle}" stroke="${emblem.primaryColor}" stroke-width="2" />
    <circle cx="36" cy="31" r="20" fill="${emblem.primaryColor}" opacity="0.25" />
    <text x="36" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" text-anchor="middle">${escapedEmblemSymbol}</text>
    <text x="72" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" letter-spacing="1.5">${escapedEmblemCode}</text>
  </g>

  <text x="60" y="${line1Y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="-0.5">${escapedLine1}</text>
  ${hasTwoLines ? `<text x="60" y="${line2Y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="58" fill="${theme.pillBg}" letter-spacing="-0.5">${escapedLine2}</text>` : ''}

  <text x="60" y="${subtitleY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hind', 'Noto Sans Devanagari', sans-serif" font-weight="700" font-size="30" fill="#cbd5e1">${escapedSubtitle}</text>

  <g transform="translate(60, ${badgesY})">
    <rect x="0" y="0" width="280" height="52" rx="14" ry="14" fill="${theme.accentGlow}" />
    <text x="140" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="22" fill="#0f172a" text-anchor="middle">${escapedBadge1}</text>
  </g>

  <g transform="translate(360, ${badgesY})">
    <rect x="0" y="0" width="260" height="52" rx="14" ry="14" fill="#ef4444" />
    <text x="130" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">${escapedBadge2}</text>
  </g>

  <g transform="translate(640, ${badgesY})">
    <rect x="0" y="0" width="290" height="52" rx="14" ry="14" fill="rgba(255, 255, 255, 0.22)" />
    <text x="145" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">${escapedBadge3}</text>
  </g>
</svg>`;

  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Main exported function: Generates High-CTR Canvas SVG Banners for ALL Categories!
 */
async function generateAutoBanner(title, category = 'Sarkari Jobs & Exams') {
  try {
    return generateExactCanvasSvg(title, category);
  } catch (err) {
    return generateExactCanvasSvg(title || 'DIGITAL HOME UPDATE 2026', category);
  }
}

module.exports = { generateAutoBanner, generateExactCanvasSvg, fetchLandscapePhoto };
