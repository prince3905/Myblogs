const mongoose = require('mongoose');
const env = require('../src/config/env');
const BlogPost = require('../src/modules/posts/post.model');

function catUrlSlug(category) {
  if (!category) return 'blog';
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog';
}

function postUrl(post) {
  return `${env.siteUrl}/blog/${catUrlSlug(post.category)}/${post.slug}`;
}

async function run() {
  await mongoose.connect(env.mongoUri);

  const posts = await BlogPost.find({ status: 'published' }).sort({ updatedAt: -1 });
  console.log(`Total Published Posts: ${posts.length}`);

  const urls = posts.map((post) => postUrl(post));
  console.log('\nUrls in sitemap:');
  urls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });

  await mongoose.connection.close();
}

run().catch(console.error);
