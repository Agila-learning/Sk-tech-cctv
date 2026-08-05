const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: { type: String },
  voiceUrl: { type: String },
  attachments: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  content: { type: String },
  voiceUrl: { type: String },
  images: [{ type: String }],
  pdfUrl: { type: String },
  location: { type: String }, // optional location context string or coords
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceReport' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },

  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  replies: [replySchema],

  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false }

}, { timestamps: true });

// Text index for global search
noteSchema.index({ content: 'text' });

module.exports = mongoose.model('Note', noteSchema);
