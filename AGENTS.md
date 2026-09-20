# GLOBAL GOVERNMENT JOBS & GLOBAL NEWS PORTAL — AI AGENT CONSTITUTION & RULES
**File:** `AGENTS.md`  
**Binding Status:** MANDATORY FOR ALL SESSIONS & AI AGENTS  
**Last Updated:** 2026-09-18

---

## 🏛️ 1. Core Mission & Exclusive Niche
1. **Single Exclusive Focus:** The entire website's exclusive niche is **Global Government Jobs (195 Sovereign Countries & 7 Continents)** and **Global News (World Affairs & International Policy)**.
2. **Deprecated Categories:** All non-job/generic categories (`AI & Web Tools`, `Tech & Tutorials`, `Health & Wellness`, `Finance & Business`, `News & Trends`) are deprecated and closed from frontend navigation and auto-publishers.
3. **Preservation of Existing Indian Sarkari Automations (CRITICAL):**
   - **DO NOT TOUCH, DELETE, OR BREAK** existing Indian scrapers, `liveAlerts` DOM scrapers, or `autoPublisher` routines for UPSC, SSC, Railways, and Indian State PSCs.
   - They must remain 100% active and cleanly housed inside the **"🇮🇳 India (Sarkari)"** section.

---

## 🛡️ 2. "Boutique Company" Anti-Ban Framework (Never Operate Like an AI Bot)
To prevent Google AdSense bans, Google Search "Scaled Content Abuse" penalties, and AI API quota blocks:
1. **Human Publishing Pace:**
   - **DO NOT flood the database.** Maximum **15 to 25 high-value, verified notifications per day**.
   - Background jobs must run with natural randomized jitter (15–45 second natural delays between fetches).
2. **Professional Media Identity (E-E-A-T):**
   - The portal must look and read like it is managed by a prestigious career intelligence media firm:
     - `Verified by: Global Careers Intelligence Desk`
     - `Source: Official Federal Gazette / Public Service Commission Circular`
     - Mandatory company footers: *About Research Desk, Gazette Verification Policy, Editorial Standards & Corrections, Contact Support*.
3. **Zero AI Boilerplate / Fluff:**
   - **STRICTLY PROHIBITED:** Phrases like *"In this digital era...", "Technology is evolving rapidly...", "As an AI...", "As we all know..."*.
   - Output must be 100% factual: Official Department, Gazette Notification Reference ID, Pay Scale, Education, Age Limit, and Direct Official Link.
4. **Zero Faltu / Zero Promotional Links (STRICT RULE):**
   - **ABSOLUTELY NO SPAM OR PROMOTIONAL REDIRECTS:** No affiliate spam, no betting/loan links, no fake third-party consultant portals, no shady middleman redirects.
   - **100% PURE OFFICIAL LINKS ONLY:** Every external apply link must go directly to the verified official government portal (`.gov`, `.gob`, `.gouv`, `.go.*`, `.nic.in`) or official multilateral domain (`un.org`, `who.int`, `worldbank.org`).
   - Pure official PDF gazette downloads only. Maintain 100% user trust and authority.

---

## 📍 3. Smart Geo-Priority Ranking Algorithm
1. **Country Priority #1 (+1000 Points):**
   - The visitor's detected country (via GeoIP / Browser Locale) or manually selected country's vacancies **MUST BE PINNED AT THE VERY TOP** in a dedicated spotlight section:
     `📍 Top Live Vacancies in Your Country: [Country Name]`
2. **International / Visa-Sponsored Priority #2 (+500 Points):**
   - UN, WHO, World Bank, and expat-open government contracts are shown next.
3. **Regional & Worldwide Hubs (+250 Points):**
   - Neighbors within the same continent, followed by the rest of the 195 nations.

---

## 📅 4. Chronological Date-Wise Timeline (आज, कल, परसों)
Every country's jobs and global feeds must follow a strict freshness hierarchy:
1. 🟢 **🔥 आज जारी हुई (Posted Today - Live):** Jobs posted within the last 24 hours with a pulsing "NEW TODAY" badge.
2. 🟡 **⚡ कल जारी हुई (Posted Yesterday):** Verified circulars released yesterday with a gold "YESTERDAY" badge.
3. ⚪ **📅 परसों व इस सप्ताह (Earlier This Week / 2-3 Days Ago):** Active notifications from earlier this week.
4. 🔴 **⏳ अंतिम तिथि निकट (Closing Soon):** Vacancies closing within 3-7 days.
- Include quick-filter toggle: `[All] | [🔥 आज (Today)] | [⚡ कल (Yesterday)] | [📅 इस सप्ताह] | [⏳ लास्ट डेट निकट]`.

