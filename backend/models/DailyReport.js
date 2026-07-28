const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayNumber: { type: Number },
  workDate: { type: Date, default: Date.now },
  startTime: { type: String }, // e.g. "09:00"
  endTime: { type: String }, // e.g. "17:00"
  workingHours: { type: Number },
  tasksCompleted: [{ type: String }],
  textReport: { type: String },
  voiceReportUrl: { type: String },
  transcript: { type: String },
  images: [{ type: String }],
  videos: [{ type: String }],
  materialUsed: [{ type: String }],
  customerSignature: { type: String },
  issuesFaced: { type: String },
  tomorrowPlan: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected', 'rework'], 
    default: 'draft' 
  },
  adminRemarks: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
