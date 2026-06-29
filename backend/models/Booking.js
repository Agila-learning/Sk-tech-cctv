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
    enum: ['pending', 'confirmed', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  address: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
