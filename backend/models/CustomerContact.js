const mongoose = require('mongoose');

const customerContactSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternateNumber: { type: String },
  email: { type: String },
  address: { type: String },
  location: { type: String }, // Area / Region

  customerType: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Office', 'Apartment', 'Other'],
    default: 'Residential'
  },

  notes: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

// Text indices for quick searching
customerContactSchema.index({ customerName: 'text', mobileNumber: 'text', location: 'text', address: 'text' });

module.exports = mongoose.model('CustomerContact', customerContactSchema);
