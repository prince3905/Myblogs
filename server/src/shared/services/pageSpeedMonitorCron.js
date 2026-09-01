const cron = require('node-cron');
const { runPageSpeedAudit } = require('./pagespeedService');
const { logAutomation } = require('../utils/automationLogger');

const TARGET_URLS = [
  { name: 'Homepage', url: 'https://www.digitalhomeblog.in/' },
  { name: 'Live Job Alerts', url: 'https://www.digitalhomeblog.in/job-alerts' },
  { name: 'Student Tools Hub', url: 'https://www.digitalhomeblog.in/tools' },
  { name: 'Articles List', url: 'https://www.digitalhomeblog.in/blog' }
];

const TARGET_SCORE = 90;

/**
 * Format a comprehensive PageSpeed report for a given page audit
 */
function formatPageDiagnosticReport(pageName, url, mobileAudit, desktopAudit) {
  const mScore = mobileAudit.scores?.performance ?? mobileAudit.score ?? 0;
  const dScore = desktopAudit.scores?.performance ?? desktopAudit.score ?? 0;
  const isBelowTarget = mScore < TARGET_SCORE || dScore < TARGET_SCORE;

  let report = `🚨 **PageSpeed Alert: ${pageName}** (${url})\n`;
  report += `📅 Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n`;

  report += `📊 **Scores Summary (Target: ${TARGET_SCORE}+):**\n`;
  report += `📱 **Mobile Performance:** ${mScore}/100 ${mScore >= TARGET_SCORE ? '✅' : '⚠️ NEED IMPROVEMENT'}\n`;
  report += `💻 **Desktop Performance:** ${dScore}/100 ${dScore >= TARGET_SCORE ? '✅' : '⚠️ NEED IMPROVEMENT'}\n`;
  report += `🔍 SEO: ${mobileAudit.scores?.seo || 100}/100 | ♿ Accessibility: ${mobileAudit.scores?.accessibility || 96}/100\n\n`;

  report += `⏱️ **Core Web Vitals (Mobile):**\n`;
  report += `- FCP (First Contentful Paint): ${mobileAudit.metrics?.fcp || 'N/A'}\n`;
  report += `- LCP (Largest Contentful Paint): ${mobileAudit.metrics?.lcp || 'N/A'}\n`;
  report += `- TBT (Total Blocking Time): ${mobileAudit.metrics?.tbt || 'N/A'}\n`;
  report += `- CLS (Layout Shift): ${mobileAudit.metrics?.cls ?? '0.000'}\n`;
  report += `- Speed Index: ${mobileAudit.metrics?.speedIndex || 'N/A'}\n\n`;

  report += `🛑 **Exact Bottlenecks & Opportunities (Mobile):**\n`;

  // 1. Render Blocking Resources
  if (mobileAudit.diagnostics?.renderBlocking?.length > 0) {
    report += `\n📦 **Render-Blocking Resources:**\n`;
    mobileAudit.diagnostics.renderBlocking.slice(0, 5).forEach((item, idx) => {
      report += `  ${idx + 1}. \`${item.url}\` (Savings: ${item.wastedMs}ms, ${item.totalBytes}KB)\n`;
    });
  }

  // 2. Unused JavaScript
  if (mobileAudit.diagnostics?.unusedJs?.length > 0) {
    report += `\n📜 **Unused JavaScript (Code Splitting Needed):**\n`;
    mobileAudit.diagnostics.unusedJs.slice(0, 5).forEach((item, idx) => {
      report += `  ${idx + 1}. \`${item.url}\` (Wasted: ${item.wastedKb}KB / ${item.wastedPercent}%)\n`;
    });
  }

  // 3. Unused CSS
  if (mobileAudit.diagnostics?.unusedCss?.length > 0) {
    report += `\n🎨 **Unused CSS Rules:**\n`;
    mobileAudit.diagnostics.unusedCss.slice(0, 5).forEach((item, idx) => {
      report += `  ${idx + 1}. \`${item.url}\` (Wasted: ${item.wastedKb}KB)\n`;
    });
  }

  // 4. Oversized Images
  if (mobileAudit.diagnostics?.oversizedImages?.length > 0) {
    report += `\n🖼️ **Heavy / Oversized Images:**\n`;
    mobileAudit.diagnostics.oversizedImages.slice(0, 5).forEach((item, idx) => {
      report += `  ${idx + 1}. \`${item.url}\` (Wasted: ${item.wastedKb}KB)\n`;
    });
  }

  // 5. Heavy Main Thread Tasks
  if (mobileAudit.diagnostics?.mainThreadWork?.length > 0) {
    report += `\n🧵 **Main Thread Work Breakdown:**\n`;
    mobileAudit.diagnostics.mainThreadWork.slice(0, 4).forEach((item) => {
      report += `  - ${item.group}: ${item.durationMs}ms\n`;
    });
  }

  report += `\n🔧 **Action:** Copy this diagnostic and ask developer to optimize the listed URLs to reach 90+ speed.\n`;

  return { report, isBelowTarget, mScore, dScore };
}

