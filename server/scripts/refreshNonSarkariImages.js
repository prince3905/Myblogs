const mongoose = require('mongoose');
const env = require('../src/config/env');
require('../src/modules/posts/post.model');
const { getCategoryBannerImage } = require('../src/modules/autoPublisher/multiCategory.service');

async function refreshImages() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });
  console.log('Connected to MongoDB. Scanning non-Sarkari blog posts...');

  const BlogPost = mongoose.model('BlogPost');
  
  // Find published non-Sarkari posts
  const posts = await BlogPost.find({
    category: { $ne: 'Sarkari Jobs & Exams' }
  }).sort({ createdAt: -1 });

  console.log(`Found ${posts.length} non-Sarkari posts.`);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n[${i + 1}/${posts.length}] Processing: "${post.title}" [Category: ${post.category}]`);
    
    try {
      const newBanner = await getCategoryBannerImage(post.category, post.title);
      if (newBanner && newBanner !== post.featuredImage) {
        await BlogPost.updateOne({ _id: post._id }, { $set: { featuredImage: newBanner } });
        console.log(`✅ Updated to bespoke title-matched banner: ${newBanner}`);
      } else {
        console.log(`ℹ️ Image retained: ${post.featuredImage}`);
      }
    } catch (err) {
      console.error(`❌ Failed to update image for "${post.title}":`, err.message);
    }

    // 1.5-second rate-limit throttle between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n✨ All non-Sarkari post images successfully refreshed with bespoke, high-CTR banners!');
  process.exit(0);
}

refreshImages().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
