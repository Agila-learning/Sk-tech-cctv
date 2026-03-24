const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  category: { 
    type: String, 
    enum: ['CCTV Cameras', 'Dome Cameras', 'Bullet Cameras', 'Wireless Cameras', 'PTZ Cameras', 'DVR / NVR', 'Accessories'],
    required: true 
  },
  description: { type: String, required: true },
  specifications: { type: Map, of: String },
  images: [{ type: String }], // Array of Cloudinary URLs
  viewImages: {
    front: { type: String },
    top: { type: String },
    bottom: { type: String },
    side: { type: String }
  },
  images360: [{ type: String }], // URLs for 360 view sequence
  videoUrl: { type: String },
  stock: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  features: [{ type: String }],
  warranty: { type: String },
  usage: { type: String, enum: ['indoor', 'outdoor', 'both'], default: 'both' },
  resolution: { type: String },
  viewCount: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  comparableSpecs: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
