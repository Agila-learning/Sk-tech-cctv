const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  status: { 
    type: String, 
    enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday', 'sunday', 'sunday_present'], 
    default: 'present' 
  },
  checkIn: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    deviceInfo: { type: String }
  },
  checkOut: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    deviceInfo: { type: String }
  },
  hoursWorked: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ['automatic', 'manual', 'sunday_auto', 'holiday_auto'], 
    default: 'automatic' 
  },
  hourlyRate: { type: Number }, // Store rate at time of logging
  remarks: { type: String },
  adminRemarks: { type: String } // For manual overrides
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
