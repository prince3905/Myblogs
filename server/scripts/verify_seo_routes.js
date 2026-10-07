const http = require('http');
const mongoose = require('mongoose');

// Ensure NODE_PATH picks up server/node_modules
const env = require('/Users/harry/Prince/Myblogs/server/src/config/env');
const app = require('/Users/harry/Prince/Myblogs/server/src/app');

async function runTests() {
  console.log('--- Starting Comprehensive SEO Route Verification ---');

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
    // 1. Nested /blog/blog/:slug -> 301
    const res1 = await makeRequest('/blog/blog/upsssc-lekhpal-recruitment-2026');
    assert('Nested /blog/blog/ slug redirects 301', res1.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/upsssc-lekhpal-recruitment-2026', 
      (res1.headers.location || '').includes('/india/sarkari-jobs/upsssc-lekhpal-recruitment-2026'));

    // 2. Embedded domain string in path: /blog/sarkari-jobs-exams/digitalhomeblog.in/*
    const res2 = await makeRequest('/blog/sarkari-jobs-exams/digitalhomeblog.in/upsssc-vdo-recruitment-2026');
    assert('Embedded domain in /blog/sarkari-jobs-exams/digitalhomeblog.in/* redirects 301', res2.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/upsssc-vdo-recruitment-2026', 
      (res2.headers.location || '').includes('/india/sarkari-jobs/upsssc-vdo-recruitment-2026'));

    // 3. Embedded category with ampersand: /sarkari-jobs-&-exams/*
    const res3 = await makeRequest('/sarkari-jobs-&-exams/rsmssb-patwari-2026');
    assert('/sarkari-jobs-&-exams/* redirects 301', res3.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/rsmssb-patwari-2026', 
      (res3.headers.location || '').includes('/india/sarkari-jobs/rsmssb-patwari-2026'));

    // 4. Normalize /blog/sarkari-jobs-exams/:slug
    const res4 = await makeRequest('/blog/sarkari-jobs-exams/ssc-cgl-2026');
    assert('/blog/sarkari-jobs-exams/:slug redirects 301', res4.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs/ssc-cgl-2026', 
      (res4.headers.location || '').includes('/india/sarkari-jobs/ssc-cgl-2026'));

    // 4b. Normalize /blog/sarkari-jobs-exams (without slug)
    const res4b = await makeRequest('/blog/sarkari-jobs-exams');
    assert('/blog/sarkari-jobs-exams (hub) redirects 301', res4b.statusCode === 301);
    assert('Redirects to /india/sarkari-jobs', 
      (res4b.headers.location || '').endsWith('/india/sarkari-jobs'));

    // 5. Defunct route: /future and /future/*
    const res5 = await makeRequest('/future');
    assert('/future returns 410 Gone', res5.statusCode === 410);
    assert('/future returns minimal 410 message', res5.body.includes('<h1>410 Gone</h1>'));

    const res5b = await makeRequest('/future/upcoming-trends');
    assert('/future/* returns 410 Gone', res5b.statusCode === 410);

    // 6. Garbage characters: Spaces, brackets, Devanagari in path
    const res6a = await makeRequest(encodeURI('/sewayojna vibhag'));
    assert('Spaces in URL path returns 410 Gone', res6a.statusCode === 410);

    const res6b = await makeRequest(encodeURI('/[आवेदन समाप्त]'));
    assert('Brackets & Devanagari in URL path returns 410 Gone', res6b.statusCode === 410);

    // 7. Non-existent Legacy Mongo ObjectId
    const fakeObjectId = '507f1f77bcf86cd799439011';
    const res7 = await makeRequest(`/india/sarkari-jobs/${fakeObjectId}`);
    assert('Non-existent 24-hex ObjectId returns 410 Gone', res7.statusCode === 410);
    assert('Non-existent 24-hex ObjectId returns minimal message', res7.body.includes('<h1>410 Gone</h1><p>This job vacancy has expired or was removed.</p>'));

    // 8. Non-existent Job Slug
    const res8 = await makeRequest('/india/sarkari-jobs/nonexistent-random-vacancy-xyz-999');
    assert('Non-existent job slug returns 410 Gone', res8.statusCode === 410);
    assert('Non-existent job slug returns minimal message', res8.body.includes('<h1>410 Gone</h1><p>This job vacancy has expired or was removed.</p>'));

    // 9. Defunct / empty date-based quiz page
    const res9 = await makeRequest('/daily-quiz/1990-01-01');
    assert('Defunct daily quiz date returns 410 Gone', res9.statusCode === 410);
    assert('Defunct daily quiz date returns 410 message', res9.body.includes('<h1>410 Gone</h1>'));

    const res9b = await makeRequest('/india/daily-quiz/1990-01-01');
    assert('Defunct /india/daily-quiz/:date returns 410 Gone', res9b.statusCode === 410);

    // 10. Non-existent abandoned category
    const res10 = await makeRequest('/category/abandoned-defunct-category-1234');
    assert('Abandoned non-existent category returns 410 Gone', res10.statusCode === 410);
    assert('Abandoned category returns 410 message', res10.body.includes('<h1>410 Gone</h1>'));

    // 11. Existing job slug (if any in DB) -> 200 OK with strict self-referencing canonical
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const LiveAlert = mongoose.model('LiveAlert');
      const sampleJob = await LiveAlert.findOne({ status: { $in: ['active', 'published'] }, slug: { $exists: true, $ne: '' } }).lean();
      if (sampleJob) {
        console.log(`\nTesting with live DB sample job: ${sampleJob.slug} (_id: ${sampleJob._id})`);
        // Test 11a: Slug -> 200 OK with canonical tag
        const res11a = await makeRequest(`/india/sarkari-jobs/${sampleJob.slug}`);
        assert('Valid job slug returns 200 OK', res11a.statusCode === 200);
        assert('Valid job page contains strict canonical tag', 
          res11a.body.includes(`<link rel="canonical" href="https://www.digitalhomeblog.in/india/sarkari-jobs/${sampleJob.slug}" />`));

        // Test 11b: Mongo ID of existing job -> 301 to slug
        const res11b = await makeRequest(`/india/sarkari-jobs/${sampleJob._id.toString()}`);
        assert('Existing Mongo ID redirects 301', res11b.statusCode === 301);
        assert(`Existing Mongo ID redirects to /india/sarkari-jobs/${sampleJob.slug}`,
          (res11b.headers.location || '').includes(`/india/sarkari-jobs/${sampleJob.slug}`));
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
