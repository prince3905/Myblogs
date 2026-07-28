/**
 * Natural Indian Search Intent & Long-Tail Keyword Automator Engine
 * Seamlessly weaves short-tail & long-tail Hinglish search phrases into articles
 * to achieve Rank 1 on Google Search for specific high-volume queries.
 */

function generateIndianSearchVariants(title = '', focusKeyword = '') {
  let base = (focusKeyword || title).replace(/[^\w\s\u0900-\u097F]/gi, '').trim();

  // Clean trailing branding
  base = base.replace(/\s*(Digital Home|Sarkari Result|Apply Now|Direct Link)\s*/gi, '').trim();
  if (!base.includes('2026') && !base.includes('2027')) {
    base += ' 2026';
  }

  return [
    {
      type: 'Direct Link Query',
      phrase: `${base} direct link kaise download kare`,
      tag: '🔥 Clicks Intent'
    },
    {
      type: 'Official Portal Query',
      phrase: `${base} official website link check digital home portal`,
      tag: '🎯 Trust Intent'
    },
    {
      type: 'Date & Schedule Query',
      phrase: `${base} exam date & last date kab aayega`,
      tag: '⚡ Urgency Intent'
    },
    {
      type: 'Step by Step Query',
      phrase: `${base} online application form step by step process in Hindi`,
      tag: '📌 Informational Intent'
    }
  ];
}

/**
 * Injects a natural, Google-friendly "Search Queries Overview" box into article HTML
 */
function injectNaturalKeywordBox(content = '', title = '', focusKeyword = '') {
  if (!content) return content;

  // Don't duplicate if already injected
  if (content.includes('search-intent-box') || content.includes('Frequent Google Search Queries')) {
    return content;
  }

  const variants = generateIndianSearchVariants(title, focusKeyword);

  const boxHtml = `
<div class="search-intent-box" style="background:#F0FDF4; border-left:4px solid #16A34A; padding:18px; margin:24px 0; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
  <h4 style="margin:0 0 12px 0; color:#15803D; font-size:1.05rem; font-weight:700; display:flex; align-items:center; gap:8px;">
    🔍 Frequently Google Searched Queries (मुख्य खोज प्रश्न)
  </h4>
  <ul style="margin:0; padding-left:20px; color:#1F2937; font-size:0.92rem; line-height:1.75;">
    ${variants.map(v => `
      <li style="margin-bottom:6px;">
        <strong style="color:#065F46;">${v.phrase}:</strong> 
        <span style="color:#4B5563; font-size:0.85rem;">[${v.tag}]</span>
      </li>
    `).join('')}
  </ul>
</div>
`;

  // Inject after the first H2 tag or first table or paragraph
  if (content.includes('</h2>')) {
    return content.replace('</h2>', `</h2>\n${boxHtml}`);
  } else if (content.includes('</table>')) {
    return content.replace('</table>', `</table>\n${boxHtml}`);
  } else if (content.includes('</p>')) {
    return content.replace('</p>', `</p>\n${boxHtml}`);
  }

  return content + boxHtml;
}

module.exports = {
  generateIndianSearchVariants,
  injectNaturalKeywordBox
};
