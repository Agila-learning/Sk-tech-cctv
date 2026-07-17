const mongoose = require('mongoose');

const productWarrantySchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  installationAddress: { type: String, required: true },
  invoiceNumber: { type: String },
  installationDate: { type: Date },
  warrantyExpiry: { type: Date },

  supplierName: { type: String, required: true },
  supplierContact: { type: String },

  productCategory: { type: String, required: true },
  productName: { type: String, required: true },
  brand: { type: String },
  modelNumber: { type: String },
  serialNumber: { type: String },
  
  issueDescription: { type: String, required: true },
  productImages: [{ type: String }],
  videoUpload: { type: String },

  technicianRemarks: { type: String },
  adminRemarks: { type: String },
  supplierRemarks: { type: String },

  resolution: { type: String },
  replacementProduct: { type: String },
  replacementDate: { type: Date },
  expectedResolutionDate: { type: Date },
  actualResolutionDate: { type: Date },

  followUpStatus: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  nextFollowUpDate: { type: Date },
  followUpNotes: [{
    note: String,
    date: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  status: {
    type: String,
    enum: [
      'Created', 
      'Submitted to Supplier', 
      'Supplier Reviewing', 
      'Waiting for Approval', 
      'Replacement Approved', 
      'Replacement Rejected', 
      'Product Replaced', 
      'Resolved', 
      'Closed', 
      'Cancelled'
    ],
    default: 'Created'
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });

module.exports = mongoose.model('ProductWarranty', productWarrantySchema);
