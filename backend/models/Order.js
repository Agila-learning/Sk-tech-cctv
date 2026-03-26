const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'assigned', 'accepted', 'rejected', 'in_progress', 'shipped', 'delivered', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  installationRequired: { type: Boolean, default: false },
  preferredDate: { type: Date },
  installationSlot: { type: Date },
  deliveryAddress: { type: String, required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  scheduledDate: { type: Date },
  scheduledSlot: { type: String }, // e.g. "10:00 - 12:00"

  paymentMethod: { 
    type: String, 
    enum: ['upi', 'card', 'cod'],
    required: true,
    default: 'cod'
  },
  workStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  trackingTimeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String }
  }],
  feedback: {
    rating: { type: Number },
    comment: { type: String },
    images: [{ type: String }]
  },
  rescheduledTo: { type: Date },
  rescheduleReason: { type: String },
  rescheduleStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
