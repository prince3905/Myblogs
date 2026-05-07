const express = require('express');
const router = express.Router();
const { uploadImage } = require('./upload.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.use(auth);
router.post('/upload', uploadImage);

module.exports = router;
