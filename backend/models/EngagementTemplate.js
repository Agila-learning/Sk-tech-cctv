const mongoose = require('mongoose');

const engagementTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      'Service Reminder', 
      'Product Promotion', 
      'Offer', 
      'Security Tip', 
      'Customer Engagement', 
      'Personalized'
    ], 
    required: true 
  },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EngagementTemplate', engagementTemplateSchema);
