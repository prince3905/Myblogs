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