---

## 🌟 5. Layout & Ultra-Premium Pop-Up Modal (Popup Drawer)
1. **Main Feed Layout:**
   - Inspired by the high-converting `PublicLiveAlertsPage.jsx` interface.
   - Top status bar: 195 Countries Live Sync + Visitor Country Flare + 33-Language Switcher.
   - Quick-Filter Pills: Continental Hubs (All, India, Gulf, Europe, Americas, Asia, Africa) + Categories (Civil Services, Healthcare, Tech/Engineering, Defense/Police, Education).
2. **On-Click Detail Pop-Up (Modal):**
   - Clicking on any job card opens an ultra-premium Obsidian Glassmorphic Modal:
     - Verified Official Shield 🛡️ + Country Flag + Ministry Crest
     - Dual-Language Toggle: `[🏛️ मूल सरकारी गजट (Original)]` ⇄ `[🌐 मेरी भाषा में अनुवाद (Translated)]`
     - Quick Fact Grid: Pay Scale, Education, Duty Station, Deadline, Citizenship criteria
     - Verified Action Buttons:
       - 🟢 `Apply on Official Portal (Direct .gov Link)`
       - 🔵 `Download Official Gazette (PDF)`
       - 📢 `Share on WhatsApp` & `Share on Telegram`

---

## 📰 6. Global News Engine (World Affairs & Policy)
1. **Transformation:** The old local news feed is converted to **"Global News (विश्व समाचार)"**.
2. **Sources:** UN News, Reuters World, AP Global, BBC World, Al Jazeera.
3. **Native Delivery:** Automatically presented in the visitor's local language via Hy-MT2 / translation cache, with the same 1-click dual-language toggle.

---

## 🚀 7. Fast Indexing & SEO Protocol
1. **Google for Jobs Schema:** Every job URL must inject official `JobPosting` JSON-LD structured data.
2. **Google Indexing API & IndexNow:** Send real-time ping to Google Indexing API and Microsoft IndexNow on job creation.
3. **Hreflang Tags:** Clean internationalization tags (`hreflang="es"`, `hreflang="ar"`, `hreflang="hi"`, `hreflang="en"`) across 33+ languages.
4. **Segmented XML Sitemaps:** `sitemap-today.xml`, `sitemap-yesterday.xml`, `sitemap-countries.xml`.
5. **Zero Orphan Pages:** Every job linked from country, category, and date hub pages.

---

## 🗑️ 8. Free Database Quota Protection (60-Day TTL Auto-Delete)
1. **MongoDB Atlas 512MB Quota:**
   - All global jobs must have a native MongoDB TTL Index:
     ```javascript
     globalJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 }); // 60 Days
     ```
   - Automatically purges expired vacancies older than 60 days in the background.
   - Storage must remain permanently under 50MB (90%+ free space).

---

## 🚶‍♂️ 9. Phased Safe Expansion (धीरे-धीरे सुरक्षित फैलाव)
1. **Phase 1 (Immediate):** 🇮🇳 India (Sarkari) + 🇺🇳 UN/Multilateral (170+ countries) + 🕌 Gulf (UAE, Saudi, Qatar)
2. **Phase 2:** 🇺🇸 USA (USAJOBS) + 🇬🇧 UK + 🇨🇦 Canada + 🇦🇺 Australia
3. **Phase 3:** 🇪🇺 Europe (EU EPSO, Germany, France, Spain) + 🌎 Latin America (Brazil, Mexico)
4. **Phase 4:** 🌏 Asia-Pacific (Japan, Korea, Singapore) + 🌍 Africa (South Africa, Nigeria, Kenya)
5. **Phase 5:** Complete 195 Sovereign Countries & Island Nations.

---

## ⚡ 10. PageSpeed Insights 90+ Standard (Performance & Core Web Vitals)
1. **Target Score:** Mobile Performance ≥ 90/100, Desktop Performance ≥ 95/100, SEO 100/100, Accessibility ≥ 95/100.
2. **Zero Initial Script Bloat:**
   - Google AdSense (`adsbygoogle.js`) and Google Analytics (`gtag.js`) must NEVER load during initial page load or timer-based triggers.
   - They load exclusively on genuine user interactions (`touchstart`, `wheel`, `scroll`).
