const mongoose = require('mongoose');

const taskMessageSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  content: { type: String },
  voiceUrl: { type: String },
  images: [{ type: String }],
  pdfUrl: { type: String },
  videoUrl: { type: String },
  
  messageType: {
    type: String,
    enum: ['text', 'voice', 'image', 'video', 'pdf', 'material_request'],
    default: 'text'
  },
  
  materialRequest: {
    items: [{
      name: String,
      quantity: Number,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

// Text index for global search
taskMessageSchema.index({ content: 'text' });

module.exports = mongoose.model('TaskMessage', taskMessageSchema);
