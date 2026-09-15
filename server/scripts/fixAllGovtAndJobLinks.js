/**
 * Lightweight Batch-Wise Migration Script: Fix All Generic india.gov.in Links
 */

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { resolveOfficialGovtPortal } = require('../src/shared/utils/govtPortalMap');
const { resolveOfficialUrls } = require('../src/shared/utils/officialDomainResolver');
const { generateSmartActionButtons } = require('../src/shared/utils/smartButtonGenerator');
const { injectNaturalKeywordBox } = require('../src/shared/utils/naturalKeywordEngine');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true
  });
  console.log('Connected to MongoDB successfully.');

  const livealertsCol = mongoose.connection.db.collection('livealerts');
  const blogpostsCol = mongoose.connection.db.collection('blogposts');

  // 1. Process LiveAlerts in batches of 50
  console.log('Checking remaining LiveAlerts with india.gov.in...');
  while (true) {
    const batch = await livealertsCol.find({
      $or: [
        { officialUrl: /india\.gov\.in/i },
        { officialApplyUrl: /india\.gov\.in/i },
        { officialPdfUrl: /india\.gov\.in/i }
      ]
    }, {
      projection: { title: 1, boardName: 1, state: 1, officialUrl: 1, officialApplyUrl: 1, officialPdfUrl: 1, detailsText: 1 }
    }).limit(50).toArray();

    if (!batch || batch.length === 0) {
      console.log('All LiveAlerts are 100% clean!');
      break;
    }

    console.log(`Processing batch of ${batch.length} LiveAlerts...`);
    const updatePromises = batch.map(alert => {
      const resolvedPortal = resolveOfficialGovtPortal(alert.title, alert.boardName, '', alert.state);
      const updatedOfficialUrl = (!alert.officialUrl || alert.officialUrl.includes('india.gov.in')) ? resolvedPortal : alert.officialUrl;
      const updatedApplyUrl = (!alert.officialApplyUrl || alert.officialApplyUrl.includes('india.gov.in')) ? resolvedPortal : alert.officialApplyUrl;
      const updatedPdfUrl = (!alert.officialPdfUrl || alert.officialPdfUrl.includes('india.gov.in')) ? resolvedPortal : alert.officialPdfUrl;

      let updatedDetails = alert.detailsText || '';
      if (updatedDetails) {
        updatedDetails = updatedDetails.replace(/https?:\/\/(?:www\.)?india\.gov\.in[^\s\n]*/gi, resolvedPortal);
      }

      return livealertsCol.updateOne(
        { _id: alert._id },
        {
          $set: {
            officialUrl: updatedOfficialUrl,
            officialApplyUrl: updatedApplyUrl,
            officialPdfUrl: updatedPdfUrl,
            detailsText: updatedDetails
          }
        }
      );
    });

    await Promise.all(updatePromises);
    console.log(`Updated ${batch.length} LiveAlerts.`);
  }

  // 2. Process BlogPosts in batches of 15
  console.log('\nChecking remaining BlogPosts with india.gov.in...');
  let totalFixedPosts = 0;
  while (true) {
    const batch = await blogpostsCol.find({
      $or: [
        { content: /india\.gov\.in/i },
        { sourceUrl: /india\.gov\.in/i }
      ]
    }, {
      projection: { _id: 1, title: 1, category: 1, slug: 1, content: 1, sourceUrl: 1, focusKeyword: 1 }
    }).limit(15).toArray();

    if (!batch || batch.length === 0) {
      console.log(`All BlogPosts are 100% clean!`);
      break;
    }

    console.log(`Processing batch of ${batch.length} BlogPosts...`);
    const updatePromises = batch.map(async post => {
      const isJobCategory = (post.category || '').toLowerCase().includes('sarkari') || (post.category || '').toLowerCase().includes('job');
      const isJobTitle = /(recruitment|vacancy|vacancies|online form|admit card|answer key|result|cutoff|merit list|पद|भर्ती|परीक्षा|अधिसूचना|sarkari)/i.test(post.title || '');
      const isJobPost = isJobCategory || isJobTitle;

      let content = post.content || '';

      if (isJobPost) {
        const resolved = resolveOfficialUrls(post.title, null, post.sourceUrl);

        content = content.replace(/<div[^>]*class=["']search-intent-box["'][^]*?<\/div>/gi, '');
        content = content.replace(/<h[23][^>]*>[^<]*?(?:महत्वपूर्ण|Important|Useful)[^<]*?लिंक्स?[^<]*?<\/h[23]>([^]*?)(?=<h[23]|<div class=["'](?:search-intent-box|games-promo-block|brand-authority-block)["']|$)/gi, '');
        content = content.replace(/<h2>(?:महत्वपूर्ण लिंक्स?|Important Links?|Useful Links?|Some Useful Important Links|महत्वपूर्ण लिंक्स \(Important Direct Links\))<\/h2>([^]*?)(?=<h[23]|<div class=["'](?:search-intent-box|games-promo-block|brand-authority-block)["']|$)/gi, '');

        content = injectNaturalKeywordBox(content, post.title, post.focusKeyword, {
          apply: resolved.apply,
          pdf: resolved.pdf,
          web: resolved.web
        }, post.category || 'Sarkari Jobs & Exams');

        const buttonsHtml = generateSmartActionButtons(post.title, resolved);
        content += `\n<h2>महत्वपूर्ण लिंक्स (Important Direct Links)</h2>${buttonsHtml}`;
      } else {
        content = content.replace(/https?:\/\/(?:www\.)?india\.gov\.in[^\s"'>]*/gi, '/blog');
        content = content.replace(/<div[^>]*class=["']search-intent-box["'][^]*?<\/div>/gi, '');
        content = injectNaturalKeywordBox(content, post.title, post.focusKeyword, {}, post.category || 'Technology');
      }

      if (content.includes('india.gov.in')) {
        const fallbackUrl = resolveOfficialGovtPortal(post.title);
        content = content.replace(/https?:\/\/(?:www\.)?india\.gov\.in[^\s"'>]*/gi, fallbackUrl);
      }

      let updatedSource = post.sourceUrl || '';
      if (updatedSource.includes('india.gov.in')) {
        updatedSource = resolveOfficialGovtPortal(post.title);
      }

      return blogpostsCol.updateOne(
        { _id: post._id },
        {
          $set: {
            content,
            sourceUrl: updatedSource
          }
        }
      );
    });

    await Promise.all(updatePromises);
    totalFixedPosts += batch.length;
    console.log(`Updated ${batch.length} posts (Total updated: ${totalFixedPosts})`);
    await sleep(200);
  }

  // 3. Final Verification
  const remainingAlerts = await livealertsCol.countDocuments({
    $or: [{ officialUrl: /india\.gov\.in/i }, { officialApplyUrl: /india\.gov\.in/i }]
  });

  const remainingPosts = await blogpostsCol.countDocuments({
    content: /india\.gov\.in/i
  });

  console.log(`\n=== Final Verification Results ===`);
  console.log(`Remaining LiveAlerts with india.gov.in: ${remainingAlerts}`);
  console.log(`Remaining BlogPosts with india.gov.in: ${remainingPosts}`);

  await mongoose.disconnect();
  console.log('Migration successfully completed 100%!');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
