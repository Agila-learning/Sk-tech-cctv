const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

const { auth } = require('../middleware/auth');

router.post('/', auth, upload.array('images', 12), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send({ error: 'No files provided' });
  
  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
  // Backwards compatibility for single-file users (like the old handleUpload)
  const imageUrl = imageUrls[0]; 

  res.send({ imageUrls, imageUrl, message: 'Files uploaded successfully' });
});

module.exports = router;
