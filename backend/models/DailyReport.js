const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workDate: { type: Date, default: Date.now },
  startTime: { type: String },
  endTime: { type: String },
  workingHours: { type: Number },
  tasksCompleted: { type: Number, default: 0 },
  textReport: { type: String },
  voiceReportUrl: { type: String },
  transcript: { type: String },
  images: [{ type: String }],
  videos: [{ type: String }],
  materialUsed: [{
    item: { type: String },
    quantity: { type: Number }
  }],
  customerSignature: { type: String },
  issuesFaced: { type: String },
  tomorrowPlan: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Rework', 'pending', 'approved', 'rejected', 'rework'],
    default: 'Draft'
  },
  adminRemarks: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
