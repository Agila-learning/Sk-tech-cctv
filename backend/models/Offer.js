const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, unique: true },
  discountPercentage: { type: Number },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
  image: { type: String }
});

module.exports = mongoose.model('Offer', offerSchema);