3. **Core Web Vitals Optimization:**
   - **LCP (Largest Contentful Paint ≤ 2.5s):** Hero banners and logos must use modern WebP format with width/height explicitly specified.
   - **CLS (Cumulative Layout Shift ≤ 0.1):** All ad units, job card containers, and dynamic sections must have fixed `minHeight` reserved in CSS to prevent layout jumping.
   - **FID / INP (Interaction to Next Paint ≤ 200ms):** Heavy client-side processing must use web workers or requestIdleCallback; keep main thread free.
4. **Caching & Asset Delivery:**
   - Static assets (`/assets/*.js`, `/assets/*.css`, fonts, images) must be served with immutable `Cache-Control: public, max-age=31536000, immutable`.
   - Compression (gzip/brotli) enabled across all text, JSON, and XML responses.

---

## 🛑 11. Indexing Quota & Rate Limit Protection Protocol (Zero Ban / Zero 429)
1. **Google Indexing API Daily Safety Cap:**
   - Google allows 200 requests/day per service account.
   - The system must enforce a hard in-memory/daily cap of **180 requests/day**.
   - Once 180 requests are reached, further Google Indexing calls are automatically paused until UTC midnight reset.
2. **Multi-Engine IndexNow Protocol:**
   - Instant notifications to Bing, Yandex, Seznam, and Naver via IndexNow (no daily quota penalty).
   - Batch pings supported up to 500 URLs per call.
3. **Segmented XML Sitemaps:**
   - Dynamic `sitemap.xml` automatically includes `/global-jobs`, `/global-news`, and major country hubs (`/global-jobs/IN`, `/global-jobs/US`, `/global-jobs/AE`, `/global-jobs/GB`, etc.).
   - Pure canonical URLs only (HTTP -> HTTPS single-hop normalization, no trailing slash duplication).

---

## 🛡️ 12. Google AdSense Policy Strict Compliance (Anti-Policy Violation)
1. **Accidental Click Prevention:**
   - Minimum **28px to 32px vertical margin** around every ad unit (`my: 4`).
   - No interactive buttons, dropdowns, or navigation links placed directly adjacent to ad units.
2. **Clear Advertising Label:**
   - Every ad container must carry an official, visible disclosure label:
     `Advertisement / विज्ञापन`
3. **Zero Ads on Invalid or Thin Pages:**
   - Strictly NO ads on 404 pages, empty search results, login screens, or pages with under 150 words of verified content.
   - If no ad code is configured in admin, `AdSlot` must return `null` — NEVER display empty dashed boxes or fake "Ad Space" placeholders on live pages.
4. **Publisher E-E-A-T Disclosures:**
   - Footer must permanently provide direct links to: *About Us, Contact Us, Privacy Policy, Terms & Conditions, Gazette Verification Policy, Editorial Standards*.

---

## 🔍 13. Enterprise-Grade SEO & Structured Data Architecture
1. **JSON-LD Schema Markup:**
   - Every job notice must output valid `JobPosting` schema with: `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation` (country ISO code).
   - Global News pages must output valid `NewsArticle` schema.
   - Static and category hubs must output `BreadcrumbList` schema.
2. **Page Architecture:**
   - Exactly **one `<h1>` tag per page** containing high-intent target keywords.
   - Descriptive meta title (under 60 characters) and meta description (120–160 characters).
   - Social meta tags: `og:title`, `og:description`, `og:image`, `twitter:card`.
   - Dynamic canonical tag self-referencing the normalized URL.

---

## 🌐 14. Dynamic Country-Based Localization & Geo-Targeting Architecture
1. **Visitor Geo-Priority:**
   - Auto-detect visitor's country via IP headers / browser timezone.
   - Pinned Spotlight: `📍 Top Live Vacancies in Your Country: [Country Name]` shown at the very top.
2. **Multi-Country Hubs:**
   - Dedicated URLs for every major country (e.g. `/global-jobs/IN`, `/global-jobs/US`, `/global-jobs/AE`, `/global-jobs/GB`).
