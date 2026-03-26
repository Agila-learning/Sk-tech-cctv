const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  technician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  }, // e.g., "10:00"
  endTime: { 
    type: String, 
    required: true 
  }, // e.g., "12:00"
  isBooked: { 
    type: Boolean, 
    default: false 
  },
  // Enhanced availability tracking
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked', 'leave'],
    default: 'available'
  },
  jobStatus: {
    type: String,
    enum: ['assigned', 'on_way', 'in_progress', 'completed'],
    default: null
  },
  reason: {
    type: String, // reason for unavailability (leave, blocked, etc.)
    default: null
  },
  serviceArea: {
    type: String, // e.g., "Krishnagiri", "Shoolagiri"
    default: null
  },
  skillRequired: {
    type: String, // e.g., "CCTV", "Biometric", "Networking"
    default: null
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index to prevent duplicate slots for same technician/time
slotSchema.index({ technician: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
