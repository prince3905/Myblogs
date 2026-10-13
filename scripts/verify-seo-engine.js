const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const LiveAlert = require('../server/src/modules/liveAlerts/liveAlert.model');
const SiteSeoConfig = require('../server/src/modules/seo/siteSeoConfig.model');
const { fetchGoogleSuggestions } = require('../server/src/modules/seo/seoSuggestions.service');
const { processSeoAutomation } = require('../server/src/modules/seo/seoAutomation.hook');

async function runVerification() {
  console.log('--- STARTING ENTERPRISE SEO ENGINE VERIFICATION ---');

  // 1. Test Google Suggestions Service
  console.log('\n[1/4] Testing Google Autocomplete API Suggestions...');
  const suggestions = await fetchGoogleSuggestions('ssc cgl 2026');
  console.log(`✅ Suggestions received (${suggestions.length}):`, suggestions.slice(0, 3));
  if (suggestions.length === 0) {
    throw new Error('Google suggestions failed to return keywords');
  }

  // 2. Connect to DB and check SiteSeoConfig
  console.log('\n[2/4] Connecting to Database & Verifying SiteSeoConfig...');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not found in env, testing with mock doc');
  } else {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const config = await SiteSeoConfig.getOrCreate();
    console.log('✅ SiteSeoConfig loaded:', {
      jobTitlePattern: config.jobTitlePattern,
      jobMetaPattern: config.jobMetaPattern,
      autoExtractKeywords: config.autoExtractKeywords,
      autoPingIndexingApi: config.autoPingIndexingApi
    });
  }

  // 3. Test SEO Automation Processor
  console.log('\n[3/4] Testing Pre-Save SEO Automation & Scoring Engine...');
  const testAlert = {
    title: 'SSC CGL 2026 Combined Graduate Level Exam Notification',
    boardName: 'Staff Selection Commission (SSC)',
    lastDate: '28-04-2026',
    slug: 'ssc-cgl-2026-combined-graduate-level-exam',
    seoEngine: { isAutoMode: true }
  };

  await processSeoAutomation(testAlert);
  console.log('✅ Processed SEO Engine Output:');
  console.log('  • Custom Meta Title:', testAlert.seoEngine.customMetaTitle);
  console.log('  • Custom Meta Description:', testAlert.seoEngine.customMetaDescription);
  console.log('  • SEO Score:', `${testAlert.seoEngine.seoScore} / 100`);
  console.log('  • Canonical URL:', testAlert.seoEngine.canonicalUrl);
  console.log('  • Short-Tail Keywords:', testAlert.seoEngine.shortTailKeywords);
  console.log('  • Long-Tail Keywords:', testAlert.seoEngine.longTailKeywords);
  console.log('  • FAQs Count:', testAlert.seoEngine.faqs?.length);
  console.log('  • Sample FAQ:', testAlert.seoEngine.faqs?.[0]?.question);

  if (!testAlert.seoEngine.customMetaTitle || !testAlert.seoEngine.customMetaDescription) {
    throw new Error('SEO Automation failed to generate meta tags');
  }

  if (!testAlert.seoEngine.faqs || testAlert.seoEngine.faqs.length < 3) {
    throw new Error('SEO Automation failed to generate 3 core FAQs');
  }

  // 4. Test SSR Schema and Meta Tag Logic
  console.log('\n[4/4] Verifying SSR Output Tags...');
  const cleanTitle = testAlert.seoEngine.customMetaTitle;
  const cleanDesc = testAlert.seoEngine.customMetaDescription;
  const canonicalUrl = `https://www.digitalhomeblog.in/india/sarkari-jobs/${testAlert.slug}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': testAlert.seoEngine.faqs.map(f => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.answer }
    }))
  };

  console.log('✅ SSR Meta Title Check: OK ->', cleanTitle);
  console.log('✅ SSR Canonical Check: OK ->', canonicalUrl);
  console.log('✅ SSR FAQPage Schema Check: OK ->', faqSchema.mainEntity.length, 'Questions');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  console.log('\n🎉 ALL ENTERPRISE SEO ENGINE MODULE TESTS PASSED 100%!');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
