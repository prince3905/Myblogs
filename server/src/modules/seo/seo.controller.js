const SiteSeoConfig = require('./siteSeoConfig.model');
const { fetchGoogleSuggestions } = require('./seoSuggestions.service');
const { processSeoAutomation } = require('./seoAutomation.hook');
const { notifyAllIndexing, normalizeIndexingUrl } = require('../../shared/utils/google-indexing');
const { sendTelegramMessage } = require('../../shared/services/telegramService');

/**
 * GET /api/admin/seo-intelligence/suggestions?q={query}
 */
exports.getGoogleSuggestions = async (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';
    if (!query.trim()) {
      return res.json({ success: true, query: '', suggestions: [] });
    }

    const suggestions = await fetchGoogleSuggestions(query);
    return res.json({
      success: true,
      query,
      suggestions
    });
  } catch (error) {
    console.error('[SEO Controller] getGoogleSuggestions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch Google suggestions' });
  }
};

/**
 * POST /api/admin/seo-intelligence/generate-meta
 */
exports.generateAiMeta = async (req, res) => {
  try {
    const { title, boardName, lastDate, category, slug, detailsText } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required for SEO generation' });
    }

    const dummyDoc = {
      title: title.trim(),
      boardName: (boardName || '').trim(),
      lastDate: (lastDate || '').trim(),
      category: (category || 'Latest Job').trim(),
      slug: (slug || '').trim(),
      detailsText: (detailsText || '').trim(),
      seoEngine: { isAutoMode: true }
    };

    const seoEngine = await processSeoAutomation(dummyDoc, { forceRegenerate: true });

    return res.json({
      success: true,
      seoEngine
    });
  } catch (error) {
    console.error('[SEO Controller] generateAiMeta error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI Meta' });
  }
};

/**
 * GET /api/admin/seo-intelligence/config
 */
exports.getSeoConfig = async (req, res) => {
  try {
    const config = await SiteSeoConfig.getOrCreate();
    return res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('[SEO Controller] getSeoConfig error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch SEO config' });
  }
};

/**
 * PUT /api/admin/seo-intelligence/config
 */
exports.updateSeoConfig = async (req, res) => {
  try {
    const config = await SiteSeoConfig.getOrCreate();
    const {
      jobTitlePattern,
      jobMetaPattern,
      defaultOgBanner,
      autoExtractKeywords,
      autoPingIndexingApi,
      autoDispatchTelegram
    } = req.body;

    if (jobTitlePattern !== undefined) config.jobTitlePattern = jobTitlePattern;
    if (jobMetaPattern !== undefined) config.jobMetaPattern = jobMetaPattern;
    if (defaultOgBanner !== undefined) config.defaultOgBanner = defaultOgBanner;
    if (autoExtractKeywords !== undefined) config.autoExtractKeywords = Boolean(autoExtractKeywords);
    if (autoPingIndexingApi !== undefined) config.autoPingIndexingApi = Boolean(autoPingIndexingApi);
    if (autoDispatchTelegram !== undefined) config.autoDispatchTelegram = Boolean(autoDispatchTelegram);

    await config.save();

    return res.json({
      success: true,
      message: 'SEO Global Settings updated successfully',
      config
    });
  } catch (error) {
    console.error('[SEO Controller] updateSeoConfig error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update SEO config' });
  }
};

/**
 * POST /api/admin/seo-intelligence/push-indexing
 */
exports.pushIndexing = async (req, res) => {
  try {
    const { url, slug, title } = req.body;
    let targetUrl = url;

    if (!targetUrl && slug) {
      targetUrl = `https://www.digitalhomeblog.in/india/sarkari-jobs/${slug}`;
    }

    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'Target URL or slug is required' });
    }

    targetUrl = normalizeIndexingUrl(targetUrl);
    console.log(`[SEO Intelligence] Manual Push Indexing triggered for: ${targetUrl}`);

    const indexResults = await notifyAllIndexing(targetUrl, 'URL_UPDATED');

    // Check if Telegram dispatch is requested or enabled
    let telegramResult = null;
    const config = await SiteSeoConfig.getOrCreate();
    if (config.autoDispatchTelegram && (title || slug)) {
      try {
        telegramResult = await sendTelegramMessage({
          title: title || 'New Sarkari Alert',
          canonicalUrl: targetUrl,
          slug: slug || ''
        });
      } catch (tgErr) {
        console.warn('[SEO Push Indexing] Telegram dispatch failed:', tgErr.message);
      }
    }

    return res.json({
      success: true,
      message: '🚀 Indexing signals successfully pushed to Google API & IndexNow (Bing/Yandex)!',
      targetUrl,
      indexing: indexResults,
      telegram: telegramResult
    });
  } catch (error) {
    console.error('[SEO Controller] pushIndexing error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to push indexing' });
  }
};
