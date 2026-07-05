const express = require('express');
const router = express.Router();
const { uploadImage, generateAiThumbnail } = require('./upload.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.use(auth);
router.post('/upload', uploadImage);
router.post('/generate-thumbnail', generateAiThumbnail);

module.exports = router;
