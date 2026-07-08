const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'drkm1wo9o',
  api_key: '479412262566892',
  api_secret: '_J0pP4VbLy-TL5vAVoRpaFjJFxg',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'myblogs',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

function uploadImage(req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE')
          return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: req.file.path });
  });
}

const { generateImagePrompt } = require('../ai/ai.controller');

function getPhotographicFallbackPrompt(title) {
  const lower = title.toLowerCase();
  
  if (lower.includes('krashi') || lower.includes('agri') || lower.includes('agriculture') || lower.includes('kisan') || lower.includes('farmer')) {
    return 'Green lush agriculture crop field, modern farming, tractor path, natural bright daylight';
  }
  if (lower.includes('police') || lower.includes('constable') || lower.includes('inspector') || lower.includes('si') || lower.includes('bpssc') || lower.includes('daroga') || lower.includes('jail')) {
    return 'Official police badge on professional desk, police station background, dramatic natural lighting';
  }
  if (lower.includes('teacher') || lower.includes('tet') || lower.includes('jhtet') || lower.includes('school') || lower.includes('kvs') || lower.includes('tgt') || lower.includes('pgt') || lower.includes('ctet')) {
    return 'A neat classroom teacher desk with stacks of books, notebook, and glasses, chalkboard background';
  }
  if (lower.includes('railway') || lower.includes('rrc') || lower.includes('rrb') || lower.includes('train') || lower.includes('station')) {
    return 'Modern train approaching passenger platform, high speed railway station, motion blur, natural light';
  }
  if (lower.includes('navy') || lower.includes('coast') || lower.includes('army') || lower.includes('force') || lower.includes('airforce') || lower.includes('military') || lower.includes('soldier')) {
    return 'Military defense aircraft jet fighter on runway tarmac, hangar background, majestic sunset lighting';
  }
  if (lower.includes('bank') || lower.includes('sbi') || lower.includes('ibps') || lower.includes('finance') || lower.includes('clerk') || lower.includes('rbi')) {
    return 'A modern bank office interior, secure vault gate in distance, financial papers on table';
  }
  if (lower.includes('medical') || lower.includes('doctor') || lower.includes('nurse') || lower.includes('hospital') || lower.includes('health') || lower.includes('aiims') || lower.includes('pharmacist')) {
    return 'A professional stethoscope resting on medical reports, bright modern hospital corridor background';
  }
  if (lower.includes('computer') || lower.includes('tech') || lower.includes('it') || lower.includes('software') || lower.includes('engineer')) {
    return 'Modern tech office workstation with glowing computer monitors, code lines visible, desk lamp';
  }
  if (lower.includes('admit card') || lower.includes('admitcard') || lower.includes('hall ticket') || lower.includes('exam')) {
    return 'An examination desk with printed exam hall ticket, pen, and student ID card, focused lighting';
  }
  if (lower.includes('result') || lower.includes('merit') || lower.includes('marks') || lower.includes('score')) {
    return 'A graduation cap resting on a study table next to open books, celebration background, warm lighting';
  }
  
  return 'A professional wooden office desk with official documents, gold pen, and calculator, cozy corporate workspace';
}

async function generateAiThumbnail(req, res) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log(`[AI Thumbnail] Generating image prompt for: "${title}"`);
    let prompt = '';
    try {
      prompt = await generateImagePrompt(title);
      console.log(`[AI Thumbnail] Gemini generated prompt: "${prompt}"`);
    } catch (aiErr) {
      console.error('[AI Thumbnail] Gemini prompt generation failed, using keyword fallback prompt:', aiErr.message);
      prompt = getPhotographicFallbackPrompt(title);
    }

    const mainPart = title.split(/[:|]/)[0].trim();
    const words = mainPart.split(/\s+/);
    const overlayText = words.length > 5 ? words.slice(0, 4).join(' ').toUpperCase() : mainPart.toUpperCase();

    // Force CTR optimized infographic/poster style with bold text overlay
    const styledPrompt = `${prompt}, high-CTR blog post thumbnail design, vibrant yellow and deep navy blue contrasting color theme, clean layout, professional graphic design style`;

    // Generate image using Pollinations AI
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(styledPrompt)}?width=1200&height=675&nologo=true&seed=${seed}`;

    console.log(`[AI Thumbnail] Uploading Pollinations URL to Cloudinary: ${pollinationsUrl}`);
    const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
      folder: 'myblogs',
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });

    console.log(`[AI Thumbnail] Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('[AI Thumbnail] General error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate AI thumbnail' });
  }
}

const cheerio = require('cheerio');

async function fixImagesSeoRoute(req, res) {
  try {
    const { content, title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required for SEO generation' });
    }

    if (!content) {
      return res.json({ success: true, content: '', fixedCount: 0 });
    }

    // Load without html/body wrappers
    const $ = cheerio.load(content, null, false);
    const imgs = $('img');
    let fixedCount = 0;

    imgs.each((idx, elem) => {
      const $img = $(elem);
      let alt = $img.attr('alt');

      // Check if alt is missing, empty, or generic
      const isGeneric = !alt || !alt.trim() || ['image', 'img', 'photo', 'placeholder', 'pic', 'thumbnail', 'undefined'].includes(alt.toLowerCase().trim());

      if (isGeneric) {
        const cleanTitle = title.trim().replace(/<\/?[^>]+>/g, '');
        let optimizedAlt = cleanTitle;
        if (idx > 0) {
          optimizedAlt += ` details ${idx + 1}`;
        }
        $img.attr('alt', optimizedAlt);
        fixedCount++;
      }
    });

    res.json({
      success: true,
      content: $.html(),
      fixedCount
    });
  } catch (error) {
    console.error('[Image SEO] Fix error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to fix image SEO' });
  }
}

async function getImagePromptRoute(req, res) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log(`[AI Image Prompt Route] Generating prompt for: "${title}"`);
    let prompt = '';
    try {
      prompt = await generateImagePrompt(title);
    } catch (aiErr) {
      console.error('[AI Image Prompt Route] Prompt generation failed, using fallback:', aiErr.message);
      prompt = getPhotographicFallbackPrompt(title);
    }

    const mainPart = title.split(/[:|]/)[0].trim();
    const words = mainPart.split(/\s+/);
    const overlayText = words.length > 5 ? words.slice(0, 4).join(' ').toUpperCase() : mainPart.toUpperCase();

    const styledPrompt = `${prompt}, natural realistic photograph style, authentic look, clear natural lighting, clean composition, high quality, no cartoon, no drawings, with a bold high-contrast text overlay that reads "${overlayText}" clearly visible on the image`;

    res.json({
      success: true,
      prompt: styledPrompt
    });
  } catch (error) {
    console.error('[AI Image Prompt Route] General error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate prompt' });
  }
}

async function generateAiThumbnailFromPrompt(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    console.log(`[AI Thumbnail Custom] Generating image for custom prompt: "${prompt}"`);

    // Generate image using Pollinations AI
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=1200&height=675&nologo=true&seed=${seed}`;

    console.log(`[AI Thumbnail Custom] Uploading Pollinations URL to Cloudinary: ${pollinationsUrl}`);
    const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
      folder: 'myblogs',
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });

    console.log(`[AI Thumbnail Custom] Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('[AI Thumbnail Custom] General error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate AI thumbnail' });
  }
}

module.exports = { uploadImage, generateAiThumbnail, fixImagesSeoRoute, getPhotographicFallbackPrompt, getImagePromptRoute, generateAiThumbnailFromPrompt };
