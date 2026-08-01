const mongoose = require('mongoose');

const engagementLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EngagementTemplate' },
  category: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Delivered', 'Failed'], default: 'Delivered' }
}, { timestamps: true });

// Create an index to quickly find the latest log for a user and template
engagementLogSchema.index({ userId: 1, templateId: 1, sentAt: -1 });

module.exports = mongoose.model('EngagementLog', engagementLogSchema);
