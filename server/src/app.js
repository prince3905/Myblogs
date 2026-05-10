const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const postRoutes = require('./modules/posts/post.routes');
const adminRoutes = require('./modules/posts/admin-post.routes');
const commentRoutes = require('./modules/comments/comment.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const newsletterRoutes = require('./modules/newsletter/newsletter.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const { sitemap, robots, rssFeed } = require('./modules/posts/post.controller');

const app = express();
const publicPath = path.join(__dirname, '../public');

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', commentRoutes);
app.use('/api', contactRoutes);

// SEO routes - before static files
app.get('/sitemap.xml', sitemap);
app.get('/robots.txt', robots);
app.get('/rss.xml', rssFeed);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(publicPath));

// Handle client-side routing (React Router) - only if file doesn't exist
app.get('*', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  if (require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
