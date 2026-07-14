const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: { type: String },
  icon: { type: String },
  bannerImageDesktop: { type: String },
  bannerImageMobile: { type: String },
  image: { type: String }, // Used as thumbnail
  description: { type: String },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  displayPriority: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  showOnHome: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  filters: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
