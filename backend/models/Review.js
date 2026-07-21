const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  variant: { type: String },

  // General Review Info
  title: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  recommendProduct: { type: Boolean, default: true },

  // Detailed Ratings (Optional)
  installationRating: { type: Number, min: 1, max: 5 },
  productRating: { type: Number, min: 1, max: 5 },
  technicianRating: { type: Number, min: 1, max: 5 },
  valueForMoney: { type: Number, min: 1, max: 5 },
  easyToUse: { type: Number, min: 1, max: 5 },
  overallExperience: { type: Number, min: 1, max: 5 },

  // Media (max 5 images enforced on save or API level)
  images: [{ type: String }],
  videoUrl: { type: String },
  isAnonymous: { type: Boolean, default: false },
  isVerifiedPurchase: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  verifiedInstallation: { type: Boolean, default: false },
  topRated: { type: Boolean, default: false },
  technicianRecommended: { type: Boolean, default: false },
  
  // Moderation
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  publishStatus: { type: Boolean, default: false }, // true = Live
  adminReply: { type: String },
  
  // Engagement
  helpfulCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
