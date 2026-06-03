const axios = require('axios');

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=700&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=700&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=700&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=700&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=700&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=700&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=80',
];

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function pickFallback(query) {
  const hash = query ? query.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return HERO_PHOTOS[Math.abs(hash) % HERO_PHOTOS.length];
}

async function searchPexelsImage(req, res) {
  try {
    const { query, page = 1 } = req.body;
    if (!query || !query.trim()) {
      return res.json({ imageUrl: pickFallback('blog') });
    }

    let imageUrl = null;

    if (PEXELS_API_KEY) {
      try {
        const response = await axios.get('https://api.pexels.com/v1/search', {
          params: { query: query.trim(), per_page: 10, page },
          headers: { Authorization: PEXELS_API_KEY },
          timeout: 8000,
        });
        const photos = response.data?.photos;
        if (photos && photos.length > 0) {
          const idx = Math.abs(page) % photos.length;
          imageUrl = (photos[idx].src.large || photos[idx].src.medium)
            .replace(/h=\d+/g, 'h=350').replace(/w=\d+/g, 'w=500');
        }
      } catch (err) {
        console.error('Pexels API error:', err.message);
      }
    }

    if (!imageUrl) {
      imageUrl = pickFallback(query + page);
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error('Pexels controller error:', error.message);
    res.json({ imageUrl: pickFallback('blog') });
  }
}

module.exports = { searchPexelsImage };