const https = require('https');
const http = require('http');

// Configuration and Thresholds
const TARGET_URL = process.env.TARGET_URL || process.argv[2] || 'https://www.digitalhomeblog.in';
const STRATEGY = (process.env.STRATEGY || 'desktop').toLowerCase();
const TARGET_SCORE = parseFloat(process.env.TARGET_SCORE || '85');
const TARGET_CLS = parseFloat(process.env.TARGET_CLS || '0.1');
const API_KEY = process.env.PAGESPEED_API_KEY || process.env.PSI_API_KEY || '';

function buildApiUrl(targetUrl, strategy, apiKey) {
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
  if (apiKey) {
    apiUrl += `&key=${encodeURIComponent(apiKey)}`;
  }
  return apiUrl;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'PageSpeedMonitor/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            return reject({
              statusCode: res.statusCode,
              error: parsed.error || { message: body.slice(0, 300) }
            });
          }
          resolve(parsed);
        } catch (err) {
          reject({ statusCode: res.statusCode, error: { message: `JSON Parse error: ${err.message}` } });
        }
      });
    });

    req.on('error', (err) => reject({ statusCode: 500, error: { message: err.message } }));
    req.setTimeout(60000, () => {
      req.destroy();
      reject({ statusCode: 504, error: { message: 'Request timed out after 60s' } });
    });
  });
}

async function runMonitor() {
  console.log('====================================================');
  console.log('🚀 PageSpeed Insights API Monitor');
  console.log(`🌐 Target URL: ${TARGET_URL}`);
  console.log(`📱 Strategy: ${STRATEGY}`);
  console.log(`🎯 Thresholds: Score >= ${TARGET_SCORE}, CLS < ${TARGET_CLS}`);
  if (API_KEY) {
    console.log('🔑 API Key: Configured');
  } else {
    console.log('⚠️  API Key: Not provided (unauthenticated rate limits apply)');
  }
  console.log('====================================================\n');

  const apiUrl = buildApiUrl(TARGET_URL, STRATEGY, API_KEY);

  try {
    const data = await fetchJson(apiUrl);
    const lh = data.lighthouseResult;
    if (!lh) {
      throw new Error('Invalid response structure: lighthouseResult missing');
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

    console.log('📊 AUDIT METRICS RESULTS:');
    console.log(`----------------------------------------------------`);
    console.log(`  • Overall Performance Score: ${score} / 100 ${score >= TARGET_SCORE ? '✅' : '❌'}`);
    console.log(`  • Cumulative Layout Shift (CLS): ${cls} ${cls < TARGET_CLS ? '✅' : '❌'}`);
    console.log(`  • Largest Contentful Paint (LCP): ${lcp}`);
    console.log(`  • Total Blocking Time (TBT): ${tbt}`);
    console.log(`  • First Contentful Paint (FCP): ${fcp}`);
    console.log(`  • Speed Index: ${speedIndex}`);
    console.log(`----------------------------------------------------\n`);

    let passed = true;
    const failureReasons = [];

    if (score < TARGET_SCORE) {
      passed = false;
      failureReasons.push(`Performance score (${score}) is below target threshold (${TARGET_SCORE})`);
    }

    if (cls >= TARGET_CLS) {
      passed = false;
      failureReasons.push(`CLS (${cls}) exceeds maximum threshold (${TARGET_CLS})`);
    }

    if (!passed) {
      console.error('❌ PERFORMANCE THRESHOLD CHECK FAILED!');
      failureReasons.forEach(reason => console.error(`  - ${reason}`));

      // Log Layout Shift Culprits if present
      const clsElementsAudit = audits['layout-shift-elements'];
      if (clsElementsAudit && clsElementsAudit.details && clsElementsAudit.details.items?.length > 0) {
        console.log('\n🔍 CUMULATIVE LAYOUT SHIFT (CLS) CULPRITS:');
        clsElementsAudit.details.items.forEach((item, i) => {
          const node = item.node || {};
          console.log(`  ${i + 1}. Element: "${node.snippet || node.nodeLabel || 'Unknown node'}" (Score contribution: ${item.score?.toFixed(4) || 'N/A'})`);
        });
      }

      // Log Render Blocking Resources if present
      const renderBlocking = audits['render-blocking-resources'];
      if (renderBlocking && renderBlocking.details && renderBlocking.details.items?.length > 0) {
        console.log('\n⏳ RENDER BLOCKING RESOURCES:');
        renderBlocking.details.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.url} (Wasted ms: ${item.wastedMs}ms)`);
        });
      }

      // Log Unused JavaScript if present
      const unusedJs = audits['unused-javascript'];
      if (unusedJs && unusedJs.details && unusedJs.details.items?.length > 0) {
        console.log('\n📦 UNUSED JAVASCRIPT PAYLOADS:');
        unusedJs.details.items.slice(0, 5).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.url} (Wasted Bytes: ${Math.round((item.wastedBytes || 0) / 1024)} KB)`);
        });
      }

      process.exit(1);
    } else {
      console.log('🎉 ALL PERFORMANCE AUDIT THRESHOLDS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('⚠️ Error executing PageSpeed Insights Audit:');
    if (err.error) {
      console.error(`  Code: ${err.statusCode || 'N/A'}`);
      console.error(`  Message: ${err.error.message || JSON.stringify(err.error)}`);
      if (err.statusCode === 429) {
        console.error('\n💡 HINT: Google PageSpeed Insights API quota exceeded when unauthenticated.');
        console.error('   Please set environment variable PAGESPEED_API_KEY or PSI_API_KEY with your Google Cloud API key.');
      }
    } else {
      console.error(`  ${err.message || err}`);
    }
    process.exit(1);
  }
}

runMonitor();
