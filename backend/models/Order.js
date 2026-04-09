const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true, default: 0 },
  gstAmount: { type: Number, required: true, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'assigned', 'accepted', 'rejected', 'in_progress', 'shipped', 'delivered', 'completed', 'cancelled', 'on_hold'], 
    default: 'pending' 
  },
  orderType: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
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
  locationDetails: {
    landmark: String,
    city: String,
    pincode: String,
    gpsLocation: {
      lat: Number,
      lng: Number
    }
  },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  scheduledDate: { type: Date },
  scheduledSlot: { type: String }, // e.g. "10:00 - 12:00"
  dueDate: { type: Date },
  timeToComplete: { type: String }, // e.g. "2 hours", "4 hours"

  alternatePhone: { type: String },
  problemDescription: { type: String },
  category: { 
    type: String, 
    enum: ['installation', 'service', 'maintenance', 'consultation'],
    default: 'installation'
  },
  preferredTiming: { type: String },
  notes: { type: String },

  paymentMethod: { 
    type: String, 
    enum: ['upi', 'card', 'cod'],
    required: true,
    default: 'cod'
  },
  workStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'pending_blocked'],
    default: 'not_started'
  },
  trackingTimeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String }
  }],
  workProofs: {
    start: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number }
    },
    inProgress: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number }
    },
    completion: {
      url: String,
      timestamp: { type: Date },
      location: { lat: Number, lng: Number },
      remarks: String
    }
  },
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
  shortId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate a unique short ID for easier reference
orderSchema.pre('save', function(next) {
  if (!this.shortId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.shortId = result;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

