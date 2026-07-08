const express = require('express');
const router = express.Router();
const { uploadImage, generateAiThumbnail, fixImagesSeoRoute, getImagePromptRoute, generateAiThumbnailFromPrompt } = require('./upload.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.use(auth);
router.post('/upload', uploadImage);
router.post('/generate-thumbnail', generateAiThumbnail);
router.post('/generate-thumbnail-from-prompt', generateAiThumbnailFromPrompt);
router.post('/get-image-prompt', getImagePromptRoute);
router.post('/fix-images-seo', fixImagesSeoRoute);

module.exports = router;
