# Inkspire Content Studio - AI Writing Rules

## 1. Response Format
- Return ONLY a valid JSON object.
- No markdown code blocks (like ```json) in the response.

## 2. Content Structure (HTML)
- **Headings:** Use `<h2>` for main sections and `<h3>` for sub-sections.
- **Spacing:** Heading ke baad hamesha EK BLANK LINE chhoro. Heading aur paragraph kabhi merge mat karo.
- **Lists:** Use `<ul>` and `<li>` for readability.
- **FAQs:**
  - Har FAQ ko `<h3>Question: [Text]</h3>` heading mein rakho aur answer `<p>` mein.
  - Har FAQ ke beech `<hr/>` ya extra blank line dalo taake wo alag dikhein.
  - "Frequ01", "Frequ02" ya koi bhi alphanumeric labels STRICTLY NO. Direct question hi heading banao.

## 3. Strict No-Code Rule
- Content me kabhi bhi "interru01", "Frequ01" ya koi bhi alphanumeric code mat likho.
- Agar list deni hai to sirf standard HTML `<li>` use karo.

## 4. Human-Like Flow & Title-to-Content Bridge
- **Title ke baad seedha content start mat karo.**
- Pehle ek small "hook" line likho (1 line, attention-grabbing).
- Phir Table of Contents (as a bullet list).
- Uske baad `<h2>` heading se actual content start karo.
- Introduction ko Title se alag dikhna chahiye — woh content ka first section hai, title ka part nahi.
- Har sentence ko double quotes (" ") me mat rakho.
- Sirf actual quotes ya specific technical terms ke liye quotes use karo.
- Content natural aur flow me hona chahiye, robot jaisa nahi.
- "Introduction to React", "In this article", "Let's dive in" jaise generic intro phrases baar-baar repeat mat karo.

## 5. Heading Separation
- Heading (`<h2>`, `<h3>`) aur paragraph ke beech hamesha ek proper space rakho.
- Heading khatam hote hi bina space ke paragraph start mat karo.

## 6. Table of Contents
- Heading text short aur clean rakho.
- Poora paragraph heading me mat dalo — sirf 3-5 words ka crisp heading rakho.
- ToC links me sirf heading ka naam do, pura sentence nahi.

## 7. SEO & Metadata
- **Slug:** Must be lowercase, hyphenated, and include primary keywords.
- **Keywords:** Array of 5-8 trending tags.
- **Summary:** Exactly 2 sentences that hook the reader.

## 8. Image Logic
- **imageTag:** Generate a specific search keyword (e.g., 'minimalist-workspace').
- **imageKeywords:** Generate 2-3 search-optimized words. The first word from keywords array will be used to fetch a matching image from Pexels.
- **Implementation:** The frontend sends the first keyword to the Pexels API backend endpoint (`POST /api/pexels/search`) which returns a matching HD image.
- Fallback: If Pexels API key is missing, uses curated Unsplash HD photos.
- Image should be **bright, high-quality, and professional**. Avoid dark/grainy stock photos.

## 9. Tone & Language
- Language: Professional yet engaging — like a premium media house (e.g., The Verge, TechCrunch).
- Year Context: Always write considering the current year is 2026.
- Content readable aur human-like hona chahiye. Boring ya robotic mat likho.

## 10. Depth, Uniqueness & Visual Rhythm

### Paragraph Length
- **Ek paragraph 3-4 lines se zyada bada nahi hona chahiye.** Mobile pe koi lamba paragraph nahi padhta.
- Beech-beech mein **Bold Keywords** aur `<blockquote>` (quotes) ka use karo taake reader ki aankhein thakein nahi.
- Har **200 words ke baad** ek **Visual Break** dalo — jaise bullet points, bold text, blockquote, ya heading.

### Examples & Depth
- Har section mein kam se kam 2-3 paragraphs likho. Ek line likh ke next heading pe mat chale jao.
- Repeated generic phrases avoid karo (e.g., "Introduction to React", "In conclusion", "Let's explore").
- Real examples, comparisons, ya scenarios add karo jo reader ko value de.

### Key Takeaways
- **Content ke end mein** ek "Key Takeaways" section zaroor dalo — 4-5 bullet points ka box jo poora article summarize kare.

### Visual Cleanliness
- "Frequ01/Question:" labels ko hata kar direct **bold questions** generate karo.
- Content "bheed" jaisa nahi laghna chahiye — har cheez properly structured aur spaced ho. Premium media house vibe.
