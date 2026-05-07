# Blogging Web MERN

Standalone MERN blogging website with:
- public blog pages
- admin login
- create, edit, delete post
- draft and publish flow
- SEO title, description, keywords, canonical URL
- sitemap and robots endpoints

## Folder structure

```text
blogging-web-mern/
├── client/
│   └── src/
│       ├── app/
│       ├── assets/
│       ├── features/
│       │   ├── admin/
│       │   ├── auth/
│       │   └── blog/
│       └── shared/
├── server/
│   └── src/
│       ├── config/
│       ├── modules/
│       │   ├── auth/
│       │   ├── posts/
│       │   └── users/
│       └── shared/
├── PLAN.md
└── README.md
```

## Run locally

### 1. Start MongoDB
Make sure MongoDB is running locally on:
`mongodb://127.0.0.1:27017/blogging-web-mern`

### 2. Start backend
```bash
cd server
npm install
npm run dev
```

### 3. Start frontend
```bash
cd client
npm install
npm run dev
```

## URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Sitemap: `http://localhost:5001/sitemap.xml`
- Robots: `http://localhost:5001/robots.txt`

## Default admin login
- Email: `admin@example.com`
- Password: `admin12345`

The admin user is auto-seeded on first backend start.
