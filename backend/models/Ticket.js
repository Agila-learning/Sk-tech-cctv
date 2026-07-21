const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // allow guest tickets initially
  },
  customerName: { type: String },
  customerMobile: { type: String },
  address: { type: String },
  subject: {
    type: String,
    trim: true,
    default: 'Support Ticket'
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'Installation', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  history: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
