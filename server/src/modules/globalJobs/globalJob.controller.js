const GlobalJob = require('./globalJob.model');
const { runSupervisorCycle } = require('./globalJobsSupervisor.cron');

/**
 * Smart Geo-Priority Scoring Function
 */
function scoreJobForUser(job, userCountry = '') {
  let score = 0;
  const targetCountry = (userCountry || '').toUpperCase();

  // Priority 1: Direct Country Match (+1000)
  if (job.countryCode === targetCountry) {
    score += 1000;
  }

  // Priority 2: Multilateral / Expat Friendly (+500)
  if (job.continent === 'Multilateral' || job.eligibility?.visaSponsored || !job.eligibility?.citizenshipRequired) {
    score += 500;
  }

  // Priority 3: Freshness Boost (decaying over 48h)
  const hoursSincePosted = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 100 - hoursSincePosted * 2);

  // Priority 4: Urgency Boost (closing within 7 days)
  if (job.applicationDeadline) {
    const daysUntilDeadline = (new Date(job.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline > 0 && daysUntilDeadline <= 7) {
      score += 80;
    }
  }

  return score;
}

/**
 * GET /api/global-jobs
 */
async function getGlobalJobs(req, res) {
  try {
    const {
      country,
      continent,
      timeline,
      category,
      citizenship,
      search,
      userCountry,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 1. Country filter
    if (country && country !== 'ALL') {
      query.countryCode = country.toUpperCase();
    }

    // 2. Continent filter
    if (continent && continent !== 'ALL') {
      query.continent = continent;
    }

    // 3. Category / Job Type filter
    if (category && category !== 'ALL') {
      query.jobType = category;
    }

    // 4. Citizenship / Expat filter
    if (citizenship === 'expat') {
      query.$or = [
        { 'eligibility.citizenshipRequired': false },
        { 'eligibility.visaSponsored': true }
      ];
    } else if (citizenship === 'citizen_only') {
      query['eligibility.citizenshipRequired'] = true;
    }

    // 5. Timeline filter (आज, कल, परसों, लास्ट डेट)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (timeline === 'today') {
      query.createdAt = { $gte: twentyFourHoursAgo };
    } else if (timeline === 'yesterday') {
      query.createdAt = { $gte: fortyEightHoursAgo, $lt: twentyFourHoursAgo };
    } else if (timeline === 'this_week') {
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (timeline === 'closing_soon') {
      query.applicationDeadline = { $gte: now, $lte: sevenDaysLater };
    }

    // 6. Search query
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { agencyOrMinistry: regex },
        { countryName: regex },
        { dutyStation: regex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const total = await GlobalJob.countDocuments(query);
    const targetCountry = (userCountry || '').toUpperCase();
    let sortedJobs = [];

    // True Geo-Priority Pinning on Page 1
    if (targetCountry && !country && skip === 0) {
      const countryJobs = await GlobalJob.find({ ...query, countryCode: targetCountry })
        .sort({ createdAt: -1 })
        .limit(take)
        .lean();

      const countryJobIds = countryJobs.map(j => j._id);
      const otherJobs = await GlobalJob.find({ ...query, _id: { $nin: countryJobIds } })
        .sort({ createdAt: -1 })
        .limit(take)
        .lean();

      sortedJobs = [...countryJobs, ...otherJobs].slice(0, take);
    } else {
      sortedJobs = await GlobalJob.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean();
    }

    // 🛡️ Smart Universal Fallback: If a specific sovereign country currently has 0 local vacancies,
    // seamlessly provide verified UN, WHO & Multilateral vacancies open to citizens of that country.
    // This ensures NO country ever returns an empty white screen or thin content to search engines!
    let fallbackToInternational = false;
    let finalTotal = total;

    if (country && country !== 'ALL' && sortedJobs.length === 0 && !search && !category && !timeline) {
      const fallbackJobs = await GlobalJob.find({
        $or: [
          { continent: 'Multilateral' },
          { countryCode: 'UN' },
          { 'eligibility.citizenshipRequired': false },
          { 'eligibility.visaSponsored': true }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(take)
        .lean();

      if (fallbackJobs.length > 0) {
        sortedJobs = fallbackJobs.map(j => ({
          ...j,
          isInternationalFallback: true,
          requestedCountryCode: country.toUpperCase()
        }));
        fallbackToInternational = true;
        finalTotal = fallbackJobs.length;
      }
    }

    return res.json({
      success: true,
      data: sortedJobs,
      fallbackToInternational,
      pagination: {
        total: finalTotal,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(finalTotal / take) || 1
      }
    });
  } catch (err) {
    console.error('[getGlobalJobs Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/global-jobs/stats
 */
async function getGlobalJobStats(req, res) {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalActive, todayCount, yesterdayCount, closingSoonCount, continentStats] = await Promise.all([
      GlobalJob.countDocuments(),
      GlobalJob.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      GlobalJob.countDocuments({ createdAt: { $gte: fortyEightHoursAgo, $lt: twentyFourHoursAgo } }),
      GlobalJob.countDocuments({ applicationDeadline: { $gte: now, $lte: sevenDaysLater } }),
      GlobalJob.aggregate([
        { $group: { _id: '$continent', count: { $sum: 1 } } }
      ])
    ]);

    return res.json({
      success: true,
      stats: {
        totalActive,
        todayCount,
        yesterdayCount,
        closingSoonCount,
        continents: continentStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/global-jobs/:id
 */
async function getGlobalJobById(req, res) {
  try {
    const { id } = req.params;
    let job = null;

    if (id.startsWith('UN-') || id.startsWith('GULF-')) {
      job = await GlobalJob.findOne({ officialReferenceId: id }).lean();
    }
    if (!job && id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await GlobalJob.findById(id).lean();
    }

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job notice not found' });
    }

    return res.json({ success: true, data: job });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/global-jobs/trigger-supervisor (Admin / Test trigger)
 */
async function triggerSupervisor(req, res) {
  try {
    // Run cycle in background
    runSupervisorCycle();
    return res.json({ success: true, message: 'Supervisor intelligence cycle triggered successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/global-jobs/detect-geo
 * Detects visitor country from headers (Cloudflare cf-ipcountry, x-country-code)
 */
async function detectVisitorGeo(req, res) {
  try {
    const country = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '').toUpperCase() || 'IN';
    
    // Country to primary language mapping
    const COUNTRY_LANG_MAP = {
      IN: 'hi',
      AE: 'ar', SA: 'ar', QA: 'ar', OM: 'ar', KW: 'ar', BH: 'ar', EG: 'ar',
      ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
      FR: 'fr', BE: 'fr', SN: 'fr',
      DE: 'de', AT: 'de', CH: 'de',
      US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', SG: 'en',
      RU: 'ru',
      BR: 'pt', PT: 'pt',
      JP: 'ja',
      KR: 'ko',
      BD: 'bn',
      PK: 'ur',
      ID: 'id'
    };

    const suggestedLang = COUNTRY_LANG_MAP[country] || 'en';

    return res.json({
      success: true,
      detectedCountry: country,
      suggestedLanguage: suggestedLang
    });
  } catch (err) {
    return res.json({ success: true, detectedCountry: 'IN', suggestedLanguage: 'hi' });
  }
}

module.exports = {
  getGlobalJobs,
  getGlobalJobStats,
  getGlobalJobById,
  triggerSupervisor,
  detectVisitorGeo
};
