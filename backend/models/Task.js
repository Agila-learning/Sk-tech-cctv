const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  liveLocation: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignee: { // Acts as Primary Technician
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }, // Acts as Primary Technician
  supportingTechnicians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignmentMode: {
    type: String,
    enum: ['manual', 'auto', 'hybrid'],
    default: 'manual'
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
    enum: [
      'pending', 'started', 'in_progress', 'completed', 'declined', // Old statuses for backward compat
      'Assigned', 'Accepted', 'Travelling', 'Reached Site', 'Work Started', 
      'Waiting for Material', 'Paused', 'Resume', 'Quality Check', 'Closed'
    ],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
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
  warranty: {
    type: String,
    default: '12 Months'
  },
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  dailyLogs: [{
    date: { type: Date },
    progressText: String,
    images: [String],
    voiceNotes: [String],
    materialUsage: String,
    remarks: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  attendance: [{
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkInTime: Date,
    checkInLocation: { lat: Number, lng: Number },
    checkInPhoto: String,
    checkOutTime: Date,
    checkOutLocation: { lat: Number, lng: Number },
    workingHours: Number
  }],
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
