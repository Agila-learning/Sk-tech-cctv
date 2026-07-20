const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  preferredTime: { type: String },
  interest: { type: String }, // e.g. "Home", "Office"
  source: { type: String, default: 'Chatbot' },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
