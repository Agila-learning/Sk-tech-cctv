const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
  manualCustomer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  gstNumber: { type: String },
  companyLogo: { type: String }, // For custom branding override
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  items: [{
    description: { type: String, required: true },
    category: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 }, // GST amount
  taxRate: { type: Number, default: 18 }, // GST rate percentage
  discountAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'], 
    default: 'draft' 
  },
  dueDate: { type: Date },
  paidAt: { type: Date },
  paymentMethod: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
