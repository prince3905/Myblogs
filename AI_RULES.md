# Inkspire Content Studio - AI Writing Rules

## 1. Response Format
- Return ONLY a valid JSON object.
- No markdown code blocks (like ```json) in the response.

## 2. Content Structure (HTML)
- **Headings:** Use `<h2>` for main sections and `<h3>` for sub-sections.
- **Spacing:** Always add a blank line between a heading and a paragraph to avoid merging.
- **Lists:** Use `<ul>` and `<li>` for readability.
- **FAQs:** Format as `<h3>Question: [Question Text]</h3>` followed by `<p>Answer: [Answer Text]</p>`.
  - Strictly avoid labels like "Frequ01" or "Frequ02".

## 3. Strict No-Code Rule
- Content me kabhi bhi "interru01", "Frequ01" ya koi bhi alphanumeric code mat likho.
- Agar list deni hai to sirf standard HTML `<li>` use karo.

## 4. Human-Like Flow (No Over-Quoting)
- Har sentence ko double quotes (" ") me mat rakho.
- Sirf actual quotes ya specific technical terms ke liye quotes use karo.
- Content natural aur flow me hona chahiye, robot jaisa nahi.

## 5. Heading Separation
- Heading (`<h2>`, `<h3>`) aur paragraph ke beech hamesha ek proper space rakho.
- Heading khatam hote hi bina space ke paragraph start mat karo.

## 6. Table of Contents
- Heading text short aur clean rakho.
- Poora paragraph heading me mat dalo — sirf 3-5 words ka crisp heading rakho.

## 7. SEO & Metadata
- **Slug:** Must be lowercase, hyphenated, and include primary keywords.
- **Keywords:** Array of 5-8 trending tags.
- **Summary:** Exactly 2 sentences that hook the reader.

## 8. Image Logic
- **imageTag:** Generate a specific search keyword (e.g., 'minimalist-workspace').
- **Implementation:** The frontend will use `https://loremflickr.com/800/400/<imageTag>` or `https://picsum.photos/seed/<imageTag>/800/400`.

## 9. Tone & Language
- Language: Professional yet engaging.
- Year Context: Always write considering the current year is 2026.
