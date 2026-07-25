const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayNumber: { type: Number, required: true },
  workDate: { type: Date, default: Date.now },
  startTime: { type: String },
  endTime: { type: String },
  description: { type: String, required: true },
  progress: { type: Number, required: true }, // percentage 1-100
  remarks: { type: String }, // issues / remarks
  photos: [{ type: String }],
  voiceNoteUrl: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'rework'], default: 'pending' },
  adminRemarks: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
