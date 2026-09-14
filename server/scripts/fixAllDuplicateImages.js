const mongoose = require('mongoose');
const env = require('../src/config/env');
require('../src/modules/posts/post.model');
require('../src/modules/posts/webstory.model');
const { fetchPortraitImage } = require('../src/modules/posts/webstory.service');
const { getCategoryBannerImage } = require('../src/modules/autoPublisher/multiCategory.service');

async function fixAllDuplicates() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });
  console.log('Connected to DB. Starting comprehensive duplicate image cleaner...');

  const WebStory = mongoose.model('WebStory');
  const BlogPost = mongoose.model('BlogPost');

  // 1. Clean duplicate slide images in WebStories
  const stories = await WebStory.find();
  console.log(`Checking ${stories.length} WebStories for duplicate slide images...`);
  let fixedStoryCount = 0;

  for (const story of stories) {
    if (!story.slides || story.slides.length === 0) continue;

    const usedInStory = new Set();
    let hasDupes = false;

    for (let idx = 0; idx < story.slides.length; idx++) {
      const slide = story.slides[idx];
      if (usedInStory.has(slide.image) || !slide.image) {
        hasDupes = true;
        const newImg = await fetchPortraitImage(slide.heading || story.title, story.title, idx + fixedStoryCount, usedInStory);
        slide.image = newImg;
        usedInStory.add(newImg);
      } else {
        usedInStory.add(slide.image);
      }
    }

    if (hasDupes) {
      story.markModified('slides');
      await story.save();
      fixedStoryCount++;
      console.log(`✅ Fixed duplicate slide images in story: "${story.title}"`);
    }
  }

  console.log(`🎉 WebStory image cleanup complete. Fixed ${fixedStoryCount} stories.`);

  // 2. Clean duplicate featured images across BlogPosts
  const posts = await BlogPost.find({ status: 'published' }).sort({ createdAt: -1 });
  console.log(`Checking ${posts.length} published BlogPosts for duplicate featuredImages...`);

  const seenImages = new Map(); // image -> [postId, postId]
  let fixedPostCount = 0;

  for (const post of posts) {
    if (!post.featuredImage) continue;

    if (!seenImages.has(post.featuredImage)) {
      seenImages.set(post.featuredImage, post._id);
    } else {
      // Duplicate detected!
      console.log(`Duplicate image detected for post: "${post.title}" [Category: ${post.category}]`);
      try {
        const newBanner = await getCategoryBannerImage(post.category, `${post.title} unique ${fixedPostCount}`);
        if (newBanner && newBanner !== post.featuredImage) {
          await BlogPost.updateOne({ _id: post._id }, { $set: { featuredImage: newBanner } });
          seenImages.set(newBanner, post._id);
          fixedPostCount++;
          console.log(`✅ Replaced duplicate image with unique bespoke banner: ${newBanner}`);
        }
      } catch (err) {
        console.error(`Failed to replace image for "${post.title}":`, err.message);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n✨ Done! Total duplicate blog post images fixed: ${fixedPostCount}`);
  process.exit(0);
}

fixAllDuplicates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
