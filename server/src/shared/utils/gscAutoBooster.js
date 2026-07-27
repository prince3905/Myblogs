const mongoose = require('mongoose');
const env = require('../../config/env');
const { logAutomation } = require('./automationLogger');

/**
 * Automatically identifies published posts with low traffic/impressions or older posts,
 * enriches them with real GSC search queries, recalculates SEO score, and re-indexes them.
 */
async function runAutoGscBoost() {
  try {
    const BlogPost = mongoose.model('BlogPost');
    
    // Find published posts that haven't been boosted in the last 5 days
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    const postsToBoost = await BlogPost.find({
      status: 'published',
      $or: [
        { lastGscBoostAt: { $exists: false } },
        { lastGscBoostAt: null },
        { lastGscBoostAt: { $lt: fiveDaysAgo } }
      ]
    }).sort({ views: 1, publishedAt: -1 }).limit(3);

    if (!postsToBoost || postsToBoost.length === 0) {
      console.log('[Auto-GSC Booster] All published posts are up to date with GSC boost data.');
      return { success: true, boostedCount: 0 };
    }

    console.log(`[Auto-GSC Booster] Found ${postsToBoost.length} candidate posts for automatic GSC traffic boost...`);
    logAutomation({
      service: 'SEO_INDEXING',
      level: 'INFO',
      action: 'Auto-GSC Booster Start',
      message: `Analyzing ${postsToBoost.length} published posts for low impressions & search intent boost`
    });

    const { getDetailedQueriesForPage } = require('../services/gscService');
    const { processAIOutput, enrichWithGscQueries } = require('../../modules/ai/aiPostProcessor');
    const { calculateSeoScore } = require('./seoAuditor');
    const { notifyUrl } = require('./google-indexing');

    let boostedCount = 0;

    for (const post of postsToBoost) {
      try {
        const catSlug = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
        const pagePath = `/blog/${catSlug}/${post.slug}`;
        
        let queries = [];
        try {
          const detailed = await getDetailedQueriesForPage(pagePath);
          queries = (detailed || []).map(d => d.query);
        } catch (gscErr) {
          console.warn(`[Auto-GSC Booster] GSC query fetch notice for "${post.title}":`, gscErr.message);
        }

        // Smart fallback if GSC doesn't have queries yet for a new post
        if (queries.length === 0) {
          const shortCleanTitle = (post.title || '').split(/[-:|(]/)[0].trim();
          queries = [shortCleanTitle, ...(post.tags || [])];
        }

        // 1. Natural insertion of top queries into introduction & FAQ
        const enrichedContent = enrichWithGscQueries(post.content, post.title, queries);

        // 2. SEO re-optimization
        const processed = await processAIOutput({
          title: post.title,
          content: enrichedContent,
          keywords: [queries[0] || post.focusKeyword || post.title, ...(post.tags || [])],
          focusKeyword: post.focusKeyword || queries[0] || '',
          category: post.category,
          length: 'long',
          slug: post.slug,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription
        });

        post.content = processed.content;
        post.tags = processed.tags;
        if (processed.seoTitle) post.seoTitle = processed.seoTitle;
        if (processed.seoDescription) {
          post.seoDescription = processed.seoDescription;
          post.excerpt = processed.seoDescription;
        }

        // Recalculate SEO score
        const audit = calculateSeoScore(post);
        post.seoScore = audit.score;
        post.lastGscBoostAt = new Date();

        await post.save();
        boostedCount++;

        // 3. Re-index on Google
        const siteUrlRaw = env.siteUrl || 'https://www.digitalhomeblog.in';
        const fullUrl = `${siteUrlRaw.replace(/\/$/, '')}${pagePath}`;
        notifyUrl(fullUrl, 'URL_UPDATED').catch(() => {});

        console.log(`[Auto-GSC Booster] Successfully boosted post: "${post.title}" (SEO Score: ${audit.score}/100)`);
        logAutomation({
          service: 'SEO_INDEXING',
          level: 'SUCCESS',
          action: 'Auto-GSC Boost Applied',
          message: `Auto-boosted search intent & re-indexed: "${post.title}" (SEO Score: ${audit.score}/100)`,
          metadata: { title: post.title, queries: queries.slice(0, 5), seoScore: audit.score, url: fullUrl }
        });
      } catch (postErr) {
        console.error(`[Auto-GSC Booster] Failed to boost post "${post?.title}":`, postErr.message);
        logAutomation({
          service: 'SEO_INDEXING',
          level: 'ERROR',
          action: 'Auto-GSC Boost Failed',
          message: postErr.message,
          metadata: { title: post?.title }
        });
      }
    }

    return { success: true, boostedCount };
  } catch (err) {
    console.error('[Auto-GSC Booster] Daemon exception:', err.message);
    logAutomation({
      service: 'SEO_INDEXING',
      level: 'ERROR',
      action: 'Auto-GSC Booster Error',
      message: err.message
    });
    return { success: false, error: err.message };
  }
}

module.exports = { runAutoGscBoost };
