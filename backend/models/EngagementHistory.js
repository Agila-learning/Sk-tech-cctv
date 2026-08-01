const mongoose = require('mongoose');

const engagementHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EngagementTemplate', required: true },
  category: { type: String, required: true }, // Redundant but fast for queries
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
});

module.exports = mongoose.model('EngagementHistory', engagementHistorySchema);
