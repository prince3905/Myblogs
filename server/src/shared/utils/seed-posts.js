const mongoose = require('mongoose');
const BlogPost = require('../../modules/posts/post.model');
const env = require('../../config/env');

async function seedPosts() {
  await mongoose.connect(env.mongoUri);

  const posts = [
    {
      title: 'Getting Started with React',
      slug: 'getting-started-with-react',
      excerpt: 'Learn the basics of React and how to build modern web applications.',
      content: '<p>React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.</p><p>In this guide, we will cover the fundamentals of React including components, props, state, and hooks.</p>',
      category: 'Technology',
      tags: ['React', 'JavaScript', 'Frontend'],
      status: 'published',
      publishedAt: new Date(),
      readingTime: 5
    },
    {
      title: 'Understanding Node.js and Express',
      slug: 'understanding-nodejs-express',
      excerpt: 'A beginner-friendly guide to building backend APIs with Node.js and Express.',
      content: '<p>Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine. Express is a minimal and flexible Node.js web application framework.</p><p>Together, they make it easy to build robust APIs and web servers with JavaScript on the backend.</p>',
      category: 'Technology',
      tags: ['Node.js', 'Express', 'Backend'],
      status: 'published',
      publishedAt: new Date(),
      readingTime: 6
    },
    {
      title: 'Building a MERN Stack Blog from Scratch',
      slug: 'building-mern-stack-blog-from-scratch',
      excerpt: 'A complete guide to building a full-stack blog application using MongoDB, Express, React, and Node.js.',
      content: `<p>Building a blog from scratch using the MERN stack is a great way to learn full-stack development. In this article, we'll walk through the process of creating a complete blogging platform.</p>
<h2>What is MERN Stack?</h2>
<p>MERN stands for MongoDB, Express.js, React, and Node.js. It's a popular JavaScript stack for building modern web applications:</p>
<ul>
<li><strong>MongoDB</strong> - NoSQL database for storing blog posts and user data</li>
<li><strong>Express.js</strong> - Web framework for Node.js to build RESTful APIs</li>
<li><strong>React</strong> - Frontend library for building user interfaces</li>
<li><strong>Node.js</strong> - JavaScript runtime for the server-side</li>
</ul>
<h2>Project Structure</h2>
<p>A well-organized MERN project typically has two main folders:</p>
<pre><code>project/
├── client/  # React frontend
└── server/  # Express backend</code></pre>
<h2>Key Features to Implement</h2>
<ol>
<li><strong>Blog CRUD</strong> - Create, Read, Update, Delete posts</li>
<li><strong>Admin Authentication</strong> - JWT-based admin login</li>
<li><strong>Draft/Publish Flow</strong> - Save drafts before publishing</li>
<li><strong>SEO Optimization</strong> - Meta tags, sitemap, robots.txt</li>
<li><strong>Rich Content</strong> - Support for HTML content</li>
</ol>
<h2>Backend Setup</h2>
<p>Start by setting up Express server with MongoDB connection:</p>
<pre><code>const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());</code></pre>
<h2>Frontend with React</h2>
<p>Use Vite for fast development experience and React Router for navigation between pages like Home, Blog List, and Single Post views.</p>
<h2>Conclusion</h2>
<p>Building a MERN blog teaches you full-stack development concepts including REST APIs, database modeling, authentication, and frontend routing. Start simple and gradually add features!</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
      category: 'Technology',
      tags: ['MERN', 'Full-Stack', 'Tutorial', 'MongoDB', 'React'],
      status: 'published',
      publishedAt: new Date(),
      readingTime: 8,
      seoTitle: 'Build a MERN Stack Blog - Complete Guide',
      seoDescription: 'Learn how to build a complete blog application using MongoDB, Express, React, and Node.js with admin panel and SEO features.',
      seoKeywords: ['MERN stack', 'blog tutorial', 'full stack development', 'React blog']
    },
    {
      title: 'Why Every Developer Should Write Blog Posts',
      slug: 'why-every-developer-should-write-blog-posts',
      excerpt: 'Discover the benefits of technical blogging and how it can accelerate your growth as a developer.',
      content: `<p>Writing technical blog posts is one of the best things you can do for your career as a developer. Here's why you should start today.</p>
<h2>1. Solidify Your Learning</h2>
<p>When you write about a topic, you realize what you truly understand and what you don't. Writing forces you to organize your thoughts and fill knowledge gaps.</p>
<h2>2. Build Your Online Presence</h2>
<p>A blog establishes your digital footprint. It showcases your expertise to potential employers, clients, and the developer community.</p>
<h2>3. Help Others Learn</h2>
<p>Someone out there is struggling with the exact problem you just solved. Your blog post could be the resource that helps them.</p>
<h2>4. Improve Communication Skills</h2>
<p>Technical writing improves your ability to explain complex concepts clearly - a crucial skill for senior developers.</p>
<h2>5. Create a Personal Knowledge Base</h2>
<p>Your blog becomes a reference you can return to when you encounter similar problems in the future.</p>
<h2>Getting Started</h2>
<p>Don't worry about perfection. Start with:</p>
<ul>
<li>Tutorial posts about things you learned</li>
<li>Problem-solving posts about bugs you fixed</li>
<li>Comparison posts about tools you've tried</li>
<li>Project showcase posts</li>
</ul>
<p>Remember: The best time to start writing was yesterday. The second best time is now!</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
      category: 'Career',
      tags: ['Blogging', 'Career Growth', 'Technical Writing'],
      status: 'published',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      readingTime: 5,
      seoTitle: 'Why Developers Should Blog - Career Growth Tips',
      seoDescription: 'Discover 5 reasons why every developer should write blog posts and how technical blogging accelerates career growth.',
      seoKeywords: ['developer blog', 'technical writing', 'career advice']
    }
  ];

  for (const post of posts) {
    const exists = await BlogPost.findOne({ slug: post.slug });
    if (!exists) {
      await BlogPost.create(post);
      console.log(`Created: ${post.title}`);
    } else {
      console.log(`Already exists: ${post.title}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

seedPosts().catch(err => {
  console.error(err);
  process.exit(1);
});
