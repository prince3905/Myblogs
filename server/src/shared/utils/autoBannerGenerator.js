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
  if (t.includes('police') || t.includes('constable')) {
    return { stop0: '#450a0a', stop1: '#991b1b', accentGlow: '#f87171', pillBg: '#fef08a' };
  }
  if (t.includes('bank') || t.includes('ibps') || t.includes('sbi')) {
    return { stop0: '#0f172a', stop1: '#1e3a8a', accentGlow: '#38bdf8', pillBg: '#facc15' };
  }
  if (t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('defence')) {
    return { stop0: '#1e1b4b', stop1: '#3730a3', accentGlow: '#c084fc', pillBg: '#e0e7ff' };
  }
  if (t.includes('upsc') || t.includes('rpsc') || t.includes('mppsc')) {
    return { stop0: '#451a03', stop1: '#78350f', accentGlow: '#fbbf24', pillBg: '#fef3c7' };
  }
  if (t.includes('nta') || t.includes('cuet') || t.includes('admission') || t.includes('jee')) {
    return { stop0: '#064e3b', stop1: '#047857', accentGlow: '#34d399', pillBg: '#d1fae5' };
  }
  return { stop0: '#0a192f', stop1: '#1e293b', accentGlow: '#38bdf8', pillBg: '#e0f2fe' };
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
  const escapedLine1 = escapeXml((titleLines[0] || 'SARKARI JOB ONLINE FORM').toUpperCase());
  const escapedLine2 = escapeXml((titleLines[1] || '2026 APPLY NOW ONLINE').toUpperCase());

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

  <text x="60" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="24" fill="${theme.accentGlow}" letter-spacing="3">DIGITAL HOME BLOG • OFFICIAL PORTAL UPDATES • 2026</text>

  <g transform="translate(730, 48)" filter="url(#badgeGlow)">
    <rect x="0" y="0" width="410" height="62" rx="31" ry="31" fill="${emblem.bgCircle}" stroke="${emblem.primaryColor}" stroke-width="2" />
    <circle cx="36" cy="31" r="20" fill="${emblem.primaryColor}" opacity="0.25" />
    <text x="36" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" text-anchor="middle">${escapedEmblemSymbol}</text>
    <text x="72" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" letter-spacing="1.5">${escapedEmblemCode}</text>
  </g>

  <text x="60" y="${line1Y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="-0.5">${escapedLine1}</text>
  ${hasTwoLines ? `<text x="60" y="${line2Y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="58" fill="${theme.pillBg}" letter-spacing="-0.5">${escapedLine2}</text>` : ''}

  <text x="60" y="${subtitleY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hind', 'Noto Sans Devanagari', sans-serif" font-weight="700" font-size="30" fill="#cbd5e1">पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक</text>

  <g transform="translate(60, ${badgesY})">
    <rect x="0" y="0" width="250" height="52" rx="14" ry="14" fill="${theme.accentGlow}" />
    <text x="125" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#0f172a" text-anchor="middle">✔ OFFICIAL FORM</text>
  </g>

  <g transform="translate(325, ${badgesY})">
    <rect x="0" y="0" width="260" height="52" rx="14" ry="14" fill="#ef4444" />
    <text x="130" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#ffffff" text-anchor="middle">⚡ DIRECT LINK</text>
  </g>

  <g transform="translate(605, ${badgesY})">
    <rect x="0" y="0" width="310" height="52" rx="14" ry="14" fill="rgba(255, 255, 255, 0.22)" />
    <text x="155" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#ffffff" text-anchor="middle">📄 NOTIFICATION PDF</text>
  </g>
</svg>`;

  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Main exported function: Generates Canvas SVG ONLY for Sarkari Jobs & Exams!
 * For Non-Sarkari categories (Health, Tech, AI, Finance, News), returns real 16:9 stock photos!
 */
async function generateAutoBanner(title, category = 'Sarkari Jobs & Exams') {
  const catLower = (category || '').toLowerCase();
  const isSarkari = catLower.includes('sarkari') || catLower.includes('job') || catLower.includes('exam');

  if (isSarkari) {
    try {
      return generateExactCanvasSvg(title, category);
    } catch (err) {
      return generateExactCanvasSvg('SARKARI JOB ONLINE FORM 2026', category);
    }
  }

  // Non-Sarkari category: Fetch real 16:9 HD landscape photo!
  return await fetchLandscapePhoto(title, category);
}

module.exports = { generateAutoBanner, generateExactCanvasSvg, fetchLandscapePhoto };
