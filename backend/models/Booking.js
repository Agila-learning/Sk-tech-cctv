const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { 
    type: String, 
    required: true, 
    default: 'Installation',
    enum: ['Installation', 'Maintenance', 'Repair', 'Site Survey']
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled', 'cancellation_requested', 'cancellation_rejected'], 
    default: 'pending' 
  },
  address: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  scheduledDate: { type: Date, required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: String },
  notes: { type: String },
  price: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'cod'], 
    default: 'cod' 
  },
  cancellationReason: { type: String },
  cancellationRequested: { type: Boolean, default: false },
  cancellationRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationRequestReason: { type: String },
  cancellationRequestedAt: { type: Date },
  refundStatus: { 
    type: String, 
    enum: ['none', 'pending', 'processing', 'completed', 'failed'],
    default: 'none'
  },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancellationFeedback: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
