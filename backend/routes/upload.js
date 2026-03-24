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

// Setup Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sk-tech-products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  },
});

const upload = multer({ storage });

router.post('/', auth, upload.array('images', 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ error: 'No files provided' });
  }
  
  // Cloudinary returns the full SSL URL in 'path'
  const imageUrls = req.files.map(file => file.path);
  const imageUrl = imageUrls[0]; 

  res.send({ 
    imageUrls, 
    imageUrl, 
    message: 'Files uploaded successfully to Cloudinary' 
  });
});

module.exports = router;
