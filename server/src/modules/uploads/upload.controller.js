const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }).single('image');

function uploadImage(req, res, next) {
  upload(req, res, function (err) {
    if (err) return res.status(400).json({ success: false, message: 'Upload failed' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  });
}

module.exports = { uploadImage };
