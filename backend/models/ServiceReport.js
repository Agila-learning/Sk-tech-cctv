const mongoose = require('mongoose');

const serviceReportSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  customerName: { type: String, required: true },
  customerAddress: { type: String, required: true },
  serviceType: { type: String, required: true },
  
  problemIdentified: { type: String, required: true },
  workPerformed: { type: String, required: true },
  materialsUsed: [{ 
    name: String, 
    quantity: Number,
    costPerUnit: Number
  }],
  laborCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  totalServiceCost: { type: Number, default: 0 },
  
  technicianRemarks: String,
  startTime: { type: Date },
  endTime: { type: Date },
  workDuration: { type: String }, // Format: "Xh Ym"
  completionTime: { type: Date, default: Date.now },
  
  gpsLocation: {
    start: { lat: Number, lng: Number },
    end: { lat: Number, lng: Number }
  },
  
  photos: {
    before: String,
    during: [String],
    after: String
  },
  
  customerConfirmation: {
    status: { type: Boolean, default: false },
    signature: String, // Base64 or URL
    timestamp: Date
  },
  
  adminApproval: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reason: String,
    reviewedAt: Date
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceReport', serviceReportSchema);
