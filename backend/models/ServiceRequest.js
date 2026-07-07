const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serialNumber: {
    type: String,
    trim: true,
    description: "Optional serial number or QR lookup for manual verification"
  },
  serviceType: {
    type: String,
    enum: ['Warranty', 'AMC', 'Paid', 'Free Warranty Service', 'Free AMC Visit', 'Paid Service'],
    required: true
  },
  installationAddress: {
    type: String,
    required: true
  },
  installedProduct: {
    type: String,
    required: true
  },
  issueCategory: {
    type: String,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  media: [{
    type: String // URLs for photos/videos
  }],
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String
  },
  
  // Verification
  adminVerification: {
    verifiedType: {
      type: String,
      enum: ['Free Warranty Service', 'Free AMC Visit', 'Paid Service', 'Pending Customer Response', 'Rejected', null]
    },
    remarks: String,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // State Machine
  status: {
    type: String,
    enum: [
      'Submitted', 
      'Under Verification', 
      'Warranty Verified',
      'AMC Verified',
      'Paid Service Required',
      'Pending Customer Response',
      'Waiting Approval', // Customer approval for estimate
      'Payment Pending',
      'Rejected',
      'Technician Assigned',
      'Technician Accepted',
      'On the Way',
      'Reached Site',
      'Inspection Started',
      'Inspection Completed',
      'Waiting Spare Parts',
      'Spare Parts Received',
      'Repair Started',
      'Testing',
      'Customer Verification', // Pending sign-off
      'Service Completed',
      'Closed'
    ],
    default: 'Submitted'
  },
  
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    media: [String]
  }],

  // Operations
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gpsTracking: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  
  // Logistics
  spareParts: [{
    partName: String,
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Ordered', 'Received', 'Rejected'],
      default: 'Requested'
    },
    cost: { type: Number, default: 0 },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date
  }],

  // Financials
  estimate: {
    amount: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    partsCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    pdfUrl: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'N/A'],
    default: 'N/A' // N/A for Free Warranty/AMC
  },

  // Completion
  serviceReport: {
    beforePhotos: [String],
    afterPhotos: [String],
    customerSignature: String,
    technicianRemarks: String,
    completedAt: Date,
    reportPdfUrl: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
