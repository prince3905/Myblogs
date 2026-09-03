const mongoose = require('mongoose');
const { notifyUrl, notifyBatchIndexNow, pingSitemapEngines } = require('./google-indexing');
const { logAutomation } = require('./automationLogger');

/**
 * Sweeper Script: Bulk Indexes All Published Blog Posts & Live Alerts
 * 1. Pushes all URLs in batches to IndexNow (Bing, Yandex, Seznam).
 * 2. Pushes top priority un-indexed URLs to Google Indexing API.
 * 3. Triggers Sitemap Ping to Google & Bing.
 */
async function runBulkIndexSweep() {
  console.log('[Bulk Index Sweep] Starting comprehensive site-wide indexing sweep...');
  
  try {
    require('../../modules/posts/post.model');
    const BlogPost = mongoose.model('BlogPost');

    const posts = await BlogPost.find({ status: 'published' })
      .select('title category slug canonicalUrl updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    if (!posts || posts.length === 0) {
      console.log('[Bulk Index Sweep] No published posts found.');
      return { success: true, count: 0 };
    }

    const host = 'https://www.digitalhomeblog.in';
    const allUrls = posts.map(p => {
      const catSlug = (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
      return p.canonicalUrl || `${host}/blog/${catSlug}/${p.slug}`;
    });

    console.log(`[Bulk Index Sweep] Found ${allUrls.length} total published URLs.`);

    // 1. Send all URLs in batches of 500 to IndexNow
    const BATCH_SIZE = 500;
    let indexNowSuccessCount = 0;
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
      const batch = allUrls.slice(i, i + BATCH_SIZE);
      const res = await notifyBatchIndexNow(batch);
      if (res.success) {
        indexNowSuccessCount += batch.length;
      }
    }

    // 2. Ping Google Indexing API for top 50 latest posts (within Google's daily 200 API quota)
    const topGoogleBatch = allUrls.slice(0, 50);
    let googleSuccessCount = 0;
    for (const url of topGoogleBatch) {
      try {
        const gRes = await notifyUrl(url, 'URL_UPDATED');
        if (gRes.success) googleSuccessCount++;
      } catch (e) {}
    }

    // 3. Ping Google & Bing with updated sitemap.xml
    await pingSitemapEngines();

    console.log(`[Bulk Index Sweep] Sweep completed! IndexNow: ${indexNowSuccessCount} URLs, Google API: ${googleSuccessCount} URLs.`);

    logAutomation({
      service: 'SEO_INDEXING',
      level: 'SUCCESS',
      action: 'Bulk Index Sweep Completed',
      message: `Dispatched ${indexNowSuccessCount} URLs to IndexNow Multi-Engine and ${googleSuccessCount} URLs to Google Indexing API.`,
      metadata: {
        totalUrls: allUrls.length,
        indexNowCount: indexNowSuccessCount,
        googleCount: googleSuccessCount
      }
    }).catch(() => {});

    return {
      success: true,
      totalUrls: allUrls.length,
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
