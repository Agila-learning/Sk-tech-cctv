const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  workProofs: {
    start: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number }
    },
    inProgress: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number }
    },
    completion: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number },
      remarks: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'started', 'in_progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  timeToComplete: {
    type: String // e.g. "2 hours", "1 day"
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
