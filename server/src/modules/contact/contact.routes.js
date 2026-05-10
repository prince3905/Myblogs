const express = require('express');
const router = express.Router();
const { submitContact, listMessages } = require('./contact.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.post('/contact', submitContact);
router.get('/admin/contact-messages', auth, listMessages);

module.exports = router;
