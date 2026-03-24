const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  role: { type: String, enum: ['admin', 'technician', 'customer'], required: true },
  message: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { 
    type: String, 
    enum: [
      'new_order', 
      'technician_assigned', 
      'installation_update', 
      'announcement', 
      'rescheduled', 
      'cancelled', 
      'payment_confirmed', 
      'emergency',
      'subscription'
    ], 
    required: true 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
