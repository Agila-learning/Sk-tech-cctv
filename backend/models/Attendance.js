const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent', 'on_leave'], default: 'present' },
  checkIn: { type: Date },
  checkOut: { type: Date },
  remarks: { type: String }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
