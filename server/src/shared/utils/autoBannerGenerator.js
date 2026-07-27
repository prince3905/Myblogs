/**
 * Server-side Auto Canvas Banner SVG Generator.
 * Replicates the EXACT HTML5 Canvas Banner Designer logic from PostEditorPage.jsx 1:1.
 * 
 * Generates identical SVG Data URI thumbnails with:
 * - 1200x675 canvas size
 * - Theme gradients (Bank, Police, Defense, Orange, Emerald, Modern Purple)
 * - Brand header: DIGITAL HOME BLOG • Official Portal Updates • 2026
 * - Top Right Pill Tag: Dynamic Emblem Badge (e.g. 🛡️ POLICE RECRUITMENT, 🏛️ SSC EXAM, 🏦 BANK SO EXAM)
 * - Main Title: Large bold ALL-CAPS font with text wrapping
 * - Subtitle: Hindi subtitle ("पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक")
 * - Bottom Badges: [✔ OFFICIAL FORM] [⚡ DIRECT LINK] [📄 NOTIFICATION PDF]
 */

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
  if (t.includes('army') || t.includes('navy') || t.includes('defence') || t.includes('iaf')) {
    return { stop0: '#090514', stop1: '#1e1b4b', accentGlow: '#a78bfa', pillBg: '#c084fc' };
  }
  if (t.includes('ssc') || t.includes('upsssc') || t.includes('railway')) {
    return { stop0: '#1e293b', stop1: '#ea580c', accentGlow: '#fbbf24', pillBg: '#fde047' };
  }
  return { stop0: '#0f051d', stop1: '#6b21a8', accentGlow: '#e879f9', pillBg: '#f0abfc' };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateExactCanvasSvg(title, category = 'Sarkari Jobs & Exams') {
  const cleanTitle = (title || 'SARKARI JOB ONLINE FORM 2026')
    .split(/[:|]/)[0]
    .replace(/<\/?[^>]+>/g, '')
    .trim()
    .toUpperCase();

  const hindiSubtitle = 'पात्रता, तिथियां व डायरेक्ट अप्लाई लिंक';

  const theme = detectThemeColors(cleanTitle, category);
  const emblem = detectOrgEmblem(cleanTitle, category);

  // Wrap Main Title Text (Max 1050px width, max 2-3 lines)
  const words = cleanTitle.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    if (testLine.length > 28 && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Dynamic Font Size based on title length
  let fontSize = 80;
  let lineGap = 90;
  if (cleanTitle.length > 55) {
    fontSize = 58;
    lineGap = 68;
  } else if (cleanTitle.length > 35) {
    fontSize = 68;
    lineGap = 78;
  }

  let startY = 230;
  if (lines.length > 2) startY = 200;

  let currentY = startY;
  const titleTspans = lines.map((l) => {
    const tspan = `<tspan x="75" y="${currentY}">${escapeXml(l)}</tspan>`;
    currentY += lineGap;
    return tspan;
  }).join('\n    ');

  // Hindi Subtitle Position
  const hindiY = currentY + 45;

  // Bottom Badges Position
  const badgesY = hindiY + 65;

  const escEmblemCode = escapeXml(`${emblem.symbol} ${emblem.code}`);
  const escHindiSubtitle = escapeXml(hindiSubtitle);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.stop0}" />
      <stop offset="100%" stop-color="${theme.stop1}" />
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.95" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${theme.accentGlow}" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />

  <!-- Diagonal Aesthetic Mesh Overlay -->
  <polygon points="600,0 1200,0 1200,675 420,675" fill="#ffffff" fill-opacity="0.03" />

  <!-- Outer Glowing Rounded Frame Inset (35px margin) -->
  <rect x="35" y="35" width="1130" height="605" rx="20" ry="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" filter="url(#glow)" />

  <!-- Brand Title text (Top Left) -->
  <text x="75" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#10b981" filter="url(#dropShadow)">DIGITAL HOME BLOG</text>
  <text x="75" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#ffffff" opacity="0.75">Official Portal Updates • 2026</text>

  <!-- Top Right Emblem Pill Tag -->
  <g transform="translate(810, 60)">
    <rect x="0" y="0" width="315" height="52" rx="26" ry="26" fill="${emblem.bgCircle}" stroke="${emblem.primaryColor}" stroke-width="2.5" />
    <text x="157" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">${escEmblemCode}</text>
  </g>

  <!-- Main English Title (ALL-CAPS with text wrapping) -->
  <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="${fontSize}" fill="${theme.pillBg}" filter="url(#dropShadow)">
    ${titleTspans}
  </text>

  <!-- Hindi Subtitle -->
  <text x="75" y="${hindiY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="56" fill="#ffffff" filter="url(#dropShadow)">${escHindiSubtitle}</text>

  <!-- Bottom Badges -->
  <!-- Badge 1: OFFICIAL FORM -->
  <g transform="translate(75, ${badgesY})">
    <rect x="0" y="0" width="260" height="52" rx="14" ry="14" fill="${theme.pillBg}" />
    <text x="130" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#0f172a" text-anchor="middle">✔ OFFICIAL FORM</text>
  </g>

  <!-- Badge 2: DIRECT LINK -->
  <g transform="translate(355, ${badgesY})">
    <rect x="0" y="0" width="230" height="52" rx="14" ry="14" fill="#10b981" />
    <text x="115" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#ffffff" text-anchor="middle">⚡ DIRECT LINK</text>
  </g>

  <!-- Badge 3: NOTIFICATION PDF -->
  <g transform="translate(605, ${badgesY})">
    <rect x="0" y="0" width="310" height="52" rx="14" ry="14" fill="rgba(255, 255, 255, 0.22)" />
    <text x="155" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="23" fill="#ffffff" text-anchor="middle">📄 NOTIFICATION PDF</text>
  </g>
</svg>`;

  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Main exported function: Generates identical Custom Canvas SVG Banner 1:1 with PostEditorPage designer!
 */
async function generateAutoBanner(title, category = 'Sarkari Jobs & Exams') {
  try {
    return generateExactCanvasSvg(title, category);
  } catch (err) {
    console.error('[AutoBanner] SVG generation notice:', err.message);
    return generateExactCanvasSvg('SARKARI JOB ONLINE FORM 2026', category);
  }
}

module.exports = { generateAutoBanner, generateExactCanvasSvg };
