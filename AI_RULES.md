# Inkspire Content Studio - AI Writing Rules

## 1. Response Format
- Return ONLY a valid JSON object.
- No markdown code blocks (like ```json) in the response.

## 2. Content Structure (HTML)
- **Headings:** Use `<h2>` for main sections and `<h3>` for sub-sections.
- **Spacing:** Heading ke baad hamesha EK BLANK LINE chhoro. Heading aur paragraph kabhi merge mat karo.
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
- "Introduction to React", "In this article", "Let's dive in" jaise generic intro phrases baar-baar repeat mat karo.
- Har section mein 2-3 extra lines ka explanation dalo. Sirf 1 line likh ke mat chhoro.
- Examples, use-cases, ya real-world scenarios add karo taake content valuable lage.

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
- **imageKeywords:** Generate 2-3 search-optimized words. The first word from keywords array will be used to fetch a matching image from Pexels.
- **Implementation:** The frontend sends the first keyword to the Pexels API backend endpoint (`POST /api/pexels/search`) which returns a matching HD image.
- Fallback: If Pexels API key is missing, uses curated Unsplash HD photos.

## 9. Tone & Language
- Language: Professional yet engaging.
- Year Context: Always write considering the current year is 2026.
- Content readable aur human-like hona chahiye. Boring ya robotic mat likho.

## 10. Depth & Uniqueness
- Har section mein kam se kam 2-3 paragraphs likho. Ek line likh ke next heading pe mat chale jao.
- Repeated generic phrases avoid karo (e.g., "Introduction to React", "In conclusion", "Let's explore").
- Real examples, comparisons, ya scenarios add karo jo reader ko value de.
