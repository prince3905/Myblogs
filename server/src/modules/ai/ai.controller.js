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

async function generateAIContent(req, res) {
  try {
    const { title, model, length, tone, command } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const toneMap = {
      informative: 'an informative and educational',
      funny:       'a fun, light-hearted and humorous',
      professional:'a formal and professional',
      beginner:    'a beginner-friendly and simple',
      critical:    'an opinionated and critical'
    };

    const sectionMap = {
      short:  '2 subheadings, short paragraph each, bullet list',
      medium: '3 subheadings, 2 paragraphs each, bullet list in one section',
      long:   '4 subheadings, 2-3 paragraphs each, bullet list'
    };

    const systemPrompt = `You write blog HTML. Rules:
- Use <h2> for headings, <p> for text, <ul><li> for bullet points
- Each <h2> must be a DIFFERENT topic — no repeating
- ALWAYS close every tag: <h2>...</h2>, <p>...</p>, <li>...</li>
- NEVER put text or <h2> inside a <p> — close </p> BEFORE starting <h2>
- Write naturally, 2-4 sentences per paragraph
- NO code blocks, NO pre tags, NO backticks, NO markdown
- NO [begin{code}, NO LaTeX, NO JavaScript
- NO "Frequ", "Frequ01", "Q1" labels — just write the heading text directly
- End with a detailed <h2>Conclusion</h2> (3-4 sentences)
- Return ONLY valid HTML. No <h1>.`;

    const toneInstr = toneMap[tone] || toneMap.informative;
    const sectionInstr = sectionMap[length] || sectionMap.medium;
    const customInstr = command ? `\n\nAdditional request from the author: ${command}` : '';

    const tokenBudget = length === 'short' ? 1536 : length === 'long' ? 3072 : 2048;

    const userPrompt = `Write ${toneInstr} blog post about: "${title}"

Structure: ${sectionInstr}.${customInstr}

Rules: Start with <h2>. Use bullet points. Write a detailed Conclusion paragraph (3-4 sentences). NO code. NO markdown. NO [begin{code}. Output ONLY HTML.`;

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

    let html = response.data?.message?.content || '';
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
    html = html.replace(/\\\[begin\{code\}.*?\\\[\/code\]/gs, '').replace(/\\\[begin\{enumerate\}.*?\\\[\/enumerate\]/gs, '');
    html = html.replace(/\\\[/g, '').replace(/\\\]/g, '');
    html = html.replace(/Frequ\d+\s*[:.]?\s*/gi, '');
    html = html.replace(/\bQ\d+[:.]?\s*/gi, '');
    html = html.replace(/<\/?(?:ol|ul)>\s*<\/?(?:li|ul|ol)>/g, '');
    html = html.replace(/<li>\s*<\/li>/g, '');
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.replace(/([^>])\s*<h2>/g, '$1</p>\n<h2>');
    html = html.replace(/<\/h2>\s*<p>/g, '</h2>\n<p>');

    if (!html) {
      return res.status(500).json({ success: false, message: 'AI returned empty response' });
    }

    const plainText = stripHtml(html);
    const firstSentence = extractFirstSentence(plainText);
    const summary = firstSentence.length > 20 ? firstSentence : plainText.slice(0, 200);

    res.json({
      success: true,
      content: html,
      slug: makeSlug(title),
      summary: summary.slice(0, 300),
      seoTitle: title.length > 70 ? title.slice(0, 67) + '...' : title,
      seoDescription: summary.slice(0, 155),
      keywords: extractKeywords(plainText),
      category: matchCategory(title + ' ' + plainText)
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
