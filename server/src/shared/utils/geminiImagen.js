const axios = require('axios');

/**
 * Generates an image using Google's Gemini Imagen 4.0 model (imagen-4.0-generate-001)
 * using the rotated list of keys available in the environment variables.
 * 
 * @param {string} promptText The prompt detailing the image content
 * @returns {Promise<string>} Base64 Data URI string ("data:image/jpeg;base64,...")
 */
async function callGeminiImagen(promptText) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEY is configured in the environment variables.');
  }

  const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  let lastErr = null;

  for (const key of keys) {
    try {
      console.log(`[Imagen API] Generating image via Imagen 4.0. Key suffix: ...${key.slice(-5)}`);
      
      const response = await axios.post(
        `${GEMINI_BASE_URL}/imagen-4.0-generate-001:predict?key=${key}`,
        {
          instances: [
            {
              prompt: promptText
            }
          ],
          parameters: {
            sampleCount: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1"
          }
        },
        {
          timeout: 45000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const base64Data = response.data?.predictions?.[0]?.bytesBase64Encoded;
      if (base64Data) {
        return `data:image/jpeg;base64,${base64Data}`;
      }
    } catch (err) {
      lastErr = err;
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[Imagen API] Key attempt failed: ${errorMsg}.`);
      
      // If the account has free tier limitations, abort and trigger early fallback
      if (errorMsg.includes('paid plans') || errorMsg.includes('billing') || errorMsg.includes('upgrade')) {
        throw new Error('PAID_PLAN_REQUIRED');
      }
    }
  }

  throw new Error(`All configured Gemini keys failed to generate an image. Last error was: ${lastErr ? lastErr.message : 'Unknown'}`);
}

module.exports = {
  callGeminiImagen
};
