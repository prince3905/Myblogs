/**
 * Automated Competitor Link Purge & Official Portal Resolution Daemon
 * Continuously runs to guarantee 100% ZERO competitor links (SarkariResult, FreeJobAlert, etc.) across the database.
 * Automatically resolves missing or competitor links to authentic official government portals.
 */

const mongoose = require('mongoose');
const { resolveOfficialGovtPortal } = require('./govtPortalMap');
const { logAutomation } = require('./automationLogger');

const COMPETITOR_REGEX = /sarkariresult|freejobalert|sarkari-result|sarkariexam|jobalerts|rojgarresult|t\.me\/sarkari|0029Va5IElwBlHpVBd6i5a18|app14f269771c01/i;

function cleanStringText(str = '', title = '', category = '') {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/^.*(?:source\s*link|source\s*url|source\s*:).*$/gim, '')
    .replace(/https?:\/\/(?:www\.)?(?:sarkariresult|freejobalert|sarkariexam|jobalerts|rojgarresult)\.com[^\s"'\)<>]*/gi, () => {
      return resolveOfficialGovtPortal(title, category, '');
    })
    .replace(/https?:\/\/t\.me\/sarkari[^\s"'<>]*/gi, 'https://t.me/digitalhomeblog')
    .replace(/https?:\/\/whatsapp\.com\/channel\/0029Va5IElwBlHpVBd6i5a18/gi, 'https://whatsapp.com/channel/digitalhome')
    .replace(/sarkari\s*result\s*official\s*(?:website|app|portal|tools?)/gi, 'Official Government Portal')
    .replace(/sarkari\s*result\s*(?:tools?|resizer|cropper|compressor)/gi, 'Student Utility Tools')
    .replace(/sarkari\s*result/gi, 'Official Portal')
    .replace(/sarkariresult/gi, 'Official Portal')
    .replace(/sarkari\s*resut/gi, 'Official Portal')
    .replace(/sarkari\s*reult/gi, 'Official Portal')
    .replace(/freejobalert/gi, 'Official Portal')
    .replace(/sarkariexam/gi, 'Official Portal')
    .replace(/rojgarresult/gi, 'Official Portal');
}

function cleanPostHtmlContent(content = '', postTitle = '', postCategory = '') {
  if (!content || typeof content !== 'string') return content;
  let cleaned = content;

  // 1. Replace all competitor <a> links with official government portal or /tools
  cleaned = cleaned.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>(.*?)<\/a>/gi, (match, beforeHref, href, afterHref, anchorText) => {
    const lowerHref = href.toLowerCase();
    const lowerAnchor = anchorText.toLowerCase();

    const isCompetitor = COMPETITOR_REGEX.test(lowerHref);
    const isTool = lowerHref.includes('tool') || lowerHref.includes('resize') || lowerHref.includes('compress') || lowerHref.includes('crop') || lowerAnchor.includes('tool') || lowerAnchor.includes('resize') || lowerAnchor.includes('compress') || lowerAnchor.includes('resizer');

    if (isCompetitor) {
      if (isTool) {
        return `<a ${beforeHref}href="/tools"${afterHref}>Student Utility Tools</a>`;
      }
      const officialGovtUrl = resolveOfficialGovtPortal(postTitle, postCategory, href);
      return `<a ${beforeHref}href="${officialGovtUrl}"${afterHref}>${cleanStringText(anchorText)}</a>`;
    }

    return match;
  });

  // 2. Replace raw URLs in text
  cleaned = cleaned.replace(/(https?:\/\/[^\s<"'`()]+(?:sarkariresult\.com\/tools|sarkariresult\.com\/resizer|sarkariresult\.tools|freejobalert\.com\/tools|ilovepdf\.com|imageresizer\.com)[^\s<"'`()]*)/gi, '/tools');
  cleaned = cleaned.replace(/(https?:\/\/[^\s<"'`()]+(?:sarkariresult|freejobalert|sarkariexam|jobalerts)[^\s<"'`()]*)/gi, (match) => {
    return resolveOfficialGovtPortal(postTitle, postCategory, match);
  });

  // 3. Clean remaining text mentions
  cleaned = cleanStringText(cleaned);

  return cleaned;
}

async function runCompetitorPurge() {
  let fixedPostsCount = 0;
  let fixedAlertsCount = 0;

  try {
    const BlogPost = mongoose.model('BlogPost');
    const LiveAlert = mongoose.model('LiveAlert');

    // 1. Purge & Fix Blog Posts
    const posts = await BlogPost.find({
      $or: [
        { content: { $regex: COMPETITOR_REGEX } },
        { excerpt: { $regex: COMPETITOR_REGEX } },
        { title: { $regex: COMPETITOR_REGEX } },
        { seoTitle: { $regex: COMPETITOR_REGEX } },
        { seoDescription: { $regex: COMPETITOR_REGEX } },
        { canonicalUrl: { $regex: COMPETITOR_REGEX } }
      ]
    });

    for (const post of posts) {
      let changed = false;

      if (post.title && COMPETITOR_REGEX.test(post.title)) {
        post.title = cleanStringText(post.title);
        changed = true;
      }
      if (post.excerpt && COMPETITOR_REGEX.test(post.excerpt)) {
        post.excerpt = cleanStringText(post.excerpt);
        changed = true;
      }
      if (post.content && COMPETITOR_REGEX.test(post.content)) {
        post.content = cleanPostHtmlContent(post.content, post.title, post.category);
        changed = true;
      }
      if (post.seoTitle && COMPETITOR_REGEX.test(post.seoTitle)) {
        post.seoTitle = cleanStringText(post.seoTitle);
        changed = true;
      }
      if (post.seoDescription && COMPETITOR_REGEX.test(post.seoDescription)) {
        post.seoDescription = cleanStringText(post.seoDescription);
        changed = true;
      }
      if (post.canonicalUrl && COMPETITOR_REGEX.test(post.canonicalUrl)) {
        post.canonicalUrl = resolveOfficialGovtPortal(post.title, post.category, post.canonicalUrl);
        changed = true;
      }

      if (changed) {
        await BlogPost.updateOne(
          { _id: post._id },
          {
            $set: {
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
              canonicalUrl: post.canonicalUrl
            }
          }
        );
        fixedPostsCount++;
      }
    }

    // 2. Purge & Fix Live Alerts in batches until 0 remaining
    let totalPurgedAlerts = 0;
    let batchNumber = 0;
    while (true) {
      batchNumber++;
      const alerts = await LiveAlert.find({
        $or: [
          { officialUrl: { $regex: COMPETITOR_REGEX } },
          { officialApplyUrl: { $regex: COMPETITOR_REGEX } },
          { officialPdfUrl: { $regex: COMPETITOR_REGEX } },
          { detailsText: { $regex: COMPETITOR_REGEX } },
          { title: { $regex: COMPETITOR_REGEX } },
          { source: { $regex: /sarkari/i } }
        ]
      }).limit(500);

      if (!alerts || alerts.length === 0) break;
      console.log(`[Competitor Link Purge] Processing LiveAlert batch ${batchNumber} (${alerts.length} matching alerts)...`);

      const bulkOps = [];
      for (const alert of alerts) {
        let changed = false;
        const safeGovtUrl = resolveOfficialGovtPortal(alert.title, alert.boardName, alert.sourceUrl);

        let newOfficialUrl = alert.officialUrl;
        let newApplyUrl = alert.officialApplyUrl;
        let newPdfUrl = alert.officialPdfUrl;
        let newTitle = alert.title;
        let newSource = alert.source;
        let newDetailsText = alert.detailsText;

        if (!newOfficialUrl || COMPETITOR_REGEX.test(newOfficialUrl)) {
          newOfficialUrl = safeGovtUrl;
          changed = true;
        }
        if (!newApplyUrl || COMPETITOR_REGEX.test(newApplyUrl)) {
          newApplyUrl = safeGovtUrl;
          changed = true;
        }
        if (!newPdfUrl || COMPETITOR_REGEX.test(newPdfUrl)) {
          newPdfUrl = safeGovtUrl;
          changed = true;
        }
        if (newTitle && COMPETITOR_REGEX.test(newTitle)) {
          newTitle = cleanStringText(newTitle);
          changed = true;
        }
        if (newSource && /sarkari/i.test(newSource)) {
          newSource = 'Official Portal';
          changed = true;
        }
        if (newDetailsText && COMPETITOR_REGEX.test(newDetailsText)) {
          newDetailsText = cleanStringText(newDetailsText)
            .replace(/(?:https?:\/\/)?(?:www\.)?(?:sarkariresult|freejobalert|sarkari-result|sarkariexam|jobalerts)\.com[^\s,)\'\"]*/gi, safeGovtUrl);
          changed = true;
        }

        if (changed) {
          bulkOps.push({
            updateOne: {
              filter: { _id: alert._id },
              update: {
                $set: {
                  officialUrl: newOfficialUrl,
                  officialApplyUrl: newApplyUrl,
                  officialPdfUrl: newPdfUrl,
                  title: newTitle,
                  source: newSource,
                  detailsText: newDetailsText
                }
              }
            }
          });
        }
      }

      if (bulkOps.length > 0) {
        await LiveAlert.bulkWrite(bulkOps);
        totalPurgedAlerts += bulkOps.length;
      } else {
        break;
      }
    }
    fixedAlertsCount = totalPurgedAlerts;

    if (fixedPostsCount > 0 || fixedAlertsCount > 0) {
      console.log(`[Competitor Link Purge] Success! Cleaned & resolved ${fixedPostsCount} posts and ${fixedAlertsCount} alerts to authentic government portals.`);
      logAutomation({
        service: 'SYSTEM_CRON',
        level: 'SUCCESS',
        action: '5m Competitor Link Purge',
        message: `Purged competitor links: Fixed ${fixedPostsCount} blog posts and ${fixedAlertsCount} live alerts.`,
        metadata: { fixedPostsCount, fixedAlertsCount }
      });
    }

    return { fixedPostsCount, fixedAlertsCount };
  } catch (err) {
    console.error('[Competitor Link Purge] Error during purge run:', err.message);
    logAutomation({
      service: 'SYSTEM_CRON',
      level: 'ERROR',
      action: 'Competitor Link Purge Failed',
      message: err.message
    });
    return { fixedPostsCount, fixedAlertsCount, error: err.message };
  }
}

module.exports = {
  runCompetitorPurge,
  cleanStringText,
  cleanPostHtmlContent
};
