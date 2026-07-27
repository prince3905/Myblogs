const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Automatically generates a high-CTR, professional 1200x675 HD thumbnail banner image for any post.
 * Uploads to Cloudinary (or returns optimized CDN URL) so featuredImage is never broken or missing.
 */
async function generateAutoBanner(title, category = 'Sarkari Jobs & Exams') {
  if (!title || typeof title !== 'string') {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
  }

  const cleanTitle = title.split(/[:|]/)[0].trim();
  const styledPrompt = `High-CTR news thumbnail banner for "${cleanTitle}", Indian Sarkari Job Alert style, bold clear poster text theme, professional navy blue and gold accent background, high resolution 4k graphic design`;

  try {
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(styledPrompt)}?width=1200&height=675&nologo=true&seed=${seed}&model=flux`;

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
        folder: 'myblogs',
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'webp' }],
      });

      if (uploadResult && uploadResult.secure_url) {
        console.log(`[AutoBanner] Successfully generated & uploaded banner to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
      }
    }

    return pollinationsUrl;
  } catch (err) {
    console.warn('[AutoBanner] Cloudinary upload notice, using direct CDN banner fallback:', err.message);
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/p/${encodeURIComponent(styledPrompt)}?width=1200&height=675&nologo=true&seed=${seed}&model=flux`;
  }
}

module.exports = { generateAutoBanner };