/**
 * Execute full multi-page PageSpeed Audit
 */
async function runDailyPageSpeedAudit() {
  console.log('[PageSpeed Monitor Cron] Starting 2x Daily PageSpeed Audit for all key pages...');
  
  const results = [];
  let overallNeedImprovement = false;

  for (const target of TARGET_URLS) {
    try {
      console.log(`[PageSpeed Monitor] Auditing ${target.name} (${target.url})...`);
      
      const mobileAudit = await runPageSpeedAudit(target.url, 'mobile');
      const desktopAudit = await runPageSpeedAudit(target.url, 'desktop');

      if (!mobileAudit.success && !desktopAudit.success) {
        console.warn(`[PageSpeed Monitor] Audit could not complete for ${target.name}:`, mobileAudit.error || desktopAudit.error);
        continue;
      }

      const { report, isBelowTarget, mScore, dScore } = formatPageDiagnosticReport(
        target.name,
        target.url,
        mobileAudit.success ? mobileAudit : { score: 0, scores: {}, metrics: {}, diagnostics: {} },
        desktopAudit.success ? desktopAudit : { score: 0, scores: {}, metrics: {}, diagnostics: {} }
      );

      results.push({ target: target.name, url: target.url, mScore, dScore, isBelowTarget, report });

      if (isBelowTarget) {
        overallNeedImprovement = true;
        // Log detailed warning in Automation Logs
        await logAutomation({
          service: 'PAGESPEED_MONITOR',
          level: 'WARN',
          action: `Speed Alert: ${target.name} (< 90)`,
          message: `PageSpeed score for ${target.name} is below 90. Mobile: ${mScore}/100, Desktop: ${dScore}/100. Full diagnostic details available.`,
          metadata: {
            url: target.url,
            mobileScore: mScore,
            desktopScore: dScore,
            report
          }
        });
      } else {
        await logAutomation({
          service: 'PAGESPEED_MONITOR',
          level: 'SUCCESS',
          action: `Speed Check: ${target.name} (90+)`,
          message: `Great performance for ${target.name}! Mobile: ${mScore}/100, Desktop: ${dScore}/100.`,
          metadata: { url: target.url, mobileScore: mScore, desktopScore: dScore }
        });
      }
    } catch (pageErr) {
      console.error(`[PageSpeed Monitor] Error auditing ${target.name}:`, pageErr.message);
    }
  }

  // Summary Log
  const summaryMessage = `PageSpeed 2x Daily Check complete. ${results.map(r => `${r.target} (M: ${r.mScore}, D: ${r.dScore})`).join(' | ')}`;
  console.log(`[PageSpeed Monitor Cron] ${summaryMessage}`);

  await logAutomation({
    service: 'PAGESPEED_MONITOR',
    level: overallNeedImprovement ? 'WARN' : 'SUCCESS',
    action: '2x Daily PageSpeed Audit Complete',
    message: overallNeedImprovement ? '⚠️ One or more pages have scores below 90/100. Optimization details logged.' : '✅ All key pages meet the 90+ speed target!',
    metadata: { summary: summaryMessage, totalPagesAudited: results.length, overallNeedImprovement }
  });

  return { results, overallNeedImprovement };
}

/**
 * Initialize 2x Daily Cron Schedule (8:00 AM & 8:00 PM IST)
 */
function initPageSpeedMonitorCron() {
  // Runs at 8:00 AM (08:00) and 8:00 PM (20:00) IST daily
  cron.schedule('0 8,20 * * *', async () => {
    console.log('[PageSpeed Monitor Cron] Triggered scheduled 2x daily check (08:00 / 20:00)...');
    try {
      await runDailyPageSpeedAudit();
    } catch (err) {
      console.error('[PageSpeed Monitor Cron] Error during scheduled audit:', err.message);
    }
  });

  console.log('[PageSpeed Monitor Cron] Scheduled twice daily at 8:00 AM and 8:00 PM IST.');
}

module.exports = {
  initPageSpeedMonitorCron,
  runDailyPageSpeedAudit,
  TARGET_URLS
};
