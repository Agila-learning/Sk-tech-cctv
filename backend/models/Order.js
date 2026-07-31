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
  gstPercentage: { type: Number, default: 18 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'assigned', 'accepted', 'rejected', 'in_progress', 'travel_started', 'reached_site', 'paused', 'waiting_for_material', 'waiting_for_customer', 'testing', 'shipped', 'delivered', 'completed', 'cancelled', 'on_hold', 'pending_approval', 'pending_admin_approval', 'rework_requested', 'rework', 'cancellation_requested', 'cancellation_rejected'], 
    default: 'pending' 
  },
  orderType: {
    type: String,
    enum: ['online', 'offline', 'warranty'],
    default: 'online'
  },
  dailyReports: [{
    dayNumber: Number,
    status: String,
    photos: [String],
    voiceNoteUrl: String,
    workDescription: String,
    issuesRemarks: String,
    progressPercent: String,
    location: {
      lat: Number,
      lng: Number,
      address: String,
      timestamp: Date
    },
    timestamp: { type: Date, default: Date.now },
    approvedByAdmin: { type: Boolean, default: false },
    reworkRequested: { type: Boolean, default: false },
    adminNotes: String
  }],
  expectedDays: { type: Number, default: 1 },
  serviceType: { type: String },
  cameraDetails: { type: String },
  warrantyPeriod: { type: String, default: '12 Months' },
  warrantyEndDate: { type: Date },
  warrantyStatus: { type: String, default: 'Valid' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  installationRequired: { type: Boolean, default: false },
  preferredDate: { type: Date },
  installationSlot: { type: Date },
  deliveryAddress: { type: String, required: true },
  liveLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  bookingFor: {
    type: String,
    enum: ['self', 'other'],
    default: 'self'
  },
  locationDetails: {
    landmark: String,
    city: String,
    pincode: String,
    gpsLocation: {
      lat: Number,
      lng: Number
    }
  },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Acts as Primary Technician
  supportingTechnicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Acts as Secondary Technicians
  helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignmentMode: { type: String, enum: ['manual', 'auto', 'hybrid'], default: 'manual' },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  scheduledDate: { type: Date },
  scheduledSlot: { type: String }, // e.g. "10:00 - 12:00"
  dueDate: { type: Date },
  timeToComplete: { type: String }, // e.g. "2 hours", "4 hours"
  isStockDecremented: { type: Boolean, default: false },

  alternatePhone: { type: String },
  problemDescription: { type: String },
  category: { 
    type: String, 
    enum: ['installation', 'service', 'maintenance', 'consultation'],
    default: 'installation'
  },
  preferredTiming: { type: String },
  notes: { type: String },
  warranty: { type: String, default: '12 Months' },
  warrantyStartDate: { type: Date },
  location: {
    address: String,
    lat: Number,
    lng: Number
  },

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
      audioUrl: String,
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
  cancellationReason: { type: String },
  cancellationFeedback: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationDate: { type: Date },
  cancellationSource: { type: String, enum: ['customer_app', 'customer_web', 'technician_app', 'admin_dashboard', 'system'] },
  refundStatus: { type: String, enum: ['none', 'pending', 'processing', 'completed', 'failed'], default: 'none' },
  cancellationApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  previousStatus: { type: String }, // To track the status prior to cancellation request for restoration
  shortId: { type: String, unique: true },
  isWarrantyClaim: { type: Boolean, default: false },
  parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  completedAt: { type: Date },
  inventoryDeducted: { type: Boolean, default: false },
  pauseHistory: [{
    reason: { type: String },
    pausedAt: { type: Date },
    resumedAt: { type: Date }
  }],
  teamChatRoomId: { type: String },
  // Enterprise Cancellation Workflow Fields
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

// Automated Inventory Tracking
orderSchema.pre('save', async function(next) {
  try {
    if (this.isModified('status') && (this.status === 'completed' || this.status === 'delivered') && !this.inventoryDeducted) {
      if (this.products && this.products.length > 0) {
        const Product = mongoose.model('Product');
        const Notification = mongoose.model('Notification');
        
        for (const item of this.products) {
          if (item.product) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock = Math.max(0, product.stock - item.quantity);
              await product.save();
              
              if (product.stock <= 5) {
                await Notification.create({
                  role: 'admin',
                  type: 'general',
                  message: `CRITICAL INVENTORY ALERT: ${product.name} (${product.brand}) stock is critically low. Only ${product.stock} units remaining!`
                });
              }
            }
          }
        }
      }
      this.inventoryDeducted = true;
    }
    next();
  } catch (error) {
    console.error('Inventory Tracking Error:', error);
    next(error);
  }
});

module.exports = mongoose.model('Order', orderSchema);
