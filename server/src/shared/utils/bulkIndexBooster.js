const mongoose = require('mongoose');
const { notifyUrl, notifyBatchIndexNow, pingSitemapEngines } = require('./google-indexing');
const { logAutomation } = require('./automationLogger');

/**
 * 360° Comprehensive Sweeper: Bulk Indexes All Live Vacancies, Alerts, Stories & Posts
 * 1. Collects all canonical URLs across Indian Sarkari, Global Jobs, Web Stories, and Blog Posts.
 * 2. Pushes all URLs in batches of 500 to IndexNow (Bing, Yandex, Seznam, Naver).
 * 3. Pushes top priority un-indexed URLs to Google Indexing API (capped safely under daily limit).
 * 4. Triggers Sitemap Ping to Google & Bing.
 */
async function runBulkIndexSweep() {
  console.log('[Bulk Index Sweep] Starting comprehensive 360° site-wide indexing sweep...');
  
  try {
    const host = 'https://www.digitalhomeblog.in';
    const allUrls = [];

    // 1. Core Hub URLs
    allUrls.push(
      `${host}`,
      `${host}/india/sarkari-jobs`,
      `${host}/global-jobs`,
      `${host}/global-news`,
      `${host}/tools`,
      `${host}/india/current-affairs`
    );

    // 2. Blog Posts
    try {
      require('../../modules/posts/post.model');
      const BlogPost = mongoose.model('BlogPost');
      const posts = await BlogPost.find({ status: 'published' })
        .select('title category slug canonicalUrl updatedAt')
        .sort({ updatedAt: -1 })
        .limit(300)
        .lean();

      posts.forEach(p => {
        const catSlug = (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
        allUrls.push(p.canonicalUrl || `${host}/blog/${catSlug}/${p.slug}`);
      });
    } catch (postErr) {
      console.warn('[Bulk Index Sweep] Notice reading BlogPost:', postErr.message);
    }

    // 3. Indian Sarkari Live Alerts (Strictly Clean Slug URLs)
    try {
      const LiveAlert = require('../../modules/liveAlerts/liveAlert.model');
      const { sanitizeJobSlug } = require('./jobSeoOptimizer');
      const liveAlerts = await LiveAlert.find({ 
        status: { $in: ['active', 'published'] },
        title: { $exists: true, $ne: '' }
      })
        .select('_id slug title boardName parsedPostDate createdAt')
        .sort({ parsedPostDate: -1, createdAt: -1 })
        .limit(800)
        .lean();

      liveAlerts.forEach(a => {
        const cleanSlug = a.slug || sanitizeJobSlug(a.title, a.boardName, a._id ? a._id.toString() : '');
        if (cleanSlug && !/^[0-9a-fA-F]{24}$/.test(cleanSlug)) {
          allUrls.push(`${host}/india/sarkari-jobs/${cleanSlug}`);
        }
      });
    } catch (alertErr) {
      console.warn('[Bulk Index Sweep] Notice reading LiveAlert:', alertErr.message);
    }

    // 4. Global Government Jobs
    try {
      const GlobalJob = require('../../modules/globalJobs/globalJob.model');
      const globalJobs = await GlobalJob.find()
        .select('officialReferenceId _id createdAt')
        .sort({ createdAt: -1 })
        .limit(400)
        .lean();

      globalJobs.forEach(j => {
        const ref = j.officialReferenceId || j._id;
        allUrls.push(`${host}/global-jobs/view/${encodeURIComponent(ref)}`);
      });
    } catch (jobErr) {
      console.warn('[Bulk Index Sweep] Notice reading GlobalJob:', jobErr.message);
    }

    // 5. Google Discover Web Stories
    try {
      const WebStory = mongoose.model('WebStory');
      const stories = await WebStory.find({ status: 'published' })
        .select('slug updatedAt')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();

      stories.forEach(s => {
        if (s.slug) {
          allUrls.push(`${host}/web-stories/${s.slug}`);
        }
      });
    } catch (storyErr) {
      console.warn('[Bulk Index Sweep] Notice reading WebStory:', storyErr.message);
    }

    // De-duplicate URLs
    const uniqueUrls = Array.from(new Set(allUrls.filter(Boolean)));
    console.log(`[Bulk Index Sweep] Collected ${uniqueUrls.length} total crawlable URLs for multi-engine submission.`);

    if (uniqueUrls.length === 0) {
      return { success: true, count: 0 };
    }

    // Step A: Send all URLs in batches of 500 to IndexNow (Bing, Yandex, Seznam, Naver)
    const BATCH_SIZE = 500;
    let indexNowSuccessCount = 0;
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
      const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
      const res = await notifyBatchIndexNow(batch);
      if (res && res.success) {
        indexNowSuccessCount += batch.length;
      }
    }

    // Step B: Push top priority fresh URLs to Google Indexing API (capped safely to protect daily quota)
    const topGoogleBatch = uniqueUrls.slice(0, 40);
    let googleSuccessCount = 0;
    for (const url of topGoogleBatch) {
      try {
        const gRes = await notifyUrl(url, 'URL_UPDATED');
        if (gRes && gRes.success) googleSuccessCount++;
      } catch (e) {}
    }

    // Step C: Ping Google & Bing with updated sitemap.xml
    await pingSitemapEngines();

    console.log(`[Bulk Index Sweep] Complete! IndexNow: ${indexNowSuccessCount} URLs, Google API: ${googleSuccessCount} URLs.`);

    logAutomation({
      service: 'SEO_INDEXING',
      level: 'SUCCESS',
      action: '360° Bulk Index Sweep Completed',
      message: `Dispatched ${indexNowSuccessCount} URLs across Indian Sarkari, Global Jobs & Stories to IndexNow, and ${googleSuccessCount} high-priority URLs to Google Indexing API.`,
      metadata: {
        totalUrls: uniqueUrls.length,
        indexNowCount: indexNowSuccessCount,
        googleCount: googleSuccessCount
      }
    }).catch(() => {});

    return {
      success: true,
      totalUrls: uniqueUrls.length,
      indexNowCount: indexNowSuccessCount,
      googleCount: googleSuccessCount
    };
  } catch (err) {
    console.error('[Bulk Index Sweep] Error during sweep:', err.message);
    logAutomation({
      service: 'SEO_INDEXING',
      level: 'ERROR',
      action: 'Bulk Index Sweep Failed',
      message: err.message
    }).catch(() => {});
    return { success: false, error: err.message };
  }
}

module.exports = { runBulkIndexSweep };
