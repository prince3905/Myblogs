const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const BlogPost = require('../src/modules/posts/post.model');
const env = require('../src/config/env');

async function verify() {
  console.log("=== SEO STRUCTURAL FIXES VERIFICATION ===");

  // 1. Verify Frontend H1 Tag Implementation in PostPage
  const postPagePath = path.join(__dirname, '../../client/src/features/blog/pages/PostPage.jsx');
  const postPageContent = fs.readFileSync(postPagePath, 'utf8');
  const hasH1Component = postPageContent.includes('variant="h2" component="h1"');
  console.log(`[Frontend] PostPage.jsx wraps title in component="h1": ${hasH1Component ? '✅ YES' : '❌ NO'}`);

  // 2. Verify Frontend Dynamic Suffix Sorter in Seo.jsx
  const seoPath = path.join(__dirname, '../../client/src/features/blog/components/Seo.jsx');
  const seoContent = fs.readFileSync(seoPath, 'utf8');
  const hasDynamicSuffix = seoContent.includes("const siteName = 'Digital Home Sarkari Result'") && 
                           seoContent.includes(".replace(/\\s*\\|\\s*(Digital Home|Inkspire Blog|Sarkari Result)\\s*$/i, '')");
  console.log(`[Frontend] Seo.jsx formats dynamic title suffix correctly: ${hasDynamicSuffix ? '✅ YES' : '❌ NO'}`);

  // 3. Connect to Database and Test Pre-Save Fallback
  await mongoose.connect(env.mongoUri);
  console.log("Connected to database");

  // Create a temporary test post without description or seoDescription to test the fallback
  const testSlug = 'verify-seo-fallback-' + Date.now();
  const testPost = new BlogPost({
    title: "Verification Test Post",
    slug: testSlug,
    excerpt: "Verification excerpt",
    content: "<p>This is the first sentence of our verification test content. It should serve as the fallback for our meta description. We want it to be automatically extracted on save.</p>",
    category: "Tech & Tutorials",
    status: "draft"
  });

  // Save to database (this triggers the pre('save') validation hook)
  await testPost.save();
  console.log("Test post saved without manual SEO description.");

  // Fetch from database to verify
  const fetchedPost = await BlogPost.findOne({ slug: testSlug });
  const hasAutoDescription = fetchedPost.seoDescription && fetchedPost.seoDescription.includes("This is the first sentence of our verification");
  const descriptionLength = fetchedPost.seoDescription ? fetchedPost.seoDescription.length : 0;
  
  console.log(`[Backend] DB Pre-Save hook generated seoDescription automatically: ${hasAutoDescription ? '✅ YES' : '❌ NO'}`);
  console.log(`[Backend] Generated Description: "${fetchedPost.seoDescription}" (Length: ${descriptionLength} chars)`);

  // Clean up test post
  await BlogPost.deleteOne({ slug: testSlug });
  console.log("Cleaned up verification test post.");

  await mongoose.disconnect();
  console.log("Disconnected from database");
  
  if (hasH1Component && hasDynamicSuffix && hasAutoDescription) {
    console.log("\n>>> ALL TESTS PASSED: SEO fixes are 100% verified and operational! <<<");
  } else {
    console.log("\n>>> ERROR: Some verification tests failed! <<<");
  }
}

verify().catch(console.error);
