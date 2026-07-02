const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { auth } = require('../middleware/auth');

// Validate Cloudinary credentials on load
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('[Upload] CRITICAL: Cloudinary env vars missing! CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET must be set.');
} else {
  console.log('[Upload] Cloudinary credentials loaded for cloud:', CLOUD_NAME);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key:    API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'sk-tech-products';
    if (req.query.type === 'workflow')  folderName = 'technician-workflow';
    else if (req.query.type === 'profile')   folderName = 'technicianprofile';
    else if (req.query.type === 'documents') folderName = 'documents';
    else if (req.query.type === 'expense')   folderName = 'sk-tech-expenses';
    else if (req.query.type === 'category')  folderName = 'sk-tech-categories';

    return {
      folder: folderName,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      resource_type: 'auto',
    };
  },
});

// 10 MB per file limit
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/', auth, (req, res) => {
  upload.array('images', 12)(req, res, (err) => {
    if (err) {
      // Multer or Cloudinary error
      console.error('[Upload Error]', {
        message: err.message,
        code: err.code,
        field: err.field,
        stack: err.stack?.split('\n')[0]
      });

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).send({ error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send({ error: `Unexpected field: ${err.field}. Use "images".` });
      }
      return res.status(500).send({
        error: 'File upload failed',
        details: err.message,
        code: err.code
      });
    }

    if (!req.files || req.files.length === 0) {
      console.warn('[Upload] No files received. Content-Type:', req.headers['content-type']);
      return res.status(400).send({ error: 'No files provided. Ensure field name is "images" and Content-Type is multipart/form-data.' });
    }

    try {
      const imageUrls = req.files.map(file => file.path);
      const imageUrl  = imageUrls[0];
      console.log(`[Upload] Success: ${imageUrls.length} file(s) uploaded to Cloudinary →`, imageUrl);

      res.send({
        imageUrls,
        imageUrl,
        message: 'Files uploaded successfully to Cloudinary'
      });
    } catch (processErr) {
      console.error('[Upload Error] Post-processing Error:', processErr);
      res.status(500).send({ error: 'Error processing uploaded files' });
    }
  });
});

module.exports = router;
