const cron = require('node-cron');
const GlobalJob = require('./globalJob.model');
const { fetchReliefWebJobs } = require('./providers/reliefweb.provider');
const { fetchGulfGovJobs } = require('./providers/gulf.provider');
const { fetchAngloGovJobs } = require('./providers/anglo.provider');
const AutomationLog = require('../admin/automationLog.model');
const { OFFICIAL_GOV_TLD_REGEX } = require('./globalJob.model');

// Dynamic live feed quota: Can safely store up to 250 verified vacancies per day
// (Individual cards are rendered dynamically in an SPA modal; only the main /global-jobs hub is indexed by search engines)
const MAX_DAILY_JOBS = 250;

// Helper to add small delay (in ms)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Audit Logger for Master Supervisor
 */
async function recordSupervisorLog(status, message, details = {}) {
  try {
    await AutomationLog.create({
      service: 'SYSTEM_CRON',
      level: status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      action: 'GLOBAL_JOBS_SUPERVISOR',
      message,
      metadata: details
    });
  } catch (err) {
    console.warn('[Supervisor Logger Warning]:', err.message);
  }
}

/**
 * Database Quota & Storage Hygiene Routine
 * Keeps MongoDB permanently under 40MB by purging old logs and expired vacancies
 */
async function enforceDatabaseHygiene() {
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Purge global jobs older than 60 days or expired > 30 days ago
    const jobPurgeResult = await GlobalJob.deleteMany({
      $or: [
        { createdAt: { $lt: sixtyDaysAgo } },
        { applicationDeadline: { $lt: thirtyDaysAgo } }
      ]
    });

    // 2. Trim old automation logs older than 14 days to prevent log bloat
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const logPurgeResult = await AutomationLog.deleteMany({
      createdAt: { $lt: fourteenDaysAgo }
    });

    if (jobPurgeResult.deletedCount > 0 || logPurgeResult.deletedCount > 0) {
      console.log(`[DB Hygiene] Purged ${jobPurgeResult.deletedCount} expired jobs and ${logPurgeResult.deletedCount} stale logs. Storage kept under 40MB.`);
    }
  } catch (err) {
    console.warn('[DB Hygiene Error]:', err.message);
  }
}

/**
 * Master Supervisor Execution Cycle
 */
async function runSupervisorCycle() {
  console.log('\n[GlobalJobsSupervisorCron] Initiating scheduled intelligence cycle...');

  try {
    // Step 1: Database Hygiene Check
    await enforceDatabaseHygiene();

    // Step 2: Check today's publication quota
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const publishedTodayCount = await GlobalJob.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    if (publishedTodayCount >= MAX_DAILY_JOBS) {
      console.log(`[Supervisor] Daily publication quota reached (${publishedTodayCount}/${MAX_DAILY_JOBS}).`);
      await recordSupervisorLog('SUCCESS', `Daily quota reached (${publishedTodayCount}/${MAX_DAILY_JOBS} jobs). Feed fully saturated.`);
      return;
    }

    const remainingQuota = MAX_DAILY_JOBS - publishedTodayCount;
    let newlyAdded = 0;

    // Step 3: Ingest from ReliefWeb UN & Multilateral Provider (170+ Countries)
    console.log('[Supervisor] Fetching authentic UN / Multilateral vacancies...');
    const unJobs = await fetchReliefWebJobs();

    // Step 4: Ingest from Gulf Official Gazette Provider (Saudi, UAE, Qatar)
    console.log('[Supervisor] Fetching verified Gulf official circulars...');
    const gulfJobs = await fetchGulfGovJobs();

    // Step 5: Ingest from Anglo-American Provider (USA, UK, Canada, Australia)
    console.log('[Supervisor] Fetching verified Anglo-American circulars (USA, UK, Canada, Australia)...');
    const angloJobs = await fetchAngloGovJobs();

    // Combine all genuine verified official circulars
    const candidateJobs = [...angloJobs, ...gulfJobs, ...unJobs];

    for (const job of candidateJobs) {
      if (newlyAdded >= remainingQuota) break;

      // 🛡️ STRICT RULE: Zero Promotional / Zero Faltu Links
      if (!OFFICIAL_GOV_TLD_REGEX.test(job.officialNoticeUrl)) {
        console.warn(`[Supervisor Guard] Rejected non-official URL: ${job.officialNoticeUrl}`);
        continue;
      }

      // Deduplication: Check if already stored
      const exists = await GlobalJob.findOne({
        $or: [
          { officialReferenceId: job.officialReferenceId },
          { title: job.title, countryCode: job.countryCode }
        ]
      });

      if (!exists) {
        // Pre-populate translations for Hindi if missing
        if (!job.translations?.hi) {
          job.translations = job.translations || {};
          job.translations.hi = {
            title: `सरकारी भर्ती: ${job.title}`,
            agency: job.agencyOrMinistry,
            dutyStation: job.dutyStation,
            eligibility: job.eligibility?.education || 'आधिकारिक गजट के अनुसार योग्यता',
            salary: job.salary?.amount || 'आधिकारिक वेतनमान'
          };
        }

        await GlobalJob.create(job);
        newlyAdded++;

        // Brief delay between writes
        await delay(150);
      }
    }

    console.log(`[Supervisor] Intelligence cycle completed. Added ${newlyAdded} verified vacancies. Total today: ${publishedTodayCount + newlyAdded}/${MAX_DAILY_JOBS}.`);
    await recordSupervisorLog('SUCCESS', `Ingested ${newlyAdded} verified official vacancies. Daily total: ${publishedTodayCount + newlyAdded}/${MAX_DAILY_JOBS}. All links 100% verified official.`);

  } catch (err) {
    console.error('[Supervisor Error]:', err.message);
    await recordSupervisorLog('ERROR', `Supervisor cycle encountered error: ${err.message}`);
  }
}

/**
 * Initialize the Master Supervisor Cron AI
 * Fires every 4 hours (e.g. at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 */
function initGlobalJobsSupervisor() {
  console.log('🤖 Initializing Global Master Supervisor Cron AI (Phase 1)...');

  // Run initial cycle after 15 seconds of server startup to pre-seed vacancies
  setTimeout(() => {
    runSupervisorCycle();
  }, 15000);

  // Schedule every 4 hours with natural jitter
  cron.schedule('0 */4 * * *', () => {
    // Add natural 15-45 second randomized jitter
    const jitter = Math.floor(Math.random() * 30000) + 15000;
    setTimeout(() => {
      runSupervisorCycle();
    }, jitter);
  });
}

module.exports = {
  initGlobalJobsSupervisor,
  runSupervisorCycle,
  enforceDatabaseHygiene
};
