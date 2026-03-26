const mongoose = require('mongoose');

// Defines working hours, days, and shifts for each technician
const technicianScheduleSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workingDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  shiftStart: { type: String, default: '09:00' }, // 24h format
  shiftEnd: { type: String, default: '18:00' },
  breakStart: { type: String, default: '13:00' },
  breakEnd: { type: String, default: '14:00' },
  maxJobsPerDay: { type: Number, default: 4 },
  serviceArea: { type: String }, // e.g. "Krishnagiri", "Shoolagiri"
  skills: [String], // e.g. ["CCTV", "Biometric", "Networking"]
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TechnicianSchedule', technicianScheduleSchema);
