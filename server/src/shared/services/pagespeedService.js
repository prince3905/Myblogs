const axios = require('axios');

async function runPageSpeedAudit(targetUrl = 'https://www.digitalhomeblog.in', strategy = 'desktop') {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY || process.env.PSI_API_KEY || '';
    let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
    if (apiKey) {
      apiUrl += `&key=${encodeURIComponent(apiKey)}`;
    }

    console.log(`[PageSpeed Service] Running ${strategy} audit for ${targetUrl}...`);
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

    // Layout shift culprits
    const clsElements = (audits['layout-shift-elements']?.details?.items || []).map(item => ({
      snippet: item.node?.snippet || item.node?.nodeLabel || 'Unknown Element',
      score: item.score ? item.score.toFixed(4) : '0'
    }));

    // Render blocking resources
    const renderBlocking = (audits['render-blocking-resources']?.details?.items || []).map(item => ({
      url: item.url,
      wastedMs: item.wastedMs
    }));

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
        speedIndex
      },
      diagnostics: {
        clsElements,
        renderBlocking
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
