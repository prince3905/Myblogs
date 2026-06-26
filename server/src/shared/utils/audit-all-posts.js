const path = require('path');
const mongoose = require('mongoose');
const env = require('../../config/env');
const BlogPost = require('../../modules/posts/post.model');
const { calculateSeoScore } = require('./seoAuditor');

async function runAudit() {
  console.log('Connecting to database...');
  await mongoose.connect(env.mongoUri);
  console.log('Database connected.');

  const posts = await BlogPost.find({}).lean();
  console.log(`Found ${posts.length} total posts in database.\n`);

  if (posts.length === 0) {
    console.log('No posts found to audit.');
    await mongoose.connection.close();
    return;
  }

  let totalSeoScore = 0;
  let thinContentCount = 0; // posts with < 700 words
  let extremelyThinCount = 0; // posts with < 400 words
  let missingTables = 0;
  let lowSeoCount = 0; // score < 70%
  
  const detailedResults = [];

  for (const post of posts) {
    const audit = calculateSeoScore({
      title: post.title,
      content: post.content,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      slug: post.slug,
      tags: post.tags,
      excerpt: post.excerpt,
      canonicalUrl: post.canonicalUrl
    });

    const isThin = audit.wordCount < 700;
    const isExtremelyThin = audit.wordCount < 400;
    const hasTable = audit.checks.hasTable;
    const score = audit.score;

    totalSeoScore += score;
    if (isThin) thinContentCount++;
    if (isExtremelyThin) extremelyThinCount++;
    if (!hasTable) missingTables++;
    if (score < 70) lowSeoCount++;

    detailedResults.push({
      id: post._id,
      title: post.title,
      status: post.status,
      wordCount: audit.wordCount,
      score: score,
      density: audit.density,
      hasTable,
      isThin,
      isExtremelyThin,
      suggestions: audit.suggestions
    });
  }

  const averageSeo = (totalSeoScore / posts.length).toFixed(1);

  console.log('==================================================');
  console.log('           ADSENSE SEO AUDIT REPORT               ');
  console.log('==================================================');
  console.log(`Total Posts Audited : ${posts.length}`);
  console.log(`Average SEO Score   : ${averageSeo}%`);
  console.log(`Extremely Thin (<400 words) : ${extremelyThinCount} posts (${(extremelyThinCount/posts.length*100).toFixed(1)}%)`);
  console.log(`Thin Content (<700 words)  : ${thinContentCount} posts (${(thinContentCount/posts.length*100).toFixed(1)}%)`);
  console.log(`Missing Data Tables        : ${missingTables} posts (${(missingTables/posts.length*100).toFixed(1)}%)`);
  console.log(`Low SEO Score (<70%)       : ${lowSeoCount} posts (${(lowSeoCount/posts.length*100).toFixed(1)}%)`);
  console.log('==================================================\n');

  console.log('DETAILED RISK ASSESSMENT FOR ADSENSE REJECTION:');
  
  let highRiskCount = 0;
  
  detailedResults.forEach((res, index) => {
    let riskLevel = 'LOW RISK';
    let riskReasons = [];

    if (res.isExtremelyThin) {
      riskLevel = 'HIGH RISK (Extremely Thin)';
      riskReasons.push(`Extremely thin content (${res.wordCount} words) - Google rejects posts below 400 words as "thin content".`);
    } else if (res.isThin) {
      riskLevel = 'MEDIUM RISK (Thin)';
      riskReasons.push(`Word count is ${res.wordCount} words - AdSense prefers high-depth guides of 1,000+ words.`);
    }

    if (res.score < 60) {
      riskLevel = res.isExtremelyThin ? 'CRITICAL RISK' : 'MEDIUM/HIGH RISK';
      riskReasons.push(`Low SEO Optimization Score (${res.score}%) - Missing focus keyword alignment.`);
    }

    if (!res.hasTable) {
      riskReasons.push('No spec table / comparison table found (hurts generative rank / rich snippets).');
    }

    if (riskLevel !== 'LOW RISK' || res.score < 80) {
      highRiskCount++;
      console.log(`\n${index + 1}. [${res.status.toUpperCase()}] "${res.title}"`);
      console.log(`   SEO Score: ${res.score}% | Word Count: ${res.wordCount} words | Density: ${res.density}%`);
      console.log(`   Risk Rating: ${riskLevel}`);
      if (riskReasons.length > 0) {
        console.log('   Issues Found:');
        riskReasons.forEach(r => console.log(`     • ${r}`));
      }
    }
  });

  if (highRiskCount === 0) {
    console.log('\n🎉 Congratulations! All posts are at LOW RISK and well-optimized for Google AdSense!');
  } else {
    console.log(`\n⚠️ Total ${highRiskCount} posts require attention before submitting to Google AdSense.`);
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  if (mongoose.connection) mongoose.connection.close();
});
