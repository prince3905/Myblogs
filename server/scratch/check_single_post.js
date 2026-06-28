const mongoose = require('mongoose');
const BlogPost = require('../src/modules/posts/post.model');
const env = require('../src/config/env');

async function checkPost() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  const id = '69fb2f075d33d229e2568e3f';
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log("Invalid ObjectId format:", id);
    await mongoose.disconnect();
    return;
  }

  const post = await BlogPost.findById(id);
  if (post) {
    console.log("Post found:");
    console.log("- Title:", post.title);
    console.log("- Slug:", post.slug);
    console.log("- Category:", post.category);
    console.log("- Status:", post.status);
    console.log("- Tags:", post.tags);
    console.log("- Content preview (first 200 chars):", post.content ? post.content.substring(0, 200) : "empty");
  } else {
    console.log(`Post with ID ${id} not found in database!`);
  }

  await mongoose.disconnect();
}

checkPost().catch(console.error);
