# MERN Blogging Website Plan

## Objective
Build a standalone MERN blogging website outside `myShop` with working public pages, admin authentication, blog CRUD, SEO-ready fields, and clear local run instructions.

## Tech Stack
- MongoDB with Mongoose
- Express.js API
- React with Vite
- Node.js runtime
- JWT-based admin authentication

## Project Structure

### Backend Structure (server/)
```
server/
├── src/
│   ├── config/              # Environment configuration
│   ├── controllers/         # Route controllers
│   ├── models/              # Mongoose models
│   ├── routes/              # Express routes
│   ├── middleware/          # Auth, error handler, request logger
│   ├── utils/               # Utility functions
│   ├── validators/          # Input validation
│   ├── services/            # Business logic layer
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── .env
├── .env.example
└── package.json
```

### Frontend Structure (client/)
```
client/
├── src/
│   ├── app/                 # App router and top-level composition
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page components
│   ├── features/             # Feature-based modules
│   │   ├── admin/            # Admin dashboard and editor
│   │   ├── auth/             # Auth pages, guards, context
│   │   └── blog/             # Public blog pages and UI
│   ├── services/             # API service layer
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── assets/               # Static assets
│   ├── styles/               # Global styles
│   └── App.jsx
├── public/
└── package.json
```

### Root Structure
```
blogging-web-mern/
├── client/
├── server/
├── PLAN.md
├── README.md
└── .gitignore
```

## Backend Behavior
- DB connect hote hi message: `Database connected successfully`
- Server start hote hi message: `Server running on port XXXX`
- Error handler middleware
- Auth middleware
- Request logger
- CORS setup
- Environment variable validation
- 404 API handler
- Global exception handling

## Frontend Behavior
- API interceptor / request wrapper
- Token attach automatically
- Error response handle
- Loading state
- Toast/message system
- Protected routes
- SEO page title/meta update
- Reusable layout

## Blog Features
- Home page
- Blog list page
- Single blog page
- Admin login
- Admin dashboard
- Create post
- Edit post
- Delete post
- Draft/publish
- SEO title
- Meta description
- Slug
- Categories
- Tags
- Search
- Featured image
- Sitemap
- Robots.txt

## Clean Project Flow
- `.env.example`
- `README.md`
- `PLAN.md`
- `.gitignore`
- Proper seeding for admin user
- Proper API base URL config
- Separate public and admin routes
- Reusable UI components

## Project Style Like myShop
- Modular code
- Separate concerns
- Easy to scale
- Error handling already built
- DB connect message visible
- Auth flow clean
- API layer centralized

## Functional Scope
- Public home page with featured posts
- Blog listing page with search and category filtering
- Single post page with SEO meta tags and related posts
- Admin login page
- Admin dashboard with post table
- Create, edit, delete post
- Draft / Published status
- Slug-based post URLs
- SEO title, meta description, keywords, canonical URL support
- Reading time calculation
- Sitemap and robots.txt endpoints

## Data Model
### AdminUser
- `name`
- `email`
- `passwordHash`

### BlogPost
- `title`
- `slug`
- `excerpt`
- `content`
- `featuredImage`
- `category`
- `tags`
- `status` (`draft` or `published`)
- `seoTitle`
- `seoDescription`
- `seoKeywords`
- `canonicalUrl`
- `publishedAt`
- `readingTime`
- `createdAt`
- `updatedAt`

## API Routes
### Public
- `GET /api/posts`
- `GET /api/posts/slug/:slug`
- `GET /api/categories`
- `GET /api/meta/site`
- `GET /sitemap.xml`
- `GET /robots.txt`

### Admin Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Admin Posts
- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `GET /api/admin/posts`
- `GET /api/admin/posts/:id`

## Frontend Pages
- `/`
- `/blog`
- `/blog/:slug`
- `/admin/login`
- `/admin`
- `/admin/posts/new`
- `/admin/posts/:id/edit`

## Implementation Milestones
1. Scaffold standalone `client` and `server`
2. Build Express server, Mongo connection, auth, post model, CRUD APIs
3. Build React app routes and reusable layout
4. Build admin dashboard and post editor form
5. Add SEO metadata handling and public discovery features
6. Verify local startup and document usage

## Acceptance Criteria
- App runs with separate client and server commands
- Admin can log in and manage posts
- Public users can browse posts and open single article pages
- Slugs are unique and auto-generated when omitted
- SEO fields are editable per post
- Sitemap and robots endpoints respond correctly

## Environment Variables
### Server
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CLIENT_URL`
- `SITE_URL`

### Client
- `VITE_API_URL`

## Future Enhancements

### High Priority
1. **Comments System** - Readers can comment on posts
   - POST `/api/posts/:slug/comments` - Add comment
   - GET `/api/posts/:slug/comments` - Get comments
   - Admin can moderate/delete comments
   - Name, email, comment body, timestamp

2. **Pagination** - Blog list page me infinite scroll ya page numbers
   - Query params: `?page=1&limit=10`
   - Backend: paginated response with total count
   - Frontend: page numbers or load more button

3. **Related Posts** - Single post page par related posts show karein
   - Based on category and tags
   - Show 3-4 related posts at bottom of post

4. **Post Views Counter** - Kitne logon ne post padha
   - Increment view count on post fetch
   - Show view count on post card and single post

5. **Image Upload** - Featured image URL ki jagah file upload
   - POST `/api/admin/upload` - Upload image
   - Store in `/public/uploads` or cloud storage
   - Support drag-and-drop in editor

### Medium Priority
6. **Rich Text Editor** - Textarea ki jagah proper editor (Quill/TipTap)
   - WYSIWYG editor for post content
   - Support for headings, lists, links, images, code blocks
   - Toolbar with formatting options

7. **Social Sharing** - Facebook, Twitter, LinkedIn share buttons
   - Share buttons on single post page
   - Pre-filled with post title and URL
   - Open in new window

8. **Search with Filters** - Category + tag + date filter ke saath
   - Search bar with advanced filters
   - Filter by category, tags, date range
   - URL-based filters for shareable links

9. **Newsletter Subscription** - Email collect karne ka widget
   - POST `/api/newsletter/subscribe`
   - Email validation and duplicate check
   - Widget in sidebar or footer

10. **Reading Progress Bar** - Single post par scroll indicator
    - Fixed bar at top of page
    - Fills as user scrolls through content
    - Shows percentage read

### Advanced
11. **RSS Feed** - `/rss.xml` endpoint
    - XML feed of latest posts
    - Standard RSS format
    - Auto-generated from published posts

12. **Post Likes/Reactions** - Engagement metrics
    - Like button on posts
    - Show like count
    - No login required (cookie-based)

13. **Archive Page** - Month/year wise posts
    - `/blog/archive` page
    - Grouped by year and month
    - Collapsible accordion style

14. **Dark Mode Toggle**
    - Toggle button in header
    - Persist preference in localStorage
    - CSS variables for theming

15. **Breadcrumbs** - Navigation improvement
    - Show on blog list and single post
    - Format: Home > Blog > Category > Post Title
    - Clickable navigation

## Notes
- First boot auto-seeds one admin user from env vars
- Featured image is URL-based in v1 for faster implementation
- Rich text editor is kept simple as a textarea for reliability in first release
