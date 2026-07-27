/**
 * Generates a crisp, state-of-the-art Custom Canvas Banner SVG image
 * following the exact custom canvas design system (Navy/Blue gradient, Yellow/Gold accents,
 * Organization Emblem, Main Heading, Hindi Subtitle, and digitalhomeblog.in watermark).
 * 
 * Zero external image dependencies. 100% fast, reliable, and sharp on all mobile devices!
 */
function generateCustomCanvasSvg(title, category = 'Sarkari Jobs & Exams') {
  const cleanTitle = (title || 'SARKARI JOB ONLINE FORM 2026')
    .split(/[:|]/)[0]
    .replace(/<\/?[^>]+>/g, '')
    .trim()
    .toUpperCase();

  // Detect Organization Emblem & Theme
  const detectOrgEmblem = (tStr = '', catStr = '') => {
    const t = (tStr + ' ' + catStr).toLowerCase();
    if (t.includes('rrb') || t.includes('railway') || t.includes('rrbr')) {
      return { code: 'RRB GOVT EXAM', symbol: '🚂', primaryColor: '#facc15', bgCircle: '#1e3a8a' };
    }
    if (t.includes('ssc') || t.includes('cgl') || t.includes('chsl') || t.includes('mts') || t.includes('upsssc')) {
      return { code: 'SSC / UPSSSC GOVT', symbol: '🏛️', primaryColor: '#38bdf8', bgCircle: '#0f172a' };
    }
    if (t.includes('police') || t.includes('si ') || t.includes('constable') || t.includes('bpssc')) {
      return { code: 'POLICE RECRUITMENT', symbol: '🛡️', primaryColor: '#f87171', bgCircle: '#450a0a' };
    }
    if (t.includes('bank') || t.includes('sbi') || t.includes('ibps') || t.includes('ubi') || t.includes('rbi') || t.includes('pnb')) {
      return { code: 'BANK RECRUITMENT', symbol: '🏦', primaryColor: '#facc15', bgCircle: '#0369a1' };
    }
    if (t.includes('upsc') || t.includes('ias') || t.includes('ips') || t.includes('ras') || t.includes('mppsc')) {
      return { code: 'CIVIL SERVICES', symbol: '⚖️', primaryColor: '#fbbf24', bgCircle: '#7c2d12' };
    }
    if (t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('defence') || t.includes('iaf') || t.includes('agniveer')) {
      return { code: 'DEFENCE FORCES', symbol: '⚔️', primaryColor: '#c084fc', bgCircle: '#312e81' };
    }
    if (t.includes('isro') || t.includes('drdo')) {
      return { code: 'ISRO / DRDO SPACE', symbol: '🚀', primaryColor: '#38bdf8', bgCircle: '#0c4a6e' };
    }
    if (t.includes('nta') || t.includes('neet') || t.includes('jee') || t.includes('cuet') || t.includes('bed') || t.includes('admission')) {
      return { code: 'NTA / ADMISSION', symbol: '🎓', primaryColor: '#34d399', bgCircle: '#064e3b' };
    }
    return { code: 'SARKARI JOB 2026', symbol: '📢', primaryColor: '#facc15', bgCircle: '#1e3a8a' };
  };

  const emblem = detectOrgEmblem(cleanTitle, category);

  // Split title into 2 balanced lines
  const words = cleanTitle.split(/\s+/);
  let line1 = '';
  let line2 = '';
  
  if (words.length <= 4) {
    line1 = words.join(' ');
  } else {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  // Escape special XML characters for SVG
  const escapeXml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const escLine1 = escapeXml(line1);
  const escLine2 = escapeXml(line2);
  const escEmblemCode = escapeXml(emblem.code);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Layer -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />

  <!-- Diagonal Aesthetic Mesh Overlay -->
  <polygon points="600,0 1200,0 1200,675 420,675" fill="#ffffff" fill-opacity="0.03" />

  <!-- Outer Rounded Glowing Frame (35px margin) -->
  <rect x="35" y="35" width="1130" height="605" rx="20" ry="20" fill="none" stroke="${emblem.primaryColor}" stroke-opacity="0.3" stroke-width="3" />

  <!-- Brand Title (Top Left) -->
  <text x="75" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#10b981" filter="url(#shadow)">DIGITAL HOME BLOG</text>
  <text x="75" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#ffffff" opacity="0.75">Official Portal Updates • 2026</text>

  <!-- Top Right Organization Emblem Pill Badge -->
  <g transform="translate(820, 55)">
    <rect x="0" y="0" width="305" height="52" rx="26" ry="26" fill="${emblem.bgCircle}" stroke="${emblem.primaryColor}" stroke-width="2.5" filter="url(#shadow)" />
    <text x="152" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">${emblem.symbol} ${escEmblemCode}</text>
  </g>

  <!-- Center Main Headline (English ALL CAPS) -->
  <g text-anchor="middle" filter="url(#shadow)">
    <text x="600" y="${line2 ? '260' : '300'}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="52" fill="#facc15" letter-spacing="0.5">${escLine1}</text>
    ${line2 ? `<text x="600" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="46" fill="#ffffff" letter-spacing="0.5">${escLine2}</text>` : ''}
  </g>

  <!-- Subtitle Pill (Hindi / Direct Update) -->
  <g transform="translate(250, ${line2 ? '385' : '360'})">
    <rect x="0" y="0" width="700" height="58" rx="16" ry="16" fill="rgba(15, 23, 42, 0.75)" stroke="#38bdf8" stroke-width="1.5" />
    <text x="350" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="24" fill="#ffffff" text-anchor="middle">पात्रता, तिथियां व डायरेक्ट अप्लाई ऑनलाइन लिंक</text>
  </g>

  <!-- Bottom Feature Badges -->
  <!-- Left Badge: DIRECT APPLY -->
  <g transform="translate(75, 520)">
    <rect x="0" y="0" width="340" height="60" rx="14" ry="14" fill="url(#badgeGrad)" filter="url(#shadow)" />
    <text x="170" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="22" fill="#0f172a" text-anchor="middle">⚡ DIRECT APPLY ONLINE</text>
  </g>

  <!-- Center Badge: OFFICIAL PDF -->
  <g transform="translate(435, 520)">
    <rect x="0" y="0" width="340" height="60" rx="14" ry="14" fill="url(#greenGrad)" filter="url(#shadow)" />
    <text x="170" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">✅ OFFICIAL PDF &amp; DATES</text>
  </g>

  <!-- Right Watermark Badge -->
  <g transform="translate(800, 520)">
    <rect x="0" y="0" width="325" height="60" rx="14" ry="14" fill="#1e293b" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
    <text x="162" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#38bdf8" text-anchor="middle">digitalhomeblog.in</text>
  </g>
</svg>`;

  // Encode SVG into high-compatibility Data URI
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Main auto banner generator exported function.
 * Always generates the state-of-the-art Custom Canvas Banner design SVG!
 */
async function generateAutoBanner(title, category = 'Sarkari Jobs & Exams') {
  try {
    return generateCustomCanvasSvg(title, category);
  } catch (err) {
    console.error('[AutoBanner] Error generating Custom Canvas SVG:', err.message);
    return generateCustomCanvasSvg('SARKARI JOB ONLINE FORM 2026', category);
  }
}

module.exports = { generateAutoBanner, generateCustomCanvasSvg };
