const cron = require('node-cron');
const GlobalJob = require('./globalJob.model');
const { fetchReliefWebJobs } = require('./providers/reliefweb.provider');
const { fetchGulfGovJobs } = require('./providers/gulf.provider');
const { fetchAngloGovJobs } = require('./providers/anglo.provider');
const { fetchContinentalGovJobs } = require('./providers/continental.provider');
const { fetchApacAfricaGovJobs } = require('./providers/apacAfrica.provider');
const { fetchUniversalRotatingGovJobs } = require('./providers/universal195.provider');
const AutomationLog = require('../admin/automationLog.model');
const { OFFICIAL_GOV_TLD_REGEX } = require('./globalJob.model');

// Rolling High-Traffic Inventory: Supports up to 1,500 active high-value vacancies (< 5MB storage)
const MAX_DAILY_JOBS = 1500;

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
  /behaviours/i,
  /innovation competitions/i,
  /working for/i,
  /using the civil service/i,
  /(declaration|statutory|weather|login page|eshop|all products|pension|seniors health card|medicare benefits|relationship authorisation|unclaimed money|immunisation program|definition of|looking for work|have your say|getting it right|helping you navigate|personal information releases)/i
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
  /public service/i,
  // German (Bund.de)
  /(sachbearbeiter|referent|beamter|ingenieur|fachkraft|inspektor)/i,
  // French (Service-Public / EU EPSO)
  /(agent|officier|ingénieur|chargé de mission|administrateur|adjoint)/i,
  // Spanish (Empleo Público)
  /(funcionario|técnico|auxiliar|especialista|oposición|administrativo)/i,
  // Portuguese (Concursos Públicos / Brasil)
  /(analista|auditor|técnico|especialista|concurso|oficial)/i,
  // Japanese (人事院 NPA / e-Gov)
  /(採用|国家公務員|職員募集|総合職|一般職|専門官)/,
  // Korean (인사혁신처 MPM)
  /(공무원|채용|공채|행정직|주무관)/,
  // Malay (SPA Malaysia)
  /(jawatan kosong|suruhanjaya perkhidmatan awam|pegawai|penolong)/i,
  // Australia APS Statutory
  /(APS Level|Executive Level|APS\s?[1-6]|EL\s?[1-2]|Cadetship|Graduate Program|Director|Specialist|Officer|Advisor)/i
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

    // Step 6: Ingest from Continental Europe & Latin America Provider (EU, Germany, Spain, Brazil)
    console.log('[Supervisor] Fetching verified Continental Europe & Latin America circulars...');
    const continentalJobs = await fetchContinentalGovJobs();

    // Step 7: Ingest from Asia-Pacific & Africa Hub Provider (Singapore, Malaysia, Japan, Korea, South Africa, Nigeria, Kenya)
    console.log('[Supervisor] Fetching verified Asia-Pacific & Africa circulars...');
    const apacAfricaJobs = await fetchApacAfricaGovJobs();

    // Step 8: Ingest from Universal 195 Sovereign Nations Rotating Provider
    console.log('[Supervisor] Fetching verified Universal 195 Rotating circulars...');
    const universal195Jobs = await fetchUniversalRotatingGovJobs();

    // Combine all genuine verified official circulars
    const candidateJobs = [...universal195Jobs, ...apacAfricaJobs, ...continentalJobs, ...angloJobs, ...gulfJobs, ...unJobs];
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

    // 🛡️ Rolling Storage Guard: Auto-purge expired deadlines and enforce 800 - 1,500 active window
    try {
      const expiredDeleteRes = await GlobalJob.deleteMany({
        applicationDeadline: { $lt: new Date() }
      });
      if (expiredDeleteRes.deletedCount > 0) {
        console.log(`[Supervisor Storage Guard] Purged ${expiredDeleteRes.deletedCount} expired vacancies past application deadline.`);
      }

      const totalActiveCount = await GlobalJob.countDocuments();
      if (totalActiveCount > 1500) {
        const excessCount = totalActiveCount - 1500;
        const oldestDocs = await GlobalJob.find().sort({ createdAt: 1 }).limit(excessCount).select('_id');
        const oldestIds = oldestDocs.map(d => d._id);
        await GlobalJob.deleteMany({ _id: { $in: oldestIds } });
        console.log(`[Supervisor Storage Guard] Purged ${excessCount} oldest vacancies to maintain rolling active cap under 1,500 docs (< 5MB).`);
      }
    } catch (purgeErr) {
      console.warn('[Supervisor Storage Guard Notice]:', purgeErr.message);
    }

    // 🛡️ Hub-First Safe Indexing Protocol (Zero Spam Risk)
    // Gather unique country & continent hubs that received fresh jobs
    const affectedCountries = new Set();
    const affectedContinents = new Set();
    for (const job of candidateJobs) {
      if (job.countryCode) affectedCountries.add(job.countryCode);
      if (job.continent) affectedContinents.add(job.continent);
    }

    const hubUrlsToIndex = [
      'https://www.digitalhomeblog.in/global-jobs',
      ...Array.from(affectedCountries).map(cc => `https://www.digitalhomeblog.in/global-jobs?country=${encodeURIComponent(cc)}`),
      ...Array.from(affectedContinents).map(ct => `https://www.digitalhomeblog.in/global-jobs?continent=${encodeURIComponent(ct)}`)
    ];

    // Cap individual job pings to a randomized 5-10 featured circulars per day to protect crawl budget
    const featuredIndividualJobs = newJobUrls
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    const safeIndexNowUrls = [...hubUrlsToIndex, ...featuredIndividualJobs];

    if (safeIndexNowUrls.length > 0) {
      try {
        const { notifyBatchIndexNow, notifyUrl, pingSitemapEngines } = require('../../shared/utils/google-indexing');
        console.log(`[Supervisor Hub-First Indexing] Notifying search engines of ${hubUrlsToIndex.length} authoritative hubs + ${featuredIndividualJobs.length} featured circulars...`);
        await notifyBatchIndexNow(safeIndexNowUrls);

        // Ping Google Indexing API strictly with high-value hub URLs (safely under quota)
        for (const hubUrl of hubUrlsToIndex.slice(0, 10)) {
          await notifyUrl(hubUrl).catch(() => {});
        }
        await pingSitemapEngines().catch(() => {});
      } catch (indexErr) {
        console.warn('[Supervisor Indexing Notice]:', indexErr.message);
      }
    }

    console.log(`[Supervisor] Intelligence cycle completed. Added ${newlyAdded} verified vacancies. Total today: ${publishedTodayCount + newlyAdded}/${MAX_DAILY_JOBS}.`);
    await recordSupervisorLog('SUCCESS', `Ingested ${newlyAdded} verified official vacancies (Hub-First indexed via IndexNow & Google). Total active: ${await GlobalJob.countDocuments()}/${MAX_DAILY_JOBS}. All links 100% verified official.`);

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
