const axios = require('axios');

async function runPageSpeedAudit(targetUrl = 'https://www.digitalhomeblog.in', strategy = 'desktop') {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY || process.env.PSI_API_KEY || process.env.GEMINI_API_KEY || '';
    let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
    if (apiKey) {
      apiUrl += `&key=${encodeURIComponent(apiKey)}`;
    }

    console.log(`[PageSpeed Service] Running ${strategy} deep diagnostic audit for ${targetUrl}...`);
    const response = await axios.get(apiUrl, { timeout: 60000 });
    const data = response.data;

    const lh = data.lighthouseResult;
    if (!lh) {
      throw new Error('Invalid Google PageSpeed response: missing lighthouseResult');
    }

    const categories = lh.categories || {};
    const audits = lh.audits || {};

    const score = categories.performance ? Math.round(categories.performance.score * 100) : 0;
    const clsAudit = audits['cumulative-layout-shift'] || {};
    const lcpAudit = audits['largest-contentful-paint'] || {};
    const tbtAudit = audits['total-blocking-time'] || {};
    const fcpAudit = audits['first-contentful-paint'] || {};
    const speedIndexAudit = audits['speed-index'] || {};

    const cls = clsAudit.numericValue !== undefined ? parseFloat(clsAudit.numericValue.toFixed(4)) : 0;
    const lcp = lcpAudit.displayValue || (lcpAudit.numericValue ? `${Math.round(lcpAudit.numericValue)} ms` : 'N/A');
    const tbt = tbtAudit.displayValue || (tbtAudit.numericValue ? `${Math.round(tbtAudit.numericValue)} ms` : 'N/A');
    const fcp = fcpAudit.displayValue || (fcpAudit.numericValue ? `${Math.round(fcpAudit.numericValue)} ms` : 'N/A');
    const speedIndex = speedIndexAudit.displayValue || (speedIndexAudit.numericValue ? `${Math.round(speedIndexAudit.numericValue)} ms` : 'N/A');

    // 1. Layout Shift Culprit Elements
    const clsElements = (audits['layout-shift-elements']?.details?.items || []).map(item => ({
      snippet: item.node?.snippet || item.node?.nodeLabel || item.node?.selector || 'Unknown Element',
      selector: item.node?.selector || '',
      score: item.score ? item.score.toFixed(4) : '0'
    }));

    // 2. Render Blocking Resources (CSS / JS)
    const renderBlocking = (audits['render-blocking-resources']?.details?.items || []).map(item => ({
      url: item.url,
      wastedMs: Math.round(item.wastedMs || 0),
      totalBytes: Math.round((item.totalBytes || 0) / 1024)
    }));

    // 3. Unused JavaScript Payload
    const unusedJs = (audits['unused-javascript']?.details?.items || []).map(item => ({
      url: item.url,
      wastedKb: Math.round((item.wastedBytes || 0) / 1024),
      wastedPercent: Math.round(item.wastedPercent || 0)
    }));

    // 4. Unused CSS Rules
    const unusedCss = (audits['unused-css-rules']?.details?.items || []).map(item => ({
      url: item.url,
      wastedKb: Math.round((item.wastedBytes || 0) / 1024)
    }));

    // 5. Oversized Images & Formatting
    const oversizedImages = (audits['offscreen-images']?.details?.items || [])
      .concat(audits['uses-responsive-images']?.details?.items || [])
      .concat(audits['uses-optimized-images']?.details?.items || [])
      .map(item => ({
        url: item.url,
        wastedKb: Math.round((item.wastedBytes || 0) / 1024)
      })).filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

    // 6. DOM Element Count
    const domCount = audits['dom-size']?.numericValue || 0;

    // Build Actionable Agent Fix Suggestions
    const fixSuggestions = [];
    if (cls >= 0.1) {
      fixSuggestions.push(`[CLS Fix Required] Cumulative Layout Shift is ${cls}. Check layout shift culprit elements (${clsElements.length} found) and add explicit width/height or aspect-ratio wrappers.`);
    }
    if (renderBlocking.length > 0) {
      fixSuggestions.push(`[Render Blocking Fix] ${renderBlocking.length} resources are blocking render. Consider deferring scripts or async loading stylesheets.`);
    }
    if (unusedJs.length > 0) {
      fixSuggestions.push(`[JS Code Splitting] Unused JS detected in ${unusedJs.length} chunks. Use Vite manualChunks or dynamic React.lazy imports.`);
    }
    if (oversizedImages.length > 0) {
      fixSuggestions.push(`[Image Compression Fix] ${oversizedImages.length} images can be compressed or converted to WebP format.`);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      strategy,
      targetUrl,
      score,
      metrics: {
        cls,
        lcp,
        tbt,
        fcp,
        speedIndex,
        domCount
      },
      diagnostics: {
        clsElements,
        renderBlocking,
        unusedJs,
        unusedCss,
        oversizedImages,
        fixSuggestions
      }
    };
  } catch (err) {
    console.error('[PageSpeed Service] Audit failed:', err.response?.data?.error?.message || err.message);
    const statusCode = err.response?.status;
    let userMsg = err.response?.data?.error?.message || err.message;
    if (statusCode === 429) {
      userMsg = 'Quota exceeded when unauthenticated. Please configure PAGESPEED_API_KEY in .env.';
    }
    return {
      success: false,
      error: userMsg,
      statusCode
    };
  }
}

module.exports = { runPageSpeedAudit };
