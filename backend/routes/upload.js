const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { auth } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'sk-tech-products';
    if (req.query.type === 'workflow') folderName = 'technician-workflow';
    else if (req.query.type === 'profile') folderName = 'technicianprofile';
    else if (req.query.type === 'documents') folderName = 'documents';
    
    return {
      folder: folderName,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    };
  },
});

const upload = multer({ storage });

router.post('/', auth, (req, res, next) => {
  upload.array('images', 12)(req, res, (err) => {
    if (err) {
      console.error('[Upload Error] Multer/Cloudinary Error:', err);
      return res.status(500).send({ 
        error: 'File upload failed', 
        details: err.message,
        code: err.code 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ error: 'No files provided' });
    }
    
    try {
      // Cloudinary returns the full SSL URL in 'path'
      const imageUrls = req.files.map(file => file.path);
      const imageUrl = imageUrls[0]; 

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
