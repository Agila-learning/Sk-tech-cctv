const mongoose = require('mongoose');

const workOrderMessageSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'voice', 'image', 'video', 'document', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    url: String,
    fileName: String,
    mimeType: String
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorkOrderMessage', workOrderMessageSchema);
