const mongoose = require('mongoose');
const env = require('../src/config/env');
const BlogPost = require('../src/modules/posts/post.model');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to Database');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const posts = await BlogPost.find({
    updatedAt: { $gte: startOfDay }
  });

  console.log(`\nFound ${posts.length} posts modified/created today:`);
  posts.forEach(p => {
    console.log(`- Title: "${p.title}"`);
    console.log(`  Slug: "${p.slug}"`);
    console.log(`  Status: "${p.status}"`);
    console.log(`  CreatedAt: ${p.createdAt}`);
    console.log(`  UpdatedAt: ${p.updatedAt}`);
  });

  const publishedCount = await BlogPost.countDocuments({ status: 'published' });
  const draftCount = await BlogPost.countDocuments({ status: 'draft' });
  console.log(`\nGlobal Stats: Published = ${publishedCount}, Draft = ${draftCount}`);

  await mongoose.connection.close();
}

run().catch(console.error);
