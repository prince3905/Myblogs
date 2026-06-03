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
    transformation: [{ width: 700, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
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

module.exports = { uploadImage };
