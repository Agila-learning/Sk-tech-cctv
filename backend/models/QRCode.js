const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Payment',
      'Social Media',
      'Website',
      'WiFi',
      'Customer Support',
      'Business',
      'Marketing',
      'Documents',
      'Other',
      'Custom'
    ],
  },
  customCategory: {
    type: String,
    trim: true,
  },
  qrImage: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'QrCode',
  },
  color: {
    type: String,
    default: '#3b82f6', // default blue
  },
  targetType: {
    type: String,
    trim: true,
  },
  targetValue: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
});

// Create compound index for sorting and filtering
qrCodeSchema.index({ status: 1, displayOrder: 1 });
qrCodeSchema.index({ category: 1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
