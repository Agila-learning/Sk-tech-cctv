const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'general', 'urgent', 'policy', 'technical', 'incentive'], 
    default: 'general' 
  },
  targetAudience: { type: String, enum: ['all', 'technician', 'customer', 'technicians', 'customers'], default: 'all' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
