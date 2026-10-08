const http = require('http');
const mongoose = require('mongoose');

// Ensure NODE_PATH picks up server/node_modules
const env = require('/Users/harry/Prince/Myblogs/server/src/config/env');
const app = require('/Users/harry/Prince/Myblogs/server/src/app');

async function runTests() {
  console.log('--- Starting Comprehensive SEO Route, 404 Resolution & Robots.txt Verification ---');

  // Connect to DB for live query tests
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(' Connected to MongoDB for realistic database testing');
    } catch (e) {
      console.log('⚠️ MongoDB connection skipped or failed, proceeding with fallback test:', e.message);
    }
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  console.log(` Test server running on port ${port}`);

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: 'GET',
        headers: {
          'Host': 'localhost:' + port
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(` PASS: ${desc}`);
      passed++;
    } else {
      console.error(` FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Robots.txt standard guidelines check
    const resRobots = await makeRequest('/robots.txt');
    assert('/robots.txt returns 200 OK', resRobots.statusCode === 200);
    assert('/robots.txt disallows /admin/', resRobots.body.includes('Disallow: /admin/'));
    assert('/robots.txt disallows /api/', resRobots.body.includes('Disallow: /api/'));
    assert('/robots.txt contains sitemap', resRobots.body.includes('Sitemap: https://digitalhomeblog.in/sitemap.xml'));
    assert('/robots.txt DOES NOT block /*?*', !resRobots.body.includes('Disallow: /*?*'));
    assert('/robots.txt DOES NOT block /tags/', !resRobots.body.includes('Disallow: /tags/'));
    assert('/robots.txt DOES NOT block /job-alerts', !resRobots.body.includes('Disallow: /job-alerts'));

    // 2. Legacy Blog Prefix Redirector (/blog/sarkari-jobs-exams/*)
    // 2a. Generic category hub without slug -> 301 to /india/sarkari-jobs
    const resBlogHub = await makeRequest('/blog/sarkari-jobs-exams');
    assert('/blog/sarkari-jobs-exams (hub) redirects 301', resBlogHub.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs', 
      (resBlogHub.headers.location || '').endsWith('/india/sarkari-jobs'));

    // 2b. Missing vacancy under /blog/sarkari-jobs-exams/ -> 410 Gone
    const resMissingBlogJob = await makeRequest('/blog/sarkari-jobs-exams/missing-random-vacancy-xyz-12345');
    assert('Missing job under /blog/sarkari-jobs-exams/ returns 410 Gone', resMissingBlogJob.statusCode === 410);
    assert('Returns exact 410 message', resMissingBlogJob.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));

    // 2c. Sub-path with nested domain junk like digitalhomeblog.in/sarkari-jobs-&-exams/
    const resJunkBlogJob = await makeRequest('/blog/sarkari-jobs-exams/digitalhomeblog.in/sarkari-jobs-&-exams/missing-job-test-888');
    assert('Nested junk under /blog/sarkari-jobs-exams/ returns 410 Gone if not in DB', resJunkBlogJob.statusCode === 410);

    // 2d. Explicit verification of /blog/sarkari-jobs-exams/vmc-draftsman-work-assistant-and-more-recruitment-2026
    const resVmc = await makeRequest('/blog/sarkari-jobs-exams/vmc-draftsman-work-assistant-and-more-recruitment-2026');
    assert('VMC test URL returns 301 or 410', resVmc.statusCode === 301 || resVmc.statusCode === 410);
    if (resVmc.statusCode === 301) {
      assert('VMC 301 redirects to /india/sarkari-jobs/vmc-draftsman-work-assistant-and-more-recruitment-2026', 
        (resVmc.headers.location || '').includes('/india/sarkari-jobs/vmc-draftsman-work-assistant-and-more-recruitment-2026'));
    } else {
      assert('VMC 410 returns proper 410 body', resVmc.body.includes('<h1>410 Gone</h1>'));
    }

    // 3. Double Nested Blog Paths (/blog/blog/*)
    // 3a. Missing slug under /blog/blog/* -> 410 Gone
    const resMissingDoubleBlog = await makeRequest('/blog/blog/missing-random-post-xyz-999');
    assert('/blog/blog/missing returns 410 Gone', resMissingDoubleBlog.statusCode === 410);
    assert('/blog/blog/missing returns exact 410 body', resMissingDoubleBlog.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));

    // 4. Legacy Mongo ObjectId Resolution (/india/sarkari-jobs/:identifier)
    // 4a. Specific test: /india/sarkari-jobs/6abd047cb1139c2a30f65312
    const resSpecificId2 = await makeRequest('/india/sarkari-jobs/6abd047cb1139c2a30f65312');
    assert('/india/sarkari-jobs/6abd047cb1139c2a30f65312 returns 301 or 410', resSpecificId2.statusCode === 301 || resSpecificId2.statusCode === 410);
    assert('/india/sarkari-jobs/6abd047cb1139c2a30f65312 never returns 200 or 500', resSpecificId2.statusCode !== 200 && resSpecificId2.statusCode !== 500);
    if (resSpecificId2.statusCode === 410) {
      assert('Returns 410 Gone message', resSpecificId2.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));
    }

    // 4b. Previous specific test: /india/sarkari-jobs/6ab107a1c34418c4a5bfcbed
    const resSpecificId = await makeRequest('/india/sarkari-jobs/6ab107a1c34418c4a5bfcbed');
    assert('/india/sarkari-jobs/6ab107a1c34418c4a5bfcbed returns 301 or 410', resSpecificId.statusCode === 301 || resSpecificId.statusCode === 410);
    if (resSpecificId.statusCode === 410) {
      assert('Returns 410 Gone message', resSpecificId.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));
    }

    // 4c. Missing arbitrary 24-hex ObjectId -> 410 Gone
    const fakeObjectId = '507f1f77bcf86cd799439011';
    const resFakeId = await makeRequest(`/india/sarkari-jobs/${fakeObjectId}`);
    assert('Arbitrary missing ObjectId returns 410 Gone', resFakeId.statusCode === 410);
    assert('Arbitrary missing ObjectId returns exact 410 message', resFakeId.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));

    // 4d. Missing job slug -> 410 Gone
    const resMissingSlug = await makeRequest('/india/sarkari-jobs/nonexistent-random-vacancy-xyz-999');
    assert('Missing job slug returns 410 Gone', resMissingSlug.statusCode === 410);
    assert('Missing job slug returns exact 410 message', resMissingSlug.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));

    // 5. Quiz Archives & Static 404s
    const resQuizMissing = await makeRequest('/daily-quiz/1990-01-01');
    assert('/daily-quiz/1990-01-01 returns 410 Gone', resQuizMissing.statusCode === 410);
    assert('/daily-quiz/1990-01-01 returns 410 message', resQuizMissing.body.includes('<h1>410 Gone</h1><p>This vacancy or page is no longer active.</p>'));

    const resQuizIndiaMissing = await makeRequest('/india/daily-quiz/1990-01-01');
    assert('/india/daily-quiz/1990-01-01 returns 410 Gone', resQuizIndiaMissing.statusCode === 410);

    // 6. Defunct route: /future and /future/*
    const resFuture = await makeRequest('/future');
    assert('/future returns 410 Gone', resFuture.statusCode === 410);
    assert('/future returns exact 410 message', resFuture.body.includes('<h1>410 Gone</h1><p>Resource permanently removed.</p>'));

    const resFutureSub = await makeRequest('/future/upcoming-trends');
    assert('/future/* returns 410 Gone', resFutureSub.statusCode === 410);

    // 7. Garbage / Space paths in middleware (e.g. /bihar stet, /fatigue simple, /aktu uptac)
    const res6a = await makeRequest(encodeURI('/bihar stet'));
    assert('/bihar stet returns 410 Gone', res6a.statusCode === 410);
    assert('/bihar stet returns exact 410 message', res6a.body.includes('<h1>410 Gone</h1><p>Resource permanently removed.</p>'));

    const res6b = await makeRequest(encodeURI('/fatigue simple'));
    assert('/fatigue simple returns 410 Gone', res6b.statusCode === 410);

    const res6c = await makeRequest(encodeURI('/aktu uptac'));
    assert('/aktu uptac returns 410 Gone', res6c.statusCode === 410);

    const res6d = await makeRequest(encodeURI('/[आवेदन समाप्त]'));
    assert('/[आवेदन समाप्त] returns 410 Gone', res6d.statusCode === 410);

    // 8. Tags Route Controller (/tags/:tag)
    const resTagSpaces = await makeRequest('/tags/high%20court');
    assert('/tags/high%20court returns 410 Gone', resTagSpaces.statusCode === 410);

    const resTagScraped = await makeRequest('/tags/best%20laptop%202026');
    assert('/tags/best laptop returns 410 Gone', resTagScraped.statusCode === 410);

    const resTagHindi = await makeRequest(encodeURI('/tags/रेलवे-भर्ती'));
    assert('/tags/रेलवे returns 410 Gone', resTagHindi.statusCode === 410);

    const resTagValid = await makeRequest('/tags/upsc');
    assert('Valid tag /tags/upsc returns 200 OK', resTagValid.statusCode === 200);
    assert('Valid tag sends X-Robots-Tag: noindex, follow', resTagValid.headers['x-robots-tag'] === 'noindex, follow');
    assert('Valid tag contains <meta name="robots" content="noindex, follow" />', 
      resTagValid.body.includes('<meta name="robots" content="noindex, follow" />'));

    // 9. Legacy Query Alerts Route (/job-alerts)
    // 9a. Specific test case: /job-alerts?alert=6aba65b95f6a3d22a08fddbb
    const resSpecificAlert = await makeRequest('/job-alerts?alert=6aba65b95f6a3d22a08fddbb');
    assert('/job-alerts?alert=6aba65b95f6a3d22a08fddbb returns 301 or 410 (NEVER 500)', 
      resSpecificAlert.statusCode === 301 || resSpecificAlert.statusCode === 410);
    assert('Specific alert test never returns 500', resSpecificAlert.statusCode !== 500);
    if (resSpecificAlert.statusCode === 410) {
      assert('Specific alert 410 returns exact message', 
        resSpecificAlert.body.includes('<h1>410 Gone</h1><p>This job alert has expired.</p>'));
    }

    // 9b. Missing ObjectId -> 410 Gone
    const resAlertMissing = await makeRequest(`/job-alerts?alert=${fakeObjectId}`);
    assert('/job-alerts?alert=missing returns 410 Gone', resAlertMissing.statusCode === 410);
    assert('/job-alerts?alert=missing returns exact 410 message', 
      resAlertMissing.body.includes('<h1>410 Gone</h1><p>This job alert has expired.</p>'));

    // 9c. Malformed / invalid ObjectId format -> 410 Gone immediately (without querying DB)
    const resAlertMalformed = await makeRequest('/job-alerts?alert=invalid_hex_format_123');
    assert('/job-alerts?alert=malformed returns 410 Gone', resAlertMalformed.statusCode === 410);
    assert('/job-alerts?alert=malformed never returns 500', resAlertMalformed.statusCode !== 500);
    assert('/job-alerts?alert=malformed returns exact 410 message', 
      resAlertMalformed.body.includes('<h1>410 Gone</h1><p>This job alert has expired.</p>'));

    // 9d. Empty alert query -> 410 Gone
    const resAlertEmpty = await makeRequest('/job-alerts?alert=');
    assert('/job-alerts?alert=empty returns 410 Gone', resAlertEmpty.statusCode === 410);

    // 9e. Generic list without query parameters -> 200 OK with noindex, follow
    const resJobAlertsGeneric = await makeRequest('/job-alerts');
    assert('/job-alerts generic list returns 200 OK', resJobAlertsGeneric.statusCode === 200);
    assert('/job-alerts sends X-Robots-Tag: noindex, follow header', resJobAlertsGeneric.headers['x-robots-tag'] === 'noindex, follow');
    assert('/job-alerts contains <meta name="robots" content="noindex, follow" />', 
      resJobAlertsGeneric.body.includes('<meta name="robots" content="noindex, follow" />'));

    const resCanonicalHub = await makeRequest('/india/sarkari-jobs');
    assert('/india/sarkari-jobs hub returns 200 OK', resCanonicalHub.statusCode === 200);
    assert('/india/sarkari-jobs DOES NOT have noindex header', resCanonicalHub.headers['x-robots-tag'] !== 'noindex, follow');
    assert('/india/sarkari-jobs contains index, follow meta', 
      resCanonicalHub.body.includes('<meta name="robots" content="index, follow, max-image-preview:large" />'));
    assert('/india/sarkari-jobs has front-loaded Sarkari Result Title',
      resCanonicalHub.body.includes('<title>Sarkari Result: Latest Sarkari Jobs, Government Vacancy 2026 &amp; Exam Forms | Digital Home</title>') ||
      resCanonicalHub.body.includes('<title>Sarkari Result: Latest Sarkari Jobs, Government Vacancy 2026 & Exam Forms | Digital Home</title>'));
    assert('/india/sarkari-jobs has front-loaded Category H1',
      resCanonicalHub.body.includes('Sarkari Result 2026 – Latest Sarkari Jobs & Government Vacancies'));

    // 9f. Homepage Root Metadata Verification
    const resHome = await makeRequest('/');
    assert('Homepage / returns 200 OK', resHome.statusCode === 200);
    assert('Homepage has front-loaded Sarkari Result 2026 Title',
      resHome.body.includes('Sarkari Result 2026: Sarkari Job, Government Vacancy &amp; Live Job Alert | Digital Home') ||
      resHome.body.includes('Sarkari Result 2026: Sarkari Job, Government Vacancy & Live Job Alert | Digital Home'));
    assert('Homepage Meta Description leads with Sarkari Result 2026 & Latest Sarkari Job',
      resHome.body.includes('Sarkari Result 2026 &amp; Latest Sarkari Job alerts') ||
      resHome.body.includes('Sarkari Result 2026 & Latest Sarkari Job alerts'));
    assert('Homepage Meta Keywords front-loads Sarkari Result and Sarkari Job',
      resHome.body.includes('Sarkari Result, Sarkari Result 2026, Sarkari Job, Sarkari Naukri'));

    // 9g. Global Jobs Hub Metadata Verification
    const resGlobal = await makeRequest('/global-jobs');
    assert('Global Jobs hub /global-jobs returns 200 OK', resGlobal.statusCode === 200);
    assert('Global Jobs hub has front-loaded Sarkari Result Global Title',
      resGlobal.body.includes('<title>Sarkari Result Global: International Government Jobs, Overseas Public Vacancies &amp; Visa Alerts</title>') ||
      resGlobal.body.includes('<title>Sarkari Result Global: International Government Jobs, Overseas Public Vacancies & Visa Alerts</title>'));

    // 10. Abandoned category -> 410 Gone
    const resCatMissing = await makeRequest('/category/abandoned-defunct-category-1234');
    assert('Abandoned non-existent category returns 410 Gone', resCatMissing.statusCode === 410);

    // 11. Live DB sample tests
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const LiveAlert = mongoose.model('LiveAlert');
      const sampleJob = await LiveAlert.findOne({ status: { $in: ['active', 'published'] }, slug: { $exists: true, $ne: '' } }).lean();
      if (sampleJob) {
        console.log(`\nTesting with live DB sample job: ${sampleJob.slug} (_id: ${sampleJob._id})`);
        // 11a: Slug -> 200 OK with strict self-canonical tag
        const res11a = await makeRequest(`/india/sarkari-jobs/${sampleJob.slug}`);
        assert('Valid job slug returns 200 OK', res11a.statusCode === 200);
        assert('Valid job page contains strict canonical tag', 
          res11a.body.includes(`<link rel="canonical" href="https://digitalhomeblog.in/india/sarkari-jobs/${sampleJob.slug}" />`) ||
          res11a.body.includes(`<link rel="canonical" href="https://www.digitalhomeblog.in/india/sarkari-jobs/${sampleJob.slug}" />`));

        // 11b: Mongo ID -> 301 to slug
        const res11b = await makeRequest(`/india/sarkari-jobs/${sampleJob._id.toString()}`);
        assert('Existing Mongo ID redirects 301', res11b.statusCode === 301);
        assert(`Existing Mongo ID redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11b.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));

        // 11c: Legacy ?alert= query parameter -> 301 to slug
        const res11c = await makeRequest(`/job-alerts?alert=${sampleJob._id.toString()}`);
        assert('Existing ?alert= query parameter redirects 301', res11c.statusCode === 301);
        assert(`Existing ?alert= query redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11c.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));

        // 11d: /blog/sarkari-jobs-exams/:slug for existing job -> 301 to /india/sarkari-jobs/:slug
        const res11d = await makeRequest(`/blog/sarkari-jobs-exams/${sampleJob.slug}`);
        assert('/blog/sarkari-jobs-exams/:slug for existing job redirects 301', res11d.statusCode === 301);
        assert(`Redirects to /india/sarkari-jobs/${sampleJob.slug}`, 
          (res11d.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));

        // 11e: /blog/blog/:slug for existing job -> 301 to /india/sarkari-jobs/:slug
        const res11e = await makeRequest(`/blog/blog/${sampleJob.slug}`);
        assert('/blog/blog/:slug for existing job redirects 301', res11e.statusCode === 301);
        assert(`Redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11e.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));

        // 11f: Valid job page contains JobPosting Schema
        assert('Valid job page contains @type: JobPosting schema', res11a.body.includes('"@type":"JobPosting"'));
        assert('Valid job page schema contains sameAs digitalhomeblog.in', res11a.body.includes('"sameAs":"https://digitalhomeblog.in"'));
        assert('Valid job page schema contains addressCountry IN', res11a.body.includes('"addressCountry":"IN"'));
        assert('Valid job page contains proper self-referencing canonical', 
          res11a.body.includes(`/india/sarkari-jobs/${sampleJob.slug}`));
        assert('Valid dynamic job post Title starts with Sarkari Job:',
          /<title>Sarkari Job:/i.test(res11a.body));
        assert('Valid dynamic job post Meta Description starts with Sarkari Result notification for',
          res11a.body.includes('content="Sarkari Result notification for') || res11a.body.includes('Sarkari Result notification for'));
      } else {
        console.log('ℹ️ No active LiveAlert with slug in DB to test live 200/301 ID resolution');
      }
    }

    // 12. Sitemap.xml Cleanliness Verification
    const resSitemap = await makeRequest('/sitemap.xml');
    assert('/sitemap.xml returns 200 OK', resSitemap.statusCode === 200);
    assert('/sitemap.xml does NOT contain hex ObjectIds in /india/sarkari-jobs/', 
      !/\/india\/sarkari-jobs\/[0-9a-fA-F]{24}<\/loc>/i.test(resSitemap.body));
    assert('/sitemap.xml does NOT contain query strings like ?alert=', 
      !resSitemap.body.includes('?alert='));
    assert('/sitemap.xml includes indexable /india/sarkari-jobs', 
      resSitemap.body.includes('/india/sarkari-jobs'));

    // 12. Global Error Handler Verification (CastError / BSONError -> 410, Unhandled 500)
    const errorHandler = require('/Users/harry/Prince/Myblogs/server/src/middleware/errorHandler');
    let castHandledStatus = null;
    let castHandledBody = null;
    const mockCastErr = new Error('Cast error');
    mockCastErr.name = 'CastError';
    const mockResCast = {
      setHeader: () => {},
      status: (s) => { castHandledStatus = s; return { send: (b) => { castHandledBody = b; } }; }
    };
    errorHandler(mockCastErr, { path: '/job-alerts' }, mockResCast, () => {});
    assert('CastError returns 410 Gone', castHandledStatus === 410);
    assert('CastError returns exact 410 body', castHandledBody === '<h1>410 Gone</h1><p>Invalid entity reference.</p>');

    let bsonHandledStatus = null;
    let bsonHandledBody = null;
    const mockBsonErr = new Error('BSON error');
    mockBsonErr.name = 'BSONError';
    const mockResBson = {
      setHeader: () => {},
      status: (s) => { bsonHandledStatus = s; return { send: (b) => { bsonHandledBody = b; } }; }
    };
    errorHandler(mockBsonErr, { path: '/job-alerts' }, mockResBson, () => {});
    assert('BSONError returns 410 Gone', bsonHandledStatus === 410);
    assert('BSONError returns exact 410 body', bsonHandledBody === '<h1>410 Gone</h1><p>Invalid entity reference.</p>');

    let genericHandledStatus = null;
    let genericHandledBody = null;
    const mockGenericErr = new Error('Unexpected crash');
    const mockResGeneric = {
      setHeader: () => {},
      status: (s) => { genericHandledStatus = s; return { send: (b) => { genericHandledBody = b; } }; }
    };
    errorHandler(mockGenericErr, { path: '/some-page' }, mockResGeneric, () => {});
    assert('Generic unhandled error returns 500 Server Error', genericHandledStatus === 500);
    assert('Generic error returns exact 500 body', genericHandledBody === '<h1>Server Error</h1><p>Please try again later.</p>');

    console.log(`\n================================`);
    console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
    console.log(`================================`);

  } finally {
    server.close();
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
