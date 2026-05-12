const axios = require('axios');

const OLLAMA_CHAT_URL = 'http://127.0.0.1:11434/api/chat';
const VALID_CATEGORIES = ['Technology', 'Career', 'Tutorial', 'News'];

function matchCategory(text) {
  if (!text) return 'Technology';
  const lower = text.toLowerCase();
  const match = VALID_CATEGORIES.find(c => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower));
  return match || 'Technology';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractKeywords(text, count = 6) {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, count).map(e => e[0]);
}

function extractFirstSentence(text) {
  const match = text.match(/[^.!?\n]+[.!?\n]/);
  return match ? match[0].trim() : text.slice(0, 200);
}

function cleanHtml(html) {
  if (!html) return '';
  let h = html;
  h = h.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  h = h.replace(/\\\[begin\{code\}.*?\\\[\/code\]/gs, '').replace(/\\\[begin\{enumerate\}.*?\\\[\/enumerate\]/gs, '');
  h = h.replace(/\\\[/g, '').replace(/\\\]/g, '');
  h = h.replace(/Frequ\d+\s*[:.]?\s*/gi, '');
  h = h.replace(/\bQ\d+[:.]?\s*/gi, '');
  h = h.replace(/<\/?(?:ol|ul)>\s*<\/?(?:li|ul|ol)>/g, '');
  h = h.replace(/<li>\s*<\/li>/g, '');
  h = h.replace(/\n{3,}/g, '\n\n');
  h = h.replace(/([^>])\s*<h2>/g, '$1</p>\n<h2>');
  h = h.replace(/<\/h2>\s*<p>/g, '</h2>\n<p>');
  return h.trim();
}

async function generateAIContent(req, res) {
  try {
    const { title, model, length, tone, command } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const toneMap = {
      informative: 'Informative and educational. Explain concepts with examples.',
      funny:       'Fun, light-hearted, and humorous. Keep it entertaining.',
      professional:'Formal and professional. Authoritative tone.',
      beginner:    'Beginner-friendly. Simple language, no jargon.',
      critical:    'Opinionated with a strong stance and reasoning.'
    };

    const sectionMap = {
      short:  '2 <h2> sections with 1 <p> each, plus a small <ul>',
      medium: '3 <h2> sections with 2 <p> each, plus a <ul> in one section',
      long:   '4-5 <h2> sections with 2-3 <p> each, plus a <ul> and FAQ section'
    };

    const systemPrompt = `You are a blog writing AI for Inkspire Content Studio. Current year: 2026.

OUTPUT RULES:
- Return ONLY a valid JSON object. No markdown, no backticks, no explanations.
- JSON fields: "content", "slug", "keywords", "summary", "imageTag"

CONTENT RULES (for the "content" field which is HTML):
- Use <h2> for main sections, <h3> for sub-sections or FAQ items
- Always put a blank line between a heading and a paragraph
- Close every tag properly: </h2>, </h3>, </p>, </li>
- NEVER put a heading inside a <p> — close </p> BEFORE any <h2> or <h3>
- Use <ul><li> for bullet points
- FAQ format: <h3>Question: ...</h3><p>Answer: ...</p>
- Strictly NO labels like "Frequ01", "Frequ02", "Q1"
- End with a detailed <h2>Conclusion</h2> (3-4 sentences)
- NO code blocks, NO pre tags, NO markdown inside HTML

SEO RULES:
- "slug": lowercase, hyphenated, include primary keywords from title
- "keywords": array of 5-8 trending, relevant tags
- "summary": exactly 2 engaging sentences that hook the reader
- "imageTag": a single keyword string for stock photos (e.g. "remote-work-setup", "minimalist-workspace")

OUTPUT EXAMPLE:
{"content":"<h2>Introduction</h2>\\n<p>First paragraph...</p>\\n<h2>Topic</h2>\\n<p>Details...</p>\\n<ul>\\n<li>Point</li>\\n</ul>\\n<h2>Conclusion</h2>\\n<p>Final thoughts...</p>","slug":"primary-keyword-slug","keywords":["tag1","tag2","tag3","tag4","tag5"],"summary":"First sentence. Second sentence.","imageTag":"relevant-search-keyword"}`;

    const toneInstr = toneMap[tone] || toneMap.informative;
    const sectionInstr = sectionMap[length] || sectionMap.medium;
    const customInstr = command ? `\n\nAuthor's extra instruction: ${command}` : '';

    const tokenBudget = length === 'short' ? 1792 : length === 'long' ? 3584 : 2560;

    const userPrompt = `Write a ${toneInstr.toLowerCase()} blog post for 2026 about: "${title}"

Structure: ${sectionInstr}. Include a FAQ section with 2-3 questions using <h3>Question: format.${customInstr}

Respond ONLY with the JSON object. No markdown. No backticks.`;

    const response = await axios.post(OLLAMA_CHAT_URL, {
      model: model || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      options: {
        temperature: 0.7,
        repeat_penalty: 1.15,
        top_k: 40,
        top_p: 0.9,
        num_predict: tokenBudget
      }
    }, {
      timeout: length === 'long' ? 300000 : 180000
    });

    let text = response.data?.message?.content || '';

    // Strip markdown code fences if the model ignores the instruction
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    if (!text) {
      return res.status(500).json({ success: false, message: 'AI returned empty response' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    // Extract or derive content
    const rawContent = parsed?.content || text;
    const content = cleanHtml(rawContent);

    // Fallback fields if JSON parsing failed or fields are missing
    const plainText = stripHtml(content || '');
    const firstSentence = extractFirstSentence(plainText);

    let slug = parsed?.slug || makeSlug(title);
    if (parsed?.slug) {
      slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    const summary = parsed?.summary || firstSentence.slice(0, 300);
    const keywords = Array.isArray(parsed?.keywords) ? parsed.keywords : extractKeywords(plainText);
    const imageTag = parsed?.imageTag || makeSlug(title).split('-').slice(0, 2).join('-') || 'blog-post';

    if (!content) {
      return res.status(500).json({ success: false, message: 'AI returned empty content' });
    }

    res.json({
      success: true,
      content,
      slug,
      summary: summary.slice(0, 300),
      seoTitle: title.length > 70 ? title.slice(0, 67) + '...' : title,
      seoDescription: summary.slice(0, 155),
      keywords,
      category: matchCategory(title + ' ' + plainText),
      imageTag
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        message: 'Ollama is not running. Please start Ollama and try again.',
        ollamaOffline: true
      });
    }

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: 'Ollama is taking too long. Try again or use a shorter title.',
        ollamaTimeout: true
      });
    }

    if (error.response) {
      console.error('Ollama error response:', error.response.status, error.response.data);
    } else {
      console.error('AI generation error:', error.message);
    }

    res.status(500).json({ success: false, message: 'Failed to generate content' });
  }
}

module.exports = { generateAIContent };