3. **Dual-Language & Multi-Currency Engine:**
   - Instant 1-click toggle: `[🏛️ मूल सरकारी गजट (Original)]` ⇄ `[🌐 मेरी भाषा में अनुवाद (Translated)]`.
   - Multi-currency salary display according to the issuing country (`₹ INR`, `$ USD`, `£ GBP`, `€ EUR`, `AED Dirham`, `SAR Riyal`).
   - Full 33-language real-time translation support across the entire interface.

---

## 🚨 15. Real-World Anti-Fraud & Candidate Protection Standard (फर्जी भर्ती व स्कैम रोकथाम)
1. **Prominent Anti-Fraud Advisory:**
   - Every job notice modal and page must carry a clear official warning:
     `⚠️ धोखाधड़ी से सावधान (Anti-Fraud Warning): सरकारी विभाग कभी भी किसी व्यक्तिगत बैंक खाते, QR कोड या UPI पर भर्ती शुल्क नहीं मांगते। केवल आधिकारिक .gov पोर्टल से ही आवेदन करें।`
2. **100% Direct Official Links Only:**
   - Direct link to official federal, provincial, or ministry portals (`.gov`, `.gob`, `.gouv`, `.nic.in`) or multilateral agencies (`un.org`, `who.int`).
   - Absolute ban on third-party consultant redirects, payment aggregators, or fake form collection traps.

---

## 🛡️ 16. Automated DDoS, Rogue Scraper & Bot Defense (सर्वर सुरक्षा व बॉट नियंत्रण)
1. **API Rate Limiter:**
   - Public `/api/*` endpoints must enforce an in-memory sliding-window rate limit (180 req/minute per IP).
   - Blocks aggressive scraper scripts (`python-requests`, headless bots) from scraping the full database or exhausting MongoDB Atlas connection pools.
2. **Graceful Degradation:**
   - If MongoDB Atlas experiences an intermittent network disconnect, fallback to memory cache and stale-while-revalidate data rather than throwing unhandled 500 errors to visitors.

---

## ♿ 17. Candidate Accessibility & WCAG 2.1 AA Compliance (दिव्यांग व दृष्टिबाधित सुलभता)
1. **Screen Reader Optimization:**
   - All icon buttons (WhatsApp share, Telegram share, modal close, language selector) must have clear, descriptive `aria-label` attributes.
2. **High Color Contrast:**
   - Maintain minimum 4.5:1 text-to-background contrast ratio for all text elements.
3. **Keyboard Navigability:**
   - Complete keyboard accessibility: Focus rings visible on tab navigation, and modals dismissable via `Esc` key.

---

## ⏳ 18. Graceful Expiry & 404 Prevention Protocol (पुरानी भर्तियों की समाप्ति नीति)
1. **No Broken 404 Pages:**
   - Vacancies that have passed their closing deadline must NEVER be deleted immediately or converted into hard 404 errors (which destroy SEO rankings).
2. **Application Closed Alert:**
   - Expired notices display an amber/red banner: `⏳ आवेदन की अंतिम तिथि समाप्त (Application Closed)`.
   - Below the notice, automatically recommend 3 to 5 live active vacancies in the same department or country.

---

## 📲 19. Viral Student Community Engagement (व्हाट्सएप व टेलीग्राम डायरेक्ट शेयरिंग)
1. **Instant 1-Click Sharing:**
   - Every job notice card and modal must feature high-converting direct share buttons for WhatsApp and Telegram.
2. **Pre-Formatted Verified Notification Message:**
   - Shared text must be crisp, factual, and formatted with emoji bullets:
     - 🏛️ पद एवं विभाग (Post & Ministry)
     - 💰 वेतनमान (Pay Scale)
     - 📍 तैनाती स्थल (Duty Station / Country)
     - 📅 अंतिम तिथि (Closing Deadline)
     - 🔗 100% सत्यापित आधिकारिक लिंक (Direct Official Gazette Link)

---

## 🔒 20. Privacy & Legal Compliance (GDPR, DPDP Act & Cookie Standard)
1. **Cookie & Tracking Consent:**
   - Third-party tracking scripts (Google Analytics, AdSense) must only activate on user interaction.
2. **E-E-A-T Transparency:**
   - Footer must permanently provide working links to: *About Us, Gazette Verification Policy, Editorial Standards, Privacy Policy, Terms of Service, and Contact Desk*.


