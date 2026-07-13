const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrName: { type: String, required: true },
  category: { type: String, required: true },
  customCategory: { type: String }, // Used when category is 'Custom'
  qrImage: { type: String }, // Image URL if uploaded as image
  description: { type: String },
  displayOrder: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  icon: { type: String }, // Icon identifier/name
  color: { type: String }, // Hex color code
  targetType: { type: String, enum: ['UPI', 'URL', 'Image', 'Text'], default: 'Image' },
  targetValue: { type: String }, // e.g., the UPI ID or URL to copy/open
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' }
});

module.exports = mongoose.model('QRCode', qrCodeSchema, 'QR_Codes');
