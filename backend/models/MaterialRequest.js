const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materials: [{
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String }, // e.g., 'm', 'pcs'
    remarks: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Provided'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
