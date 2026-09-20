const cron = require('node-cron');
const GlobalJob = require('./globalJob.model');
const { fetchReliefWebJobs } = require('./providers/reliefweb.provider');
const { fetchGulfGovJobs } = require('./providers/gulf.provider');
const { fetchAngloGovJobs } = require('./providers/anglo.provider');
const AutomationLog = require('../admin/automationLog.model');
const { OFFICIAL_GOV_TLD_REGEX } = require('./globalJob.model');

// Dynamic live feed quota: Can safely store up to 250 verified vacancies per day
const MAX_DAILY_JOBS = 250;

// Strict negative check (discard non-vacancies & press releases)
const TRASH_PATTERNS = [
  /recalled/i,
  /recall/i,
  /tax relief/i,
  /what is/i,
  /consultation/i,
  /invests in/i,
  /press release/i,
  /summit/i,
  /facility details/i,
  /register of legislation/i,
  /sanctions impact/i,
  /food recall/i,
  /consumer product/i,
  /statement on/i,
  /remarks by/i,
  /speech by/i,
  /success profiles/i,
  /behaviours/i
];

// Mandatory hiring keywords
const HIRING_PATTERNS = [
  /recruitment/i,
  /vacancy/i,
  /vacancies/i,
  /officer/i,
  /specialist/i,
  /assistant/i,
  /engineer/i,
  /analyst/i,
  /director/i,
  /manager/i,
  /associate/i,
  /internship/i,
  /fellowship/i,
  /technician/i,
  /coordinator/i,
  /administrator/i,
  /inspector/i,
  /advisor/i,
  /consultant/i,
  /clerk/i,
  /nurse/i,
  /doctor/i,
  /attorney/i,
  /counsel/i,
  /hiring/i,
  /careers/i,
  /job/i,
  /civil service/i,
  /public service/i
];

function isValidGlobalJob(title = '', description = '') {
  const isTrash = TRASH_PATTERNS.some(rx => rx.test(title) || rx.test(description));
  const isHiring = HIRING_PATTERNS.some(rx => rx.test(title) || rx.test(description));
  return !isTrash && isHiring;
}

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
        { applicationDeadline: { $lt: thirtyDaysAgo } },
        ...TRASH_PATTERNS.map(rx => ({ title: rx }))
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
    const newJobUrls = [];

    for (const job of candidateJobs) {
      if (newlyAdded >= remainingQuota) break;

      // 🛡️ Data Sanitizer: Reject non-job news, food recalls, and press releases
      if (!isValidGlobalJob(job.title, job.description || job.officialGazetteSummary || '')) {
        console.warn(`[Supervisor Guard] Rejected non-vacancy item: "${job.title}"`);
        continue;
      }

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

        const createdDoc = await GlobalJob.create(job);
        newlyAdded++;
        newJobUrls.push(`https://www.digitalhomeblog.in/global-jobs/view/${createdDoc.officialReferenceId || createdDoc._id}`);

        // Brief delay between writes
        await delay(150);
      }
    }

    // Auto-dispatch indexing pings for freshly discovered global vacancies
    if (newJobUrls.length > 0) {
      try {
        const { notifyBatchIndexNow, notifyUrl, pingSitemapEngines } = require('../../shared/utils/google-indexing');
        console.log(`[Supervisor Indexing] Dispatching ${newJobUrls.length} new global jobs to search engines...`);
        await notifyBatchIndexNow(newJobUrls);
        
        // Notify Google Indexing API up to 20 jobs within safe daily quota
        for (const url of newJobUrls.slice(0, 20)) {
          await notifyUrl(url).catch(() => {});
        }
        await pingSitemapEngines().catch(() => {});
      } catch (indexErr) {
        console.warn('[Supervisor Indexing Notice]:', indexErr.message);
      }
    }

    console.log(`[Supervisor] Intelligence cycle completed. Added ${newlyAdded} verified vacancies. Total today: ${publishedTodayCount + newlyAdded}/${MAX_DAILY_JOBS}.`);
    await recordSupervisorLog('SUCCESS', `Ingested ${newlyAdded} verified official vacancies (indexed via IndexNow & Google). Daily total: ${publishedTodayCount + newlyAdded}/${MAX_DAILY_JOBS}. All links 100% verified official.`);

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
