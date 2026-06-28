const mongoose = require('mongoose');
const BlogPost = require('../src/modules/posts/post.model');
const env = require('../src/config/env');

async function search() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  const posts = await BlogPost.find({
    $or: [
      { title: /SBI/i },
      { content: /SBI/i },
      { title: /PO/i },
      { content: /PO/i }
    ]
  }).select('title slug category tags status seoScore createdAt');

  console.log("Found matches count:", posts.length);
  posts.forEach(p => {
    console.log(`- Title: "${p.title}"\n  Slug: "${p.slug}"\n  Category: "${p.category}"\n  Status: "${p.status}"\n  SEO Score: ${p.seoScore}\n`);
  });

  await mongoose.disconnect();
}

search().catch(console.error);
