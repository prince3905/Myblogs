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

## 3. SEO & Metadata
- **Slug:** Must be lowercase, hyphenated, and include primary keywords.
- **Keywords:** Array of 5-8 trending tags.
- **Summary:** Exactly 2 sentences that hook the reader.

## 4. Image Logic
- **imageTag:** Generate a specific search keyword (e.g., 'minimalist-workspace').
- **Implementation:** The frontend will use `https://source.unsplash.com/featured/?<imageTag>` or `https://loremflickr.com/800/400/<imageTag>`.

## 5. Tone & Language
- Language: Professional yet engaging.
- Year Context: Always write considering the current year is 2026.
