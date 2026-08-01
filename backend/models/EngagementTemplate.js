const mongoose = require('mongoose');

const engagementTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      'service_reminder', 
      'offer_discount', 
      'product_promotion', 
      'amc_warranty', 
      'security_awareness', 
      'customer_engagement', 
      'personalized'
    ],
    required: true 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EngagementTemplate', engagementTemplateSchema);
