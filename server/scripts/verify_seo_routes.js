const http = require('http');
const mongoose = require('mongoose');

// Ensure NODE_PATH picks up server/node_modules
const env = require('/Users/harry/Prince/Myblogs/server/src/config/env');
const app = require('/Users/harry/Prince/Myblogs/server/src/app');

async function runTests() {
  console.log('--- Starting Comprehensive SEO Route & Robots.txt Verification ---');

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

    // 2. Nested /blog/blog/:slug -> 301
    const res1 = await makeRequest('/blog/blog/upsssc-lekhpal-recruitment-2026');
    assert('Nested /blog/blog/ slug redirects 301', res1.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/upsssc-lekhpal-recruitment-2026', 
      (res1.headers.location || '').includes('/india/sarkari-jobs/upsssc-lekhpal-recruitment-2026'));

    // 3. Embedded domain string in path: /blog/sarkari-jobs-exams/digitalhomeblog.in/*
    const res2 = await makeRequest('/blog/sarkari-jobs-exams/digitalhomeblog.in/upsssc-vdo-recruitment-2026');
    assert('Embedded domain in /blog/sarkari-jobs-exams/digitalhomeblog.in/* redirects 301', res2.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/upsssc-vdo-recruitment-2026', 
      (res2.headers.location || '').includes('/india/sarkari-jobs/upsssc-vdo-recruitment-2026'));

    // 4. Embedded category with ampersand: /sarkari-jobs-&-exams/*
    const res3 = await makeRequest('/sarkari-jobs-&-exams/rsmssb-patwari-2026');
    assert('/sarkari-jobs-&-exams/* redirects 301', res3.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/rsmssb-patwari-2026', 
      (res3.headers.location || '').includes('/india/sarkari-jobs/rsmssb-patwari-2026'));

    // 5. Normalize /blog/sarkari-jobs-exams/:slug
    const res4 = await makeRequest('/blog/sarkari-jobs-exams/ssc-cgl-2026');
    assert('/blog/sarkari-jobs-exams/:slug redirects 301', res4.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/ssc-cgl-2026', 
      (res4.headers.location || '').includes('/india/sarkari-jobs/ssc-cgl-2026'));

    // 5b. Normalize /blog/sarkari-jobs-exams (without slug)
    const res4b = await makeRequest('/blog/sarkari-jobs-exams');
    assert('/blog/sarkari-jobs-exams (hub) redirects 301', res4b.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs', 
      (res4b.headers.location || '').endsWith('/india/sarkari-jobs'));

    // 6. Defunct route: /future and /future/*
    const res5 = await makeRequest('/future');
    assert('/future returns 410 Gone', res5.statusCode === 410);
    assert('/future returns minimal 410 message', res5.body.includes('<h1>410 Gone</h1><p>Resource permanently removed.</p>'));

    const res5b = await makeRequest('/future/upcoming-trends');
    assert('/future/* returns 410 Gone', res5b.statusCode === 410);

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
    // 8a. Tag with spaces / encoded spaces -> 410 Gone
    const resTagSpaces = await makeRequest('/tags/high%20court');
    assert('/tags/high%20court returns 410 Gone', resTagSpaces.statusCode === 410);
    assert('/tags/high%20court returns exact 410 message', resTagSpaces.body.includes('<h1>410 Gone</h1><p>Resource permanently removed.</p>'));

    // 8b. Tag with raw scraped garbage -> 410 Gone
    const resTagScraped = await makeRequest('/tags/best%20laptop%202026');
    assert('/tags/best laptop returns 410 Gone', resTagScraped.statusCode === 410);

    // 8c. Tag with Devanagari characters -> 410 Gone
    const resTagHindi = await makeRequest(encodeURI('/tags/रेलवे-भर्ती'));
    assert('/tags/रेलवे returns 410 Gone', resTagHindi.statusCode === 410);

    // 8d. Valid clean tag page -> 200 OK with X-Robots-Tag: noindex, follow & <meta name="robots" content="noindex, follow" />
    const resTagValid = await makeRequest('/tags/upsc');
    assert('Valid tag /tags/upsc returns 200 OK', resTagValid.statusCode === 200);
    assert('Valid tag sends X-Robots-Tag: noindex, follow', resTagValid.headers['x-robots-tag'] === 'noindex, follow');
    assert('Valid tag contains <meta name="robots" content="noindex, follow" />', 
      resTagValid.body.includes('<meta name="robots" content="noindex, follow" />'));

    // 9. Legacy Query Alerts Route (/job-alerts)
    // 9a. Non-existent legacy query alert -> 410 Gone
    const fakeObjectId = '507f1f77bcf86cd799439011';
    const resAlertMissing = await makeRequest(`/job-alerts?alert=${fakeObjectId}`);
    assert('/job-alerts?alert=missing returns 410 Gone', resAlertMissing.statusCode === 410);
    assert('/job-alerts?alert=missing returns exact 410 message', resAlertMissing.body.includes('<h1>410 Gone</h1><p>Resource permanently removed.</p>'));

    // 9b. Generic /job-alerts without query parameters -> 200 OK with X-Robots-Tag: noindex, follow
    const resJobAlertsGeneric = await makeRequest('/job-alerts');
    assert('/job-alerts generic list returns 200 OK', resJobAlertsGeneric.statusCode === 200);
    assert('/job-alerts sends X-Robots-Tag: noindex, follow header', resJobAlertsGeneric.headers['x-robots-tag'] === 'noindex, follow');
    assert('/job-alerts contains <meta name="robots" content="noindex, follow" />', 
      resJobAlertsGeneric.body.includes('<meta name="robots" content="noindex, follow" />'));

    // 9c. Canonical /india/sarkari-jobs retains index, follow
    const resCanonicalHub = await makeRequest('/india/sarkari-jobs');
    assert('/india/sarkari-jobs hub returns 200 OK', resCanonicalHub.statusCode === 200);
    assert('/india/sarkari-jobs DOES NOT have noindex header', resCanonicalHub.headers['x-robots-tag'] !== 'noindex, follow');
    assert('/india/sarkari-jobs contains index, follow meta', 
      resCanonicalHub.body.includes('<meta name="robots" content="index, follow, max-image-preview:large" />'));

    // 10. Non-existent Legacy Mongo ObjectId on detail page
    const res7 = await makeRequest(`/india/sarkari-jobs/${fakeObjectId}`);
    assert('Non-existent 24-hex ObjectId on detail page returns 410 Gone', res7.statusCode === 410);
    assert('Non-existent 24-hex ObjectId returns minimal message', res7.body.includes('<h1>410 Gone</h1><p>This job vacancy has expired or was removed.</p>'));

    // 11. Non-existent Job Slug
    const res8 = await makeRequest('/india/sarkari-jobs/nonexistent-random-vacancy-xyz-999');
    assert('Non-existent job slug returns 410 Gone', res8.statusCode === 410);
    assert('Non-existent job slug returns minimal message', res8.body.includes('<h1>410 Gone</h1><p>This job vacancy has expired or was removed.</p>'));

    // 12. Defunct / empty date-based quiz page
    const res9 = await makeRequest('/daily-quiz/1990-01-01');
    assert('Defunct daily quiz date returns 410 Gone', res9.statusCode === 410);
    assert('Defunct daily quiz date returns 410 message', res9.body.includes('<h1>410 Gone</h1>'));

    const res9b = await makeRequest('/india/daily-quiz/1990-01-01');
    assert('Defunct /india/daily-quiz/:date returns 410 Gone', res9b.statusCode === 410);

    // 13. Non-existent abandoned category
    const res10 = await makeRequest('/category/abandoned-defunct-category-1234');
    assert('Abandoned non-existent category returns 410 Gone', res10.statusCode === 410);
    assert('Abandoned category returns 410 message', res10.body.includes('<h1>410 Gone</h1>'));

    // 14. Live DB sample tests
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const LiveAlert = mongoose.model('LiveAlert');
      const sampleJob = await LiveAlert.findOne({ status: { $in: ['active', 'published'] }, slug: { $exists: true, $ne: '' } }).lean();
      if (sampleJob) {
        console.log(`\nTesting with live DB sample job: ${sampleJob.slug} (_id: ${sampleJob._id})`);
        // Test 14a: Slug -> 200 OK with canonical tag
        const res11a = await makeRequest(`/india/sarkari-jobs/${sampleJob.slug}`);
        assert('Valid job slug returns 200 OK', res11a.statusCode === 200);
        assert('Valid job page contains strict canonical tag', 
          res11a.body.includes(`<link rel="canonical" href="https://www.digitalhomeblog.in/india/sarkari-jobs/${sampleJob.slug}" />`));

        // Test 14b: Mongo ID of existing job -> 301 to slug
        const res11b = await makeRequest(`/india/sarkari-jobs/${sampleJob._id.toString()}`);
        assert('Existing Mongo ID redirects 301', res11b.statusCode === 301);
        assert(`Existing Mongo ID redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11b.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));

        // Test 14c: Legacy ?alert= query parameter for existing job -> 301 to slug
        const res11c = await makeRequest(`/job-alerts?alert=${sampleJob._id.toString()}`);
        assert('Existing ?alert= query parameter redirects 301', res11c.statusCode === 301);
        assert(`Existing ?alert= query redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11c.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));
      } else {
        console.log('ℹ️ No active LiveAlert with slug in DB to test live 200/301 ID resolution');
      }
    }

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
